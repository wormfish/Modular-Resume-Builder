/**
 * speechTranscriber.js
 * Real-time Speech-to-Text utility supporting:
 * 1. Live real-time speech streaming via Web Speech API (interim & final results)
 * 2. On-device Open-Source Whisper model (Xenova/whisper-tiny.en) running via @xenova/transformers
 */

let transcriberPipeline = null;
let isPipelineLoading = false;
let pipelineLoadPromise = null;

/**
 * Lazy loads the open-source Whisper model pipeline
 */
export async function loadWhisperModel(onProgress) {
  if (transcriberPipeline) return transcriberPipeline;
  if (pipelineLoadPromise) return pipelineLoadPromise;

  pipelineLoadPromise = (async () => {
    try {
      isPipelineLoading = true;
      const { pipeline, env } = await import('@xenova/transformers');
      
      // Allow remote models from HuggingFace
      env.allowLocalModels = false;
      
      transcriberPipeline = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
          progress_callback: (p) => {
            if (typeof onProgress === 'function') {
              onProgress(p);
            }
          },
        }
      );
      isPipelineLoading = false;
      return transcriberPipeline;
    } catch (err) {
      isPipelineLoading = false;
      pipelineLoadPromise = null;
      console.warn('Failed to load local Whisper model, relying on live browser speech engine:', err);
      return null;
    }
  })();

  return pipelineLoadPromise;
}

/**
 * Check if speech recognition or microphone is supported
 */
export function isVoiceSupported() {
  const hasMediaDevices = typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  return hasMediaDevices || !!SpeechRec;
}

/**
 * Resample audio buffer to 16kHz mono Float32Array for Whisper
 */
function resampleTo16k(audioBuffer) {
  const targetSampleRate = 16000;
  const numChannels = audioBuffer.numberOfChannels;
  const sourceSampleRate = audioBuffer.sampleRate;

  // Mono mixdown
  let mono;
  if (numChannels === 1) {
    mono = audioBuffer.getChannelData(0);
  } else {
    mono = new Float32Array(audioBuffer.length);
    for (let c = 0; c < numChannels; c++) {
      const ch = audioBuffer.getChannelData(c);
      for (let i = 0; i < audioBuffer.length; i++) {
        mono[i] += ch[i] / numChannels;
      }
    }
  }

  if (sourceSampleRate === targetSampleRate) {
    return mono;
  }

  // Linear interpolation resampling
  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(mono.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const originIdx = i * ratio;
    const leftIdx = Math.floor(originIdx);
    const rightIdx = Math.min(leftIdx + 1, mono.length - 1);
    const weight = originIdx - leftIdx;
    result[i] = mono[leftIdx] * (1 - weight) + mono[rightIdx] * weight;
  }

  return result;
}

/**
 * SpeechSession controller managing live microphone recording and real-time transcription
 */
export class SpeechSession {
  constructor({
    onTranscript,      // (text, isFinal, source) => void
    onStatusChange,    // (status: 'idle' | 'requesting' | 'listening' | 'processing' | 'error', message?: string) => void
    onError,           // (errorMessage: string) => void
  } = {}) {
    this.onTranscript = onTranscript;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    this.active = false;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognition = null;
    this.audioContext = null;

    this.finalText = '';
    this.interimText = '';
  }

  /**
   * Start listening and transcribing in real-time
   */
  async start(initialText = '') {
    if (this.active) return;
    this.active = true;
    this.finalText = initialText ? (initialText.trim() ? `${initialText.trim()} ` : '') : '';
    this.interimText = '';

    if (this.onStatusChange) {
      this.onStatusChange('requesting', 'Requesting microphone access...');
    }

    try {
      // 1. Request microphone access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      if (!this.active) {
        this.cleanup();
        return;
      }

      // 2. Setup Web Speech API for instant 0-latency live streaming word-by-word
      const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (event) => {
            if (!this.active) return;
            let currentInterim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const res = event.results[i];
              const transcript = res[0]?.transcript || '';
              if (res.isFinal) {
                this.finalText += `${transcript.trim()} `;
              } else {
                currentInterim += transcript;
              }
            }
            this.interimText = currentInterim;
            const fullText = (this.finalText + this.interimText).trim();
            if (this.onTranscript) {
              this.onTranscript(fullText, false, 'live');
            }
          };

          rec.onerror = (event) => {
            if (event.error === 'no-speech') return; // Ignore silent pauses
            console.warn('Live speech recognition warning:', event.error);
          };

          rec.onend = () => {
            // Automatically restart if still active
            if (this.active && this.recognition) {
              try {
                this.recognition.start();
              } catch (_) {}
            }
          };

          rec.start();
          this.recognition = rec;
        } catch (recErr) {
          console.warn('SpeechRecognition start failed, will use Whisper audio buffer:', recErr);
        }
      }

      // 3. Setup MediaRecorder to capture audio for Whisper fallback/enhancement
      this.audioChunks = [];
      if (this.mediaStream && typeof MediaRecorder !== 'undefined') {
        try {
          const recorder = new MediaRecorder(this.mediaStream);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.audioChunks.push(e.data);
            }
          };
          recorder.start(500); // 500ms chunks
          this.mediaRecorder = recorder;
        } catch (recErr) {
          console.warn('MediaRecorder error:', recErr);
        }
      }

      if (this.onStatusChange) {
        this.onStatusChange('listening', 'Listening in real time... Speak clearly');
      }

      // Pre-warm the open source Whisper model in background
      loadWhisperModel().catch(() => {});
    } catch (err) {
      this.active = false;
      this.cleanup();
      const errMsg =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No microphone found on your device.'
          : err.message || 'Unable to access microphone.';

      if (this.onStatusChange) {
        this.onStatusChange('error', errMsg);
      }
      if (this.onError) {
        this.onError(errMsg);
      }
    }
  }

  /**
   * Stop listening and finalize transcription
   */
  async stop() {
    if (!this.active) return (this.finalText + this.interimText).trim();
    this.active = false;

    if (this.onStatusChange) {
      this.onStatusChange('processing', 'Finalizing transcription...');
    }

    // Stop live recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    let recordedAudioBlob = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise((resolve) => {
        this.mediaRecorder.onstop = resolve;
        try {
          this.mediaRecorder.stop();
        } catch (_) {
          resolve();
        }
      });
      recordedAudioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    }

    // Stop microphone tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    let resultText = (this.finalText + this.interimText).trim();

    // If live text was captured, emit final result
    if (resultText) {
      if (this.onTranscript) {
        this.onTranscript(resultText, true, 'live');
      }
    } else if (recordedAudioBlob && recordedAudioBlob.size > 1000) {
      // If Web Speech didn't produce text, transcribe the audio buffer with open source Whisper
      try {
        if (this.onStatusChange) {
          this.onStatusChange('processing', 'Transcribing with Open-Source Whisper AI...');
        }
        const whisper = await loadWhisperModel();
        if (whisper) {
          const arrayBuffer = await recordedAudioBlob.arrayBuffer();
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          const pcmData = resampleTo16k(decoded);
          await audioCtx.close();

          const whisperResult = await whisper(pcmData);
          if (whisperResult && whisperResult.text) {
            resultText = whisperResult.text.trim();
            if (this.onTranscript) {
              this.onTranscript(resultText, true, 'whisper');
            }
          }
        }
      } catch (whisperErr) {
        console.warn('Whisper transcription error:', whisperErr);
      }
    }

    this.cleanup();
    if (this.onStatusChange) {
      this.onStatusChange('idle', 'Finished listening');
    }

    return resultText;
  }

  /**
   * Cleanup any active recording session
   */
  cleanup() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (_) {}
      this.mediaRecorder = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.audioChunks = [];
  }
}
