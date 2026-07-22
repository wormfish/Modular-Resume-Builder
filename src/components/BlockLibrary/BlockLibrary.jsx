import { useState, useMemo } from 'react';
import { BLOCK_SCHEMA } from '../../utils/constants';
import styles from './BlockLibrary.module.css';

export default function BlockLibrary({ blocks, jobTypes, onEditBlock, onDeleteBlock }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState(null);

  const filtered = useMemo(() => {
    return blocks.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        JSON.stringify(b.content).toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !selectedJobType || b.jobTypes.includes(selectedJobType);
      return matchesSearch && matchesType;
    });
  }, [blocks, searchQuery, selectedJobType]);

  const handleDragStart = (e, blockId) => {
    e.dataTransfer.setData('application/x-block-id', blockId);
    e.dataTransfer.setData('application/x-drag-source', 'library');
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add(styles.dragging);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove(styles.dragging);
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>Block Library</div>
      <div className={styles.panelContent}>
        <div className={styles.toolbar}>
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className={styles.filterRow}>
            <span
              className={`${styles.tag} ${!selectedJobType ? styles.active : ''}`}
              onClick={() => setSelectedJobType(null)}
            >
              All
            </span>
            {jobTypes.map((jt) => (
              <span
                key={jt}
                className={`${styles.tag} ${selectedJobType === jt ? styles.active : ''}`}
                onClick={() => setSelectedJobType(jt)}
              >
                {jt}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.blockList}>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              No blocks found. Create your first block to get started.
            </div>
          )}
          {filtered.map((block) => {
            const schema = BLOCK_SCHEMA[block.type];
            if (!schema) return null;
            const rendered = schema.render(block);
            return (
              <div
                key={block.id}
                className={styles.blockCard}
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragEnd={handleDragEnd}
              >
                <h4>{schema.label}</h4>
                <div className={styles.meta}>
                  {rendered.title}
                  {rendered.subtitle ? ` · ${rendered.subtitle}` : ''}
                </div>
                <div className={styles.preview}>{rendered.body || 'No additional details.'}</div>
                <div className={styles.tags}>
                  {block.jobTypes.map((jt) => (
                    <span key={jt} className={styles.tag}>{jt}</span>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button className={styles.small} onClick={() => onEditBlock(block.id)}>
                    Edit
                  </button>
                  <button
                    className={`${styles.small} ${styles.danger}`}
                    onClick={() => onDeleteBlock(block.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
