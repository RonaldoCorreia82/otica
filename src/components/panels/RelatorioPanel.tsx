'use client';

import { useState, useMemo } from 'react';
import { Billing } from '@/services/db';
import styles from '../Dashboard.module.css';

interface RelatorioPanelProps {
  billings: Billing[];
  onPrint: (mode: 'summary' | 'detailed', location?: string) => void;
  formatCurrency: (val: number) => string;
  getDisplayStatus: (item: Billing) => 'paid' | 'pending' | 'overdue';
}

export default function RelatorioPanel({
  billings,
  onPrint,
  formatCurrency,
  getDisplayStatus
}: RelatorioPanelProps) {
  const [selectedLocationPrint, setSelectedLocationPrint] = useState<string>('all');

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    billings.forEach(b => {
      if (b.cidade && b.cidade.trim()) {
        locations.add(b.cidade.trim());
      }
    });
    return Array.from(locations).sort();
  }, [billings]);

  return (
    <div className={styles.reportPanel}>
      <h3>Relatório Geral Financeiro</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <p className={styles.reportSubtitle} style={{ margin: '0' }}>Resumo consolidado das cobranças por status e por instituição bancária.</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className={styles.filterSelect}
            value={selectedLocationPrint}
            onChange={(e) => setSelectedLocationPrint(e.target.value)}
            style={{ height: '38px', minWidth: '160px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '0 8px', fontSize: '13px' }}
          >
            <option value="all">Todas as Cidades</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <button type="button" className={styles.printBtn} onClick={() => onPrint('detailed', selectedLocationPrint)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span style={{ verticalAlign: 'middle' }}>Imprimir Cobranças</span>
          </button>
        </div>
      </div>
      
      <div className={styles.reportGrid}>
        <div className={styles.reportCard}>
          <h4>Resumo por Status</h4>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Quantidade</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pendente</td>
                <td>{billings.filter(b => getDisplayStatus(b) === 'pending').length}</td>
                <td>{formatCurrency(billings.filter(b => getDisplayStatus(b) === 'pending').reduce((acc, curr) => acc + curr.valor, 0))}</td>
              </tr>
              <tr>
                <td>Pago</td>
                <td>{billings.filter(b => getDisplayStatus(b) === 'paid').length}</td>
                <td>{formatCurrency(billings.filter(b => getDisplayStatus(b) === 'paid').reduce((acc, curr) => acc + curr.valor, 0))}</td>
              </tr>
              <tr>
                <td>Vencido</td>
                <td>{billings.filter(b => getDisplayStatus(b) === 'overdue').length}</td>
                <td>{formatCurrency(billings.filter(b => getDisplayStatus(b) === 'overdue').reduce((acc, curr) => acc + curr.valor, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.reportCard}>
          <h4>Resumo por Banco</h4>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Banco</th>
                <th>Quantidade</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const bankMap: { [key: string]: { count: number; total: number } } = {};
                billings.forEach(b => {
                  const bankName = b.banco || 'Não Informado';
                  if (!bankMap[bankName]) {
                    bankMap[bankName] = { count: 0, total: 0 };
                  }
                  bankMap[bankName].count += 1;
                  bankMap[bankName].total += b.valor;
                });
                return Object.entries(bankMap).map(([bank, data]) => (
                  <tr key={bank}>
                    <td>{bank}</td>
                    <td>{data.count}</td>
                    <td>{formatCurrency(data.total)}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
