'use client';

import styles from '../Dashboard.module.css';

export default function MensagensPanel() {
  return (
    <div className={styles.placeholderPanel}>
      <div className={styles.placeholderIcon}>💬</div>
      <h3>Gerenciador de Mensagens</h3>
      <p>Esta área está em desenvolvimento. Em breve você poderá criar modelos de mensagens e disparos automatizados.</p>
    </div>
  );
}
