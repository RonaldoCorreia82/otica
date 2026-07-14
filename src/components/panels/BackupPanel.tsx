'use client';

import styles from '../Dashboard.module.css';

interface BackupPanelProps {
  onExportCSV: () => void;
}

export default function BackupPanel({ onExportCSV }: BackupPanelProps) {
  return (
    <div className={styles.placeholderPanel}>
      <div className={styles.placeholderIcon}>💾</div>
      <h3>Backup do Banco de Dados</h3>
      <p>Faça o download do backup completo de todas as cobranças registradas no sistema em formato CSV.</p>
      <button type="button" className={styles.backupBtn} onClick={onExportCSV}>
        Exportar Cobranças (CSV)
      </button>
    </div>
  );
}
