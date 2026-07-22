import { useState, useCallback } from 'react';
import { useApiSync } from './hooks/useApiSync';
import { useExportPdf } from './hooks/useExportPdf';
import { useJsonExportImport } from './hooks/useJsonExportImport';
import {
  SECTION_NAME_SUGGESTIONS,
} from './utils/constants';
import { generateId } from './utils/id';
import BlockLibrary from './components/BlockLibrary/BlockLibrary';
import ResumeCanvas from './components/ResumeCanvas/ResumeCanvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import BlockModal from './components/BlockModal/BlockModal';
import styles from './App.module.css';

export default function App() {
  const {
    blocks,
    setBlocks,
    resume,
    setResume,
    personalInfo,
    setPersonalInfo,
    jobTypes,
    setJobTypes,
    isOnline,
    syncBlockCreate,
    syncBlockUpdate,
    syncBlockDelete,
  } = useApiSync();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [tempBlock, setTempBlock] = useState({ type: 'summary', content: {}, jobTypes: [] });

  const exportPdf = useExportPdf();

  // ---------- JSON Export/Import ----------

  const getData = useCallback(
    () => ({ blocks, resume, personalInfo, jobTypes }),
    [blocks, resume, personalInfo, jobTypes],
  );

  const setData = useCallback(
    (data) => {
      if (data.blocks) setBlocks(data.blocks);
      if (data.resume) setResume(data.resume);
      if (data.personalInfo) setPersonalInfo(data.personalInfo);
      if (data.jobTypes) setJobTypes(data.jobTypes);
    },
    [setBlocks, setResume, setPersonalInfo, setJobTypes],
  );

  const {
    exportJson, importJson, fileInputRef, handleFileChange,
    exportBlocks, importBlocks, blocksInputRef, handleBlocksFileChange,
    exportResume, importResume, resumeInputRef, handleResumeFileChange,
  } = useJsonExportImport(getData, setData, syncBlockCreate);

  // ---------- Block CRUD ----------

  const openNewBlockModal = useCallback(() => {
    setEditingBlockId(null);
    setTempBlock({ type: 'summary', content: {}, jobTypes: [] });
    setModalOpen(true);
  }, []);

  const openEditBlockModal = useCallback((blockId) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    setEditingBlockId(blockId);
    setTempBlock(JSON.parse(JSON.stringify(block)));
    setModalOpen(true);
  }, [blocks]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingBlockId(null);
  }, []);

  const saveBlock = useCallback(() => {
    if (editingBlockId) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === editingBlockId ? { ...tempBlock, id: editingBlockId } : b)),
      );
      syncBlockUpdate(editingBlockId, tempBlock);
    } else {
      const newBlock = { ...tempBlock, id: generateId() };
      setBlocks((prev) => [...prev, newBlock]);
      syncBlockCreate(newBlock);
    }
    closeModal();
  }, [editingBlockId, tempBlock, setBlocks, closeModal, syncBlockCreate, syncBlockUpdate]);

  const deleteBlock = useCallback((blockId) => {
    if (!confirm('Delete this block from the library? It will also be removed from any resume using it.')) return;
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => ({
        ...s,
        blockIds: s.blockIds.filter((id) => id !== blockId),
      })),
    }));
    syncBlockDelete(blockId);
  }, [setBlocks, setResume, syncBlockDelete]);

  // ---------- Job Types ----------

  const addCustomJobType = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setJobTypes((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setTempBlock((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(trimmed) ? prev.jobTypes : [...prev.jobTypes, trimmed],
    }));
  }, [setJobTypes]);

  // ---------- Resume Operations ----------

  const updateResumeTitle = useCallback((title) => {
    setResume((prev) => ({ ...prev, title }));
  }, [setResume]);

  const setTemplate = useCallback((templateId) => {
    setResume((prev) => ({ ...prev, templateId }));
  }, [setResume]);

  const updatePersonalInfoField = useCallback((field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  }, [setPersonalInfo]);

  const addSection = useCallback(() => {
    setResume((prev) => {
      const used = new Set(prev.sections.map((s) => s.title));
      const title = SECTION_NAME_SUGGESTIONS.find((n) => !used.has(n)) || 'Section';
      return {
        ...prev,
        sections: [...prev.sections, { id: generateId(), title, blockIds: [] }],
      };
    });
  }, [setResume]);

  const removeSection = useCallback((sectionId) => {
    if (!confirm('Remove this section from the resume?')) return;
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  }, [setResume]);

  const updateSectionTitle = useCallback((sectionId, title) => {
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    }));
  }, [setResume]);

  const clearResume = useCallback(() => {
    if (!confirm('Clear all sections from this resume? Blocks in the library will not be deleted.')) return;
    setResume((prev) => ({ ...prev, sections: [] }));
  }, [setResume]);

  // ---------- Drag and Drop ----------

  const handleDropFromLibrary = useCallback((blockId, sectionId, insertIndex) => {
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        if (s.blockIds.includes(blockId)) return s;
        const newIds = [...s.blockIds];
        if (insertIndex == null || insertIndex >= newIds.length) {
          newIds.push(blockId);
        } else {
          newIds.splice(insertIndex, 0, blockId);
        }
        return { ...s, blockIds: newIds };
      }),
    }));
  }, [setResume]);

  const handleReorderInCanvas = useCallback((sourceSectionId, sourceIndex, targetSectionId, targetIndex) => {
    setResume((prev) => {
      const newSections = prev.sections.map((s) => ({ ...s, blockIds: [...s.blockIds] }));
      const sourceSection = newSections.find((s) => s.id === sourceSectionId);
      const targetSection = newSections.find((s) => s.id === targetSectionId);
      if (!sourceSection || !targetSection) return prev;

      let adjustedTarget = targetIndex;
      if (sourceSectionId === targetSectionId && sourceIndex < targetIndex) {
        adjustedTarget--;
      }

      const [movedId] = sourceSection.blockIds.splice(sourceIndex, 1);
      targetSection.blockIds.splice(adjustedTarget, 0, movedId);

      return { ...prev, sections: newSections };
    });
  }, [setResume]);

  const removeBlockFromSection = useCallback((sectionId, index) => {
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const newIds = [...s.blockIds];
        newIds.splice(index, 1);
        return { ...s, blockIds: newIds };
      }),
    }));
  }, [setResume]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Modular Resume Builder</h1>
        <div className={styles.headerActions}>
          <span
            className={styles.syncIndicator}
            title={isOnline === false ? 'Offline – changes saved locally only' : isOnline ? 'Connected to server' : 'Checking connection…'}
          >
            {isOnline === false ? '⚠ Offline' : isOnline ? '● Online' : '…'}
          </span>
          <button onClick={importJson}>Import JSON</button>
          <button onClick={exportJson}>Export JSON</button>
          <button onClick={importBlocks}>Import Blocks</button>
          <button onClick={exportBlocks}>Export Blocks</button>
          <button onClick={importResume}>Import Resume</button>
          <button onClick={exportResume}>Export Resume</button>
          <button onClick={exportPdf}>Export PDF</button>
          <button className={styles.primary} onClick={openNewBlockModal}>+ New Block</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          ref={blocksInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleBlocksFileChange}
        />
        <input
          ref={resumeInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleResumeFileChange}
        />
      </header>

      <div className={styles.body}>
        <BlockLibrary
          blocks={blocks}
          jobTypes={jobTypes}
          onEditBlock={openEditBlockModal}
          onDeleteBlock={deleteBlock}
        />

        <ResumeCanvas
          resume={resume}
          blocks={blocks}
          personalInfo={personalInfo}
          onUpdateTitle={updateResumeTitle}
          onAddSection={addSection}
          onRemoveSection={removeSection}
          onUpdateSectionTitle={updateSectionTitle}
          onClearResume={clearResume}
          onDropFromLibrary={handleDropFromLibrary}
          onReorderInCanvas={handleReorderInCanvas}
          onRemoveBlockFromSection={removeBlockFromSection}
          onEditBlock={openEditBlockModal}
        />

        <PropertiesPanel
          resume={resume}
          personalInfo={personalInfo}
          onSetTemplate={setTemplate}
          onUpdatePersonalInfo={updatePersonalInfoField}
        />
      </div>

      {modalOpen && (
        <BlockModal
          tempBlock={tempBlock}
          setTempBlock={setTempBlock}
          editingBlockId={editingBlockId}
          jobTypes={jobTypes}
          onAddCustomJobType={addCustomJobType}
          onSave={saveBlock}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
