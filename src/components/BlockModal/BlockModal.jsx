import { useState } from 'react';
import { BLOCK_SCHEMA } from '../../utils/constants';
import styles from './BlockModal.module.css';

export default function BlockModal({
  tempBlock,
  setTempBlock,
  editingBlockId,
  jobTypes, // Now an object: { jt1: "Software Development", ... }
  onAddCustomJobType,
  onSave,
  onSaveVariant,
  onSaveChildVariant,
  onClose,
}) {
  const [newJobTypeName, setNewJobTypeName] = useState('');
  const [draggedSkillIdx, setDraggedSkillIdx] = useState(null);
  const [autoParseOpen, setAutoParseOpen] = useState(false);
  const [autoParseText, setAutoParseText] = useState('');
  const [isAutoParsing, setIsAutoParsing] = useState(false);
  const [autoParseError, setAutoParseError] = useState('');
  const schema = BLOCK_SCHEMA[tempBlock.type];
  const jobTypeIds = tempBlock.jobTypeIds || [];

  const handleAutoParseSubmit = async () => {
    if (!autoParseText.trim()) {
      setAutoParseError('Please type or paste some notes to parse.');
      return;
    }
    setIsAutoParsing(true);
    setAutoParseError('');
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/autoparse-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: autoParseText.trim(),
          targetType: tempBlock.type,
          currentBlock: tempBlock,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Auto-parsing failed.');
      }

      const parsed = await res.json();
      if (parsed && typeof parsed === 'object') {
        setTempBlock((prev) => {
          const next = { ...prev };
          if (parsed.type) next.type = parsed.type;
          if (parsed.name) next.name = parsed.name;
          if (parsed.fields && typeof parsed.fields === 'object') {
            Object.assign(next, parsed.fields);
            if (parsed.type === 'skills' && Array.isArray(parsed.fields.items)) {
              next.items = parsed.fields.items;
            }
          }
          return next;
        });
        setAutoParseOpen(false);
        setAutoParseText('');
      }
    } catch (err) {
      setAutoParseError(err.message || 'Failed to auto-parse block.');
    } finally {
      setIsAutoParsing(false);
    }
  };

  // Parse legacy skills into items array if needed
  const getSkillItems = () => {
    if (Array.isArray(tempBlock.items) && tempBlock.items.length > 0) {
      return tempBlock.items;
    }
    const rawSkills = String(tempBlock.skills || '');
    const lines = rawSkills.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.some((l) => l.includes(':'))) {
      return lines.map((l) => {
        const colonIdx = l.indexOf(':');
        if (colonIdx !== -1) {
          const cat = l.slice(0, colonIdx).replace(/^[•\-\*]\s*/, '').trim();
          const val = l.slice(colonIdx + 1).trim();
          return { category: cat, skills: val };
        }
        return { category: '', skills: l.replace(/^[•\-\*]\s*/, '').trim() };
      });
    }
    return [{ category: tempBlock.category || '', skills: rawSkills }];
  };

  const skillItems = tempBlock.type === 'skills' ? getSkillItems() : [];

  const updateSkillItems = (newItems) => {
    const flatSkills = newItems
      .filter((i) => i.category?.trim() || i.skills?.trim())
      .map((i) => (i.category?.trim() ? `${i.category.trim()}: ${i.skills || ''}` : i.skills || ''))
      .join('\n');
    setTempBlock((prev) => ({
      ...prev,
      items: newItems,
      category: newItems[0]?.category || '',
      skills: flatSkills,
    }));
  };

  const handleSkillItemChange = (index, field, value) => {
    const next = skillItems.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    updateSkillItems(next);
  };

  const handleAddSkillItem = () => {
    const next = [...skillItems, { category: '', skills: '' }];
    updateSkillItems(next);
  };

  const handleRemoveSkillItem = (index) => {
    const next = skillItems.filter((_, i) => i !== index);
    updateSkillItems(next.length ? next : [{ category: '', skills: '' }]);
  };

  const handleSkillDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedSkillIdx(index);
  };

  const handleSkillDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSkillDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedSkillIdx === null || draggedSkillIdx === targetIndex) return;
    const next = [...skillItems];
    const [moved] = next.splice(draggedSkillIdx, 1);
    next.splice(targetIndex, 0, moved);
    updateSkillItems(next);
    setDraggedSkillIdx(null);
  };

  const handleSkillDragEnd = () => {
    setDraggedSkillIdx(null);
  };

  // Two variant kinds:
  //  - resume variant: resumeId set — lives only on one resume.
  //  - child variant: variantOf set, no resumeId — lives in the library
  //    under its parent block's dropdown.
  const isResumeVariant = !!tempBlock.resumeId;
  const isChildVariant = !isResumeVariant && !!tempBlock.variantOf;
  const isVariant = isResumeVariant || isChildVariant;
  // Saving as a variant copies the block being edited, so only offer it for
  // plain library blocks (not when already editing a variant).
  const canSaveAsVariant = !!editingBlockId && !!onSaveVariant && !isVariant;
  const canSaveAsChildVariant = !!editingBlockId && !!onSaveChildVariant && !isVariant;

  const handleTypeChange = (e) => {
    const nextType = e.target.value;
    if (nextType === tempBlock.type) return;
    // Reset content fields so the old type's fields don't leak into the new
    // type; identity (id/name), job types and variant markers are kept.
    const { id, name, jobTypeIds: jtIds, resumeId, variantOf } = tempBlock;
    const next = { type: nextType, jobTypeIds: jtIds || [] };
    if (nextType === 'skills') {
      next.items = [{ category: '', skills: '' }];
    }
    if (id !== undefined) next.id = id;
    if (name !== undefined) next.name = name;
    if (resumeId !== undefined) next.resumeId = resumeId;
    if (variantOf !== undefined) next.variantOf = variantOf;
    setTempBlock(next);
  };

  const handleFieldChange = (name, value) => {
    setTempBlock((prev) => ({ ...prev, [name]: value }));
  };

  const toggleJobType = (jtId) => {
    setTempBlock((prev) => {
      const ids = prev.jobTypeIds || [];
      const has = ids.includes(jtId);
      return {
        ...prev,
        jobTypeIds: has ? ids.filter((id) => id !== jtId) : [...ids, jtId],
      };
    });
  };

  const handleAddCustomJobType = () => {
    if (!newJobTypeName.trim()) return;
    onAddCustomJobType(newJobTypeName);
    setNewJobTypeName('');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            {editingBlockId
              ? isResumeVariant
                ? 'Edit Block Variant'
                : isChildVariant
                  ? 'Edit Child Variant'
                  : 'Edit Block'
              : 'New Block'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        {isResumeVariant && (
          <p className={styles.variantNote}>
            This block is a resume variant — it belongs to this resume only. Changes here won't
            affect the original block or any other resume.
          </p>
        )}

        {isChildVariant && (
          <p className={styles.variantNote}>
            This block is a child variant — it lives in the library under its parent block and can
            be picked from the parent's dropdown. Changes here won't affect the parent.
          </p>
        )}

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label>Block Name</label>
            <input
              type="text"
              placeholder={`${schema.label} block`}
              value={tempBlock.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
            <span className={styles.nameHint}>
              Only used to recognize the block at a glance — defaults to “{schema.label} block”.
            </span>
          </div>

          <div className={styles.field}>
            <label>Block Type</label>
            <select value={tempBlock.type} onChange={handleTypeChange}>
              {Object.entries(BLOCK_SCHEMA).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            {!!editingBlockId && (
              <span className={styles.nameHint}>
                Changing the type clears this block's fields and moves it to the matching section
                on the canvas.
              </span>
            )}
          </div>

          {tempBlock.type === 'skills' ? (
            <div className={styles.skillsBuilder}>
              <div className={styles.skillsBuilderHeader}>
                <label>Skills & Categories</label>
                <span className={styles.nameHint}>
                  Add categories (e.g. Languages, Tools) or leave Category empty for simple bullet points. Drag ☰ to reorder.
                </span>
              </div>
              <div className={styles.skillsList}>
                {skillItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`${styles.skillRow} ${draggedSkillIdx === idx ? styles.skillRowDragging : ''}`}
                    draggable
                    onDragStart={(e) => handleSkillDragStart(e, idx)}
                    onDragOver={handleSkillDragOver}
                    onDrop={(e) => handleSkillDrop(e, idx)}
                    onDragEnd={handleSkillDragEnd}
                  >
                    <span className={styles.dragHandle} title="Drag to reorder">
                      &#9776;
                    </span>
                    <input
                      type="text"
                      className={styles.catInput}
                      placeholder="Category (e.g. Languages)"
                      value={item.category || ''}
                      onChange={(e) => handleSkillItemChange(idx, 'category', e.target.value)}
                    />
                    <span className={styles.colonLabel}>:</span>
                    <input
                      type="text"
                      className={styles.skillInput}
                      placeholder="Skills (e.g. JavaScript, Python, SQL)"
                      value={item.skills || ''}
                      onChange={(e) => handleSkillItemChange(idx, 'skills', e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.removeSkillBtn}
                      onClick={() => handleRemoveSkillItem(idx)}
                      title="Remove row"
                      disabled={skillItems.length <= 1 && !item.category && !item.skills}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.addSkillBtn}
                onClick={handleAddSkillItem}
              >
                + Add Category
              </button>
            </div>
          ) : (
            schema.fields.map((field) => (
              <div key={field.name} className={styles.field}>
                <label>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={tempBlock[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    value={tempBlock[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))
          )}

          <div className={styles.field}>
            <label>Job Types</label>
            <div className={styles.jobTypeSelect}>
              {Object.entries(jobTypes).map(([id, name]) => (
                <span
                  key={id}
                  className={`${styles.tag} ${jobTypeIds.includes(id) ? styles.active : ''}`}
                  onClick={() => toggleJobType(id)}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <input
              type="text"
              placeholder="Add custom job type..."
              value={newJobTypeName}
              onChange={(e) => setNewJobTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomJobType();
                  e.preventDefault();
                }
              }}
            />
            <button className={styles.addBtn} onClick={handleAddCustomJobType}>
              Add Job Type
            </button>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.autoParseBtn}
            onClick={() => {
              setAutoParseError('');
              setAutoParseOpen(true);
            }}
            title="Open AI auto-parse window to structure raw experience into STAR bullet points"
          >
            ✨ Auto-Parse
          </button>
          <button onClick={onClose}>Cancel</button>
          {canSaveAsChildVariant && (
            <button
              className={styles.childVariantBtn}
              onClick={onSaveChildVariant}
              title="Save a copy into the library under this block — pick it from the parent's dropdown"
            >
              Save as Child Variant
            </button>
          )}
          {canSaveAsVariant && (
            <button
              className={styles.variantBtn}
              onClick={onSaveVariant}
              title="Save a copy of this block that only applies to the current resume"
            >
              Save as Resume Variant
            </button>
          )}
          <button className={styles.primaryBtn} onClick={onSave}>
            {isResumeVariant ? 'Save Variant' : 'Save Block'}
          </button>
        </div>

        {autoParseOpen && (
          <div className={styles.autoParseOverlay} onClick={() => setAutoParseOpen(false)}>
            <div className={styles.autoParseModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.autoParseHeader}>
                <div className={styles.autoParseTitleGroup}>
                  <span className={styles.sparkleIcon}>✨</span>
                  <div>
                    <h4>Auto-Parse Experience</h4>
                    <span className={styles.autoParseSubtitle}>
                      Powered by AI & STAR sentence structure (Situation, Task, Action, Result)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setAutoParseOpen(false)}
                >
                  &times;
                </button>
              </div>

              <div className={styles.autoParseBody}>
                <div className={styles.starGuideBox}>
                  <div className={styles.starPills}>
                    <span className={styles.starPill}><strong>S</strong>ituation</span>
                    <span className={styles.starPill}><strong>T</strong>ask</span>
                    <span className={styles.starPill}><strong>A</strong>ction</span>
                    <span className={styles.starPill}><strong>R</strong>esult</span>
                  </div>
                  <p className={styles.starGuideText}>
                    Type or paste what you went through (your role, company, the situation/challenge you faced, actions you took, and measurable results). The AI will structure it into impactful, concise STAR-method bullet points with quantified results.
                  </p>
                </div>

                <div className={styles.autoParseField}>
                  <label>What did you work on / go through?</label>
                  <textarea
                    className={styles.autoParseTextarea}
                    rows={6}
                    placeholder="e.g. I was a Senior Software Engineer at TechCorp from Jan 2021 to Present in San Francisco. Our API had latency spikes causing 15% drop-offs during black friday. I redesigned the cache with Redis and optimized SQL queries, reducing latency by 45% and saving $80k in cloud infrastructure. Also mentored 4 junior devs."
                    value={autoParseText}
                    onChange={(e) => setAutoParseText(e.target.value)}
                    disabled={isAutoParsing}
                    autoFocus
                  />
                </div>

                {autoParseError && (
                  <div className={styles.autoParseError}>{autoParseError}</div>
                )}
              </div>

              <div className={styles.autoParseFooter}>
                <button
                  type="button"
                  onClick={() => setAutoParseOpen(false)}
                  disabled={isAutoParsing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.autoParseSubmitBtn}
                  onClick={handleAutoParseSubmit}
                  disabled={isAutoParsing || !autoParseText.trim()}
                >
                  {isAutoParsing ? (
                    <>
                      <span className={styles.spinner} />
                      Parsing with AI...
                    </>
                  ) : (
                    '⚡ Generate & Map to Block'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
