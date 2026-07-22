import { useState } from 'react';
import { BLOCK_SCHEMA } from '../../utils/constants';
import styles from './BlockModal.module.css';

export default function BlockModal({
  tempBlock,
  setTempBlock,
  editingBlockId,
  jobTypes,
  onAddCustomJobType,
  onSave,
  onClose,
}) {
  const [newJobTypeName, setNewJobTypeName] = useState('');
  const schema = BLOCK_SCHEMA[tempBlock.type];

  const handleTypeChange = (e) => {
    setTempBlock((prev) => ({ ...prev, type: e.target.value, content: {} }));
  };

  const handleFieldChange = (name, value) => {
    setTempBlock((prev) => ({
      ...prev,
      content: { ...prev.content, [name]: value },
    }));
  };

  const toggleJobType = (jt) => {
    setTempBlock((prev) => {
      const has = prev.jobTypes.includes(jt);
      return {
        ...prev,
        jobTypes: has ? prev.jobTypes.filter((t) => t !== jt) : [...prev.jobTypes, jt],
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
          <h3>{editingBlockId ? 'Edit Block' : 'New Block'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label>Block Type</label>
            <select
              value={tempBlock.type}
              onChange={handleTypeChange}
              disabled={!!editingBlockId}
            >
              {Object.entries(BLOCK_SCHEMA).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {schema.fields.map((field) => (
            <div key={field.name} className={styles.field}>
              <label>{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  value={tempBlock.content[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={tempBlock.content[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className={styles.field}>
            <label>Job Types</label>
            <div className={styles.jobTypeSelect}>
              {jobTypes.map((jt) => (
                <span
                  key={jt}
                  className={`${styles.tag} ${tempBlock.jobTypes.includes(jt) ? styles.active : ''}`}
                  onClick={() => toggleJobType(jt)}
                >
                  {jt}
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
          <button onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={onSave}>
            Save Block
          </button>
        </div>
      </div>
    </div>
  );
}
