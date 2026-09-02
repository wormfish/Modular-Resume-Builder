import { useState } from 'react';
import styles from './ExportModal.module.css';

export default function ExportModal({ onConfirm, onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('mrb-export-guide-dismissed', '1');
      } catch {
        // localStorage not available
      }
    }
    onConfirm();
  };

  return (
    <div className={styles.overlay} onClick={onClose} data-print-hide>
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.badge}>ATS-Ready Export</span>
            <h3 id="export-modal-title">Export Resume as PDF</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>

        <p className={styles.subtitle}>
          To ensure automated resume screeners (ATS) can parse your resume, follow this quick browser print tip:
        </p>

        <div className={styles.comparisonBox}>
          <div className={styles.tipCardSuccess}>
            <div className={styles.tipHeader}>
              <span className={styles.icon}>✅</span>
              <strong>Set Destination to &ldquo;Save as PDF&rdquo;</strong>
            </div>
            <p className={styles.tipDesc}>
              Uses Chromium&rsquo;s native PDF engine to output <strong>100% selectable vector text</strong>, embedded fonts, and clickable links.
            </p>
          </div>

          <div className={styles.tipCardWarning}>
            <div className={styles.tipHeader}>
              <span className={styles.icon}>⚠️</span>
              <strong>Avoid &ldquo;Microsoft Print to PDF&rdquo;</strong>
            </div>
            <p className={styles.tipDesc}>
              Windows printer drivers often flatten web text into raster image bitmaps, making your text unselectable and unreadable by ATS bots.
            </p>
          </div>
        </div>

        <div className={styles.settingsSummary}>
          <div className={styles.settingsTitle}>Recommended Print Dialog Settings:</div>
          <ul className={styles.settingsList}>
            <li>
              <span className={styles.settingKey}>Destination:</span>
              <span className={styles.settingVal}>Save as PDF</span>
            </li>
            <li>
              <span className={styles.settingKey}>Margins:</span>
              <span className={styles.settingVal}>None (or Default)</span>
            </li>
            <li>
              <span className={styles.settingKey}>Headers &amp; Footers:</span>
              <span className={styles.settingVal}>Unchecked</span>
            </li>
            <li>
              <span className={styles.settingKey}>Background graphics:</span>
              <span className={styles.settingVal}>Checked</span>
            </li>
          </ul>
        </div>

        <div className={styles.footer}>
          <label className={styles.dontShowLabel}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.dontShowText}>Don&rsquo;t show this tip again</span>
          </label>

          <div className={styles.actionButtons}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.confirmBtn} onClick={handleConfirm}>
              Continue to Print &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
