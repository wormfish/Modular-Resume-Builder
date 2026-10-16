import test from 'node:test';
import assert from 'node:assert/strict';
import { SpeechSession } from '../src/utils/speechTranscriber.js';

function fakeBrowser(t, getUserMedia) {
  const originals = new Map(['navigator', 'window', 'MediaRecorder'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => { for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia } } });
  globalThis.window = { AudioContext: class {
    async decodeAudioData() { return { sampleRate: 16000, numberOfChannels: 1, getChannelData: () => new Float32Array(16000) }; }
    async close() {}
  } };
  globalThis.MediaRecorder = class {
    state = 'inactive';
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob(['x'.repeat(2000)]) });
      queueMicrotask(() => this.onstop?.());
    }
  };
}

test('Whisper appends dictation to existing notes and emits the final transcript once', async (t) => {
  let stopped = false;
  fakeBrowser(t, async () => ({ getTracks: () => [{ stop() { stopped = true; } }] }));
  let transcribed = 0;
  const emitted = [];
  const session = new SpeechSession({ onTranscript: (text) => emitted.push(text),
    loadModel: async () => async () => { transcribed++; return { text: 'Newly dictated words' }; } });
  await session.start('Existing notes');
  assert.equal(await session.stop(), 'Existing notes Newly dictated words');
  assert.equal(transcribed, 1);
  assert.deepEqual(emitted, ['Existing notes Newly dictated words']);
  assert.equal(stopped, true);
  assert.equal(await session.stop(), 'Existing notes Newly dictated words');
});

test('closing while permission is pending stops the late stream without recording', async (t) => {
  let resolvePermission;
  let stopped = false;
  const statuses = [];
  fakeBrowser(t, () => new Promise((resolve) => { resolvePermission = resolve; }));
  const session = new SpeechSession({ onStatusChange: (status) => statuses.push(status), loadModel: async () => null });
  const started = session.start();
  session.cleanup();
  resolvePermission({ getTracks: () => [{ stop() { stopped = true; } }] });
  await started;
  assert.equal(session.active, false);
  assert.equal(session.mediaRecorder, null);
  assert.equal(stopped, true);
  assert.deepEqual(statuses, ['requesting']);
});

test('live speech appends to existing notes without running Whisper again', async (t) => {
  fakeBrowser(t, async () => ({ getTracks: () => [{ stop() {} }] }));
  let recognition;
  globalThis.window.SpeechRecognition = class {
    constructor() { recognition = this; }
    start() {}
    stop() {}
  };
  const session = new SpeechSession({ loadModel: async () => async () => { throw new Error('Unexpected fallback'); } });
  await session.start('Existing notes');
  const result = [{ transcript: 'Live spoken words' }];
  result.isFinal = true;
  recognition.onresult({ resultIndex: 0, results: [result] });
  assert.equal(await session.stop(), 'Existing notes Live spoken words');
});

test('closing during Whisper processing suppresses late callbacks', async (t) => {
  fakeBrowser(t, async () => ({ getTracks: () => [{ stop() {} }] }));
  let resolveTranscript;
  let processing;
  const beganProcessing = new Promise((resolve) => { processing = resolve; });
  const emitted = [];
  const session = new SpeechSession({ onTranscript: (text) => emitted.push(text),
    loadModel: async () => async () => { processing(); return new Promise((resolve) => { resolveTranscript = resolve; }); } });
  await session.start();
  const stopped = session.stop();
  await beganProcessing;
  session.cleanup();
  resolveTranscript({ text: 'Late result' });
  await stopped;
  assert.deepEqual(emitted, []);
  assert.equal(session.active, false);
});
