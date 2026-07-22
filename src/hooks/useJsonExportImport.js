import { useCallback, useRef } from 'react';

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useJsonExportImport(getData, setData, syncBlockCreate) {
  const fileInputRef = useRef(null);
  const blocksInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  // ---------- Full export ----------
  const exportJson = useCallback(() => {
    const data = getData();
    downloadJson(data, `resume-${data.resume?.title || 'export'}-${new Date().toISOString().slice(0, 10)}.json`);
  }, [getData]);

  // ---------- Full import ----------
  const importJson = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);

          if (!data.blocks || !data.resume) {
            alert('Invalid file: missing required data (blocks, resume).');
            return;
          }

          if (!confirm('This will replace all current data. Continue?')) return;

          setData(data);
        } catch {
          alert('Failed to parse JSON file. Please select a valid export file.');
        }
      };
      reader.readAsText(file);

      // Reset so the same file can be re-imported
      e.target.value = '';
    },
    [setData],
  );

  // ---------- Blocks-only export ----------
  const exportBlocks = useCallback(() => {
    const { blocks } = getData();
    downloadJson({ blocks }, `blocks-${new Date().toISOString().slice(0, 10)}.json`);
  }, [getData]);

  // ---------- Blocks-only import ----------
  const importBlocks = useCallback(() => {
    blocksInputRef.current?.click();
  }, []);

  const handleBlocksFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          const importedBlocks = Array.isArray(data) ? data : data.blocks;

          if (!Array.isArray(importedBlocks)) {
            alert('Invalid file: expected an array of blocks or { blocks: [...] }.');
            return;
          }

          if (!confirm(`Import ${importedBlocks.length} block(s)? This will add them to your library.`)) return;

          const current = getData();
          const existingIds = new Set((current.blocks || []).map((b) => b.id));
          const newBlocks = importedBlocks.filter((b) => !existingIds.has(b.id));
          const merged = [...(current.blocks || []), ...newBlocks];

          setData({ ...current, blocks: merged });

          // Sync each new block to server
          if (syncBlockCreate) {
            newBlocks.forEach((b) => syncBlockCreate(b));
          }
        } catch {
          alert('Failed to parse JSON file. Please select a valid blocks export file.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [getData, setData, syncBlockCreate],
  );

  // ---------- Resume-only export ----------
  const exportResume = useCallback(() => {
    const { resume, personalInfo } = getData();
    downloadJson({ resume, personalInfo }, `resume-${resume?.title || 'export'}-${new Date().toISOString().slice(0, 10)}.json`);
  }, [getData]);

  // ---------- Resume-only import ----------
  const importResume = useCallback(() => {
    resumeInputRef.current?.click();
  }, []);

  const handleResumeFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);

          if (!data.resume) {
            alert('Invalid file: missing required "resume" field.');
            return;
          }

          if (!confirm('This will replace the current resume. Continue?')) return;

          const current = getData();
          setData({
            ...current,
            resume: data.resume,
            personalInfo: data.personalInfo || current.personalInfo,
          });
        } catch {
          alert('Failed to parse JSON file. Please select a valid resume export file.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [getData, setData],
  );

  return {
    // Full
    exportJson,
    importJson,
    fileInputRef,
    handleFileChange,
    // Blocks
    exportBlocks,
    importBlocks,
    blocksInputRef,
    handleBlocksFileChange,
    // Resume
    exportResume,
    importResume,
    resumeInputRef,
    handleResumeFileChange,
  };
}
