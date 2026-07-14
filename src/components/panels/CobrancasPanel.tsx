'use client';

import { Dispatch, SetStateAction } from 'react';
import { Billing, parseInstallments } from '@/services/db';
import styles from '../Dashboard.module.css';

interface CobrancasPanelProps {
  billings: Billing[];
  filteredBillings: Billing[];
  paginatedBillings: Billing[];
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterStatus: 'all' | 'paid' | 'pending' | 'overdue';
  setFilterStatus: (val: 'all' | 'paid' | 'pending' | 'overdue') => void;
  pageSize: number;
  setPageSize: (val: number) => void;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
  selectedIds: Set<string>;
  handleToggleSelect: (id: string) => void;
  handleToggleSelectAllPage: () => void;
  isAllPageSelected: boolean;
  handleOpenCreate: () => void;
  handleOpenEdit: (item: Billing) => void;
  handleTogglePaid: (item: Billing) => void;
  handleDeleteBilling: (item: Billing) => void;
  handleWhatsAppReminder: (item: Billing) => void;
  formatCurrency: (val: number) => string;
  formatDate: (val: string) => string;
  getDisplayStatus: (item: Billing) => 'paid' | 'pending' | 'overdue';
  isLoading: boolean;
}

export default function CobrancasPanel({
  billings,
  filteredBillings,
  paginatedBillings,
  totalBilled,
  totalPaid,
  totalPending,
  totalOverdue,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
  selectedIds,
  handleToggleSelect,
  handleToggleSelectAllPage,
  isAllPageSelected,
  handleOpenCreate,
  handleOpenEdit,
  handleTogglePaid,
  handleDeleteBilling,
  handleWhatsAppReminder,
  formatCurrency,
  formatDate,
  getDisplayStatus,
  isLoading
}: CobrancasPanelProps) {
  const startIndex = (currentPage - 1) * pageSize;
  const totalItems = filteredBillings.length;

  return (
    <>
      {/* Metrics Grid */}
      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricTotal}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Total Cobrado</span>
            <div className={styles.metricIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <span className={styles.metricValue}>{formatCurrency(totalBilled)}</span>
          <span className={styles.metricFooter}>Total geral de cobranças</span>
        </div>

        <div className={`${styles.metricCard} ${styles.metricPaid}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Recebido</span>
            <div className={styles.metricIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <span className={styles.metricValue}>{formatCurrency(totalPaid)}</span>
          <span className={styles.metricFooter}>Cobranças pagas</span>
        </div>

        <div className={`${styles.metricCard} ${styles.metricPending}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Pendente</span>
            <div className={styles.metricIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <span className={styles.metricValue}>{formatCurrency(totalPending)}</span>
          <span className={styles.metricFooter}>Cobranças no prazo</span>
        </div>

        <div className={`${styles.metricCard} ${styles.metricOverdue}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Vencido</span>
            <div className={styles.metricIconWrapper}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <span className={styles.metricValue}>{formatCurrency(totalOverdue)}</span>
          <span className={styles.metricFooter}>Cobranças em atraso</span>
        </div>
      </section>

      {/* Action Bar */}
      <section className={styles.controlBar}>
        <div className={styles.controlsLeft}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por pagador, OS, CPF, cidade ou observação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.searchIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Vencidos</option>
          </select>
          <select
            className={styles.filterSelect}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={20}>20 registros</option>
            <option value={50}>50 registros</option>
            <option value={100}>100 registros</option>
          </select>
        </div>

        <button className={styles.addBtn} onClick={handleOpenCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nova Cobrança
        </button>
      </section>

      {/* Billings Listing */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando cobranças...</p>
        </div>
      ) : filteredBillings.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📂</div>
          <h3 className={styles.emptyTitle}>Nenhuma cobrança encontrada</h3>
          <p className={styles.emptyText}>
            Não encontramos cobranças cadastradas que correspondam ao filtro selecionado.
          </p>
          {searchQuery || filterStatus !== 'all' ? (
            <button 
              className={styles.cancelBtn} 
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
            >
              Limpar Filtros
            </button>
          ) : (
            <button className={styles.addBtn} onClick={handleOpenCreate}>
              Criar Primeira Cobrança
            </button>
          )}
        </div>
      ) : (
        <section className={styles.listCard}>
          {/* Desktop Table View */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: '40px', paddingLeft: '14px', paddingRight: '0' }}>
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleToggleSelectAllPage}
                      className={styles.checkbox}
                      title="Selecionar Todos na Página"
                    />
                  </th>
                  <th className={styles.th} style={{ width: '6%' }}>OS</th>
                  <th className={styles.th} style={{ width: '28%' }}>Pagador / CPF / Contato</th>
                  <th className={styles.th} style={{ width: '20%' }}>Localização / Endereço</th>
                  <th className={styles.th} style={{ width: '12%' }}>Banco</th>
                  <th className={styles.th} style={{ width: '11%', whiteSpace: 'nowrap' }}>Vencimento</th>
                  <th className={styles.th} style={{ width: '11%', whiteSpace: 'nowrap' }}>Valor</th>
                  <th className={styles.th} style={{ width: '12%', whiteSpace: 'nowrap' }}>Status</th>
                  <th className={styles.th} style={{ width: '120px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBillings.map((item) => {
                  const displayStatus = getDisplayStatus(item);
                  return (
                    <tr key={item.id} className={styles.tr}>
                      <td className={styles.td} style={{ paddingLeft: '14px', paddingRight: '0' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id || '')}
                          onChange={() => handleToggleSelect(item.id || '')}
                          className={styles.checkbox}
                        />
                      </td>
                      <td className={styles.td} style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                        #{item.os}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.clientName}>{item.pagador}</div>
                        {item.cpf && <div className={styles.clientDesc}>CPF: {item.cpf}</div>}
                        {item.telefone && <div className={styles.clientDesc} style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Tel: {item.telefone}</div>}
                      </td>
                      <td className={styles.td}>
                        {item.cidade && <div className={styles.clientName}>{item.cidade}</div>}
                        {item.endereco && <div className={styles.clientDesc}>{item.endereco}</div>}
                      </td>
                      <td className={styles.td} style={{ fontWeight: '500' }}>
                        {item.banco || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td className={styles.td}>
                        {(() => {
                          const installments = parseInstallments(item);
                          if (installments) {
                            return (
                              <div className={styles.installmentsCol}>
                                {installments.map((inst, idx) => (
                                  <div key={idx} className={`${styles.installmentRow} ${inst.paga ? styles.installmentPaid : ''}`}>
                                    {inst.date} {inst.paga && '✓'}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              {formatDate(item.vencimento)}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={styles.td}>
                        {(() => {
                          const installments = parseInstallments(item);
                          if (installments) {
                            return (
                              <div className={styles.installmentsCol}>
                                {installments.map((inst, idx) => (
                                  <div key={idx} className={`${styles.installmentRow} ${styles.value} ${inst.paga ? styles.installmentPaid : ''}`}>
                                    {formatCurrency(inst.value)}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              {formatCurrency(item.valor)}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.badge} ${
                          displayStatus === 'paid' ? styles.badgePaid :
                          displayStatus === 'overdue' ? styles.badgeOverdue :
                          styles.badgePending
                        }`}>
                          {displayStatus === 'paid' ? 'pago' :
                           displayStatus === 'overdue' ? 'vencido' :
                           'pendente'}
                        </span>
                        {item.observacao && (
                          <div className={styles.clientDesc} style={{ marginTop: '2px', fontStyle: 'italic' }} title={item.observacao}>
                            {item.observacao.length > 20 ? `${item.observacao.substring(0, 20)}...` : item.observacao}
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                          <button
                            className={`${styles.actionBtn} ${styles.btnPaidToggle}`}
                            title={item.status === 'paid' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                            onClick={() => handleTogglePaid(item)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.btnEdit}`}
                            title="Editar Cobrança"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                            </svg>
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.btnDelete}`}
                            title="Excluir Cobrança"
                            onClick={() => handleDeleteBilling(item)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.btnWhatsapp}`}
                            title="Enviar Lembrete WhatsApp"
                            onClick={() => handleWhatsAppReminder(item)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className={styles.mobileCards}>
            {paginatedBillings.map((item) => {
              const displayStatus = getDisplayStatus(item);
              return (
                <div key={item.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id || '')}
                        onChange={() => handleToggleSelect(item.id || '')}
                        className={styles.checkbox}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>OS #{item.os}</div>
                        <div className={styles.mobileClient}>{item.pagador}</div>
                        {item.cpf && <div className={styles.mobileDesc} style={{ fontSize: '12px' }}>CPF: {item.cpf}</div>}
                      </div>
                    </div>
                    <span className={`${styles.badge} ${
                      displayStatus === 'paid' ? styles.badgePaid :
                      displayStatus === 'overdue' ? styles.badgeOverdue :
                      styles.badgePending
                    }`}>
                      {displayStatus === 'paid' ? 'pago' :
                       displayStatus === 'overdue' ? 'vencido' :
                       'pendente'}
                    </span>
                  </div>

                  <div className={styles.mobileCardBody} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                    {(() => {
                      const installments = parseInstallments(item);
                      if (installments) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Detalhes das Parcelas
                            </div>
                            {installments.map((inst, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', padding: '2px 0', textDecoration: inst.paga ? 'line-through' : 'none', opacity: inst.paga ? 0.6 : 1 }}>
                                <span style={{ color: inst.paga ? 'var(--success)' : 'var(--text-secondary)' }}>
                                  Venc: {inst.date} {inst.paga && '✓'}
                                </span>
                                <span style={{ fontWeight: '600', color: inst.paga ? 'var(--success)' : 'var(--text-main)' }}>
                                  {formatCurrency(inst.value)}
                                </span>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                              <span>Total Consolidadas</span>
                              <span>{formatCurrency(item.valor)}</span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div className={styles.mobileLabel}>Vencimento</div>
                            <div className={styles.mobileVal}>{formatDate(item.vencimento)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className={styles.mobileLabel}>Valor</div>
                            <div className={`${styles.mobileVal} ${styles.mobileValue}`}>{formatCurrency(item.valor)}</div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {(item.cidade || item.endereco) && (
                      <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                        <div className={styles.mobileLabel}>Localização</div>
                        <div className={styles.mobileVal} style={{ fontSize: '13px' }}>
                          {item.cidade && <strong>{item.cidade}</strong>}
                          {item.endereco && ` - ${item.endereco}`}
                        </div>
                      </div>
                    )}

                    {item.telefone && (
                      <div>
                        <div className={styles.mobileLabel}>Telefone</div>
                        <div className={styles.mobileVal}>{item.telefone}</div>
                      </div>
                    )}

                    {item.banco && (
                      <div>
                        <div className={styles.mobileLabel}>Banco</div>
                        <div className={styles.mobileVal}>{item.banco}</div>
                      </div>
                    )}

                    {item.observacao && (
                      <div style={{ background: 'var(--bg-base)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                        <div className={styles.mobileLabel}>Observação</div>
                        <div className={styles.mobileVal} style={{ fontSize: '12px', fontStyle: 'italic' }}>{item.observacao}</div>
                      </div>
                    )}
                  </div>

                  <div className={styles.mobileCardActions}>
                    <button
                      className={`${styles.actionBtn} ${styles.btnPaidToggle}`}
                      onClick={() => handleTogglePaid(item)}
                      title="Alterar Status"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.btnEdit}`}
                      onClick={() => handleOpenEdit(item)}
                      title="Editar Cobrança"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                      </svg>
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.btnDelete}`}
                      onClick={() => handleDeleteBilling(item)}
                      title="Excluir Cobrança"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.btnWhatsapp}`}
                      onClick={() => handleWhatsAppReminder(item)}
                      title="WhatsApp"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de <strong>{totalItems}</strong> registros
              </div>
              <div className={styles.paginationButtons}>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="Primeira Página"
                >
                  &laquo;
                </button>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  title="Anterior"
                >
                  &lsaquo;
                </button>
                
                {(() => {
                  const maxButtons = 5;
                  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                  let end = Math.min(totalPages, start + maxButtons - 1);
                  if (end - start + 1 < maxButtons) {
                    start = Math.max(1, end - maxButtons + 1);
                  }
                  
                  const buttons = [];
                  for (let i = start; i <= end; i++) {
                    buttons.push(
                      <button
                        key={i}
                        type="button"
                        className={`${styles.paginationBtn} ${currentPage === i ? styles.paginationBtnActive : ''}`}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i}
                      </button>
                    );
                  }
                  return buttons;
                })()}

                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  title="Próxima"
                >
                  &rsaquo;
                </button>
                <button
                  type="button"
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Última Página"
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
