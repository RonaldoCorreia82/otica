'use client';

import styles from '../Dashboard.module.css';

interface RecebidosPanelProps {
  filteredRecebidos: any[];
  recebidosSearch: string;
  setRecebidosSearch: (val: string) => void;
  selectedMonthFilter: string;
  setSelectedMonthFilter: (val: string) => void;
  availableMonths: string[];
  formatMonthOption: (ym: string) => string;
  setIsRecebidoModalOpen: (val: boolean) => void;
  setEditingRecebido: (val: any) => void;
  handleOpenEditRecebido: (val: any) => void;
  handleDeleteRecebido: (val: any) => void;
  formatCurrency: (val: number) => string;
}

export default function RecebidosPanel({
  filteredRecebidos,
  recebidosSearch,
  setRecebidosSearch,
  selectedMonthFilter,
  setSelectedMonthFilter,
  availableMonths,
  formatMonthOption,
  setIsRecebidoModalOpen,
  setEditingRecebido,
  handleOpenEditRecebido,
  handleDeleteRecebido,
  formatCurrency
}: RecebidosPanelProps) {
  return (
    <div className={styles.recebidosPanel}>
      <div className={styles.recebidosHeader}>
        <div>
          <h3>Controle de Recebidos</h3>
          <p className={styles.recebidosSubtitle}>Visualização e consulta de todas as parcelas e cobranças quitadas.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={styles.recebidosSummary}>
            <span className={styles.recebidosSummaryLabel}>Total Recebido:</span>
            <span className={styles.recebidosSummaryValue}>
              {formatCurrency(filteredRecebidos.reduce((acc, curr) => acc + curr.valorPago, 0))}
            </span>
            <span className={styles.recebidosSummaryCount}>
              ({filteredRecebidos.length} {filteredRecebidos.length === 1 ? 'parcela quitada' : 'parcelas quitadas'})
            </span>
          </div>
          <button type="button" className={styles.addBtn} onClick={() => { setEditingRecebido(null); setIsRecebidoModalOpen(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span style={{ verticalAlign: 'middle' }}>Adicionar Recebido</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className={styles.recebidosBar} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className={styles.searchBox} style={{ flex: 1, minWidth: '260px', marginBottom: 0 }}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar por nome, OS, cidade ou telefone..."
            value={recebidosSearch}
            onChange={(e) => setRecebidosSearch(e.target.value)}
            className={styles.searchInput}
          />
          {recebidosSearch && (
            <button onClick={() => setRecebidosSearch('')} className={styles.clearSearchBtn} title="Limpar pesquisa">
              &times;
            </button>
          )}
        </div>

        <select
          className={styles.filterSelect}
          value={selectedMonthFilter}
          onChange={(e) => setSelectedMonthFilter(e.target.value)}
          style={{ height: '42px', minWidth: '180px' }}
        >
          <option value="all">Todos os Meses</option>
          {availableMonths.map(ym => (
            <option key={ym} value={ym}>
              {formatMonthOption(ym)}
            </option>
          ))}
        </select>
      </div>

      {/* Table Container */}
      {filteredRecebidos.length === 0 ? (
        <div className={styles.recebidosEmpty}>
          <div className={styles.recebidosEmptyIcon}>💰</div>
          <h4>Nenhum recebido encontrado</h4>
          <p>Não há parcelas pagas registradas ou compatíveis com a busca.</p>
        </div>
      ) : (
        <div className={styles.recebidosTableWrapper}>
          <table className={styles.recebidosTable}>
            <thead>
              <tr>
                <th className={styles.recebidosTh} style={{ width: '5%' }}>OS</th>
                <th className={styles.recebidosTh} style={{ width: '18%' }}>NOME</th>
                <th className={styles.recebidosTh} style={{ width: '9%' }}>CIDADE</th>
                <th className={styles.recebidosTh} style={{ width: '9%' }}>VENCIMENTO</th>
                <th className={styles.recebidosTh} style={{ width: '15%' }}>ENDEREÇO</th>
                <th className={styles.recebidosTh} style={{ width: '9%' }}>TELEFONE</th>
                <th className={styles.recebidosTh} style={{ width: '9%' }}>PAGAMENTO</th>
                <th className={styles.recebidosTh} style={{ width: '9%' }}>VALOR PAGO</th>
                <th className={styles.recebidosTh} style={{ width: '7%' }}>PARCELA</th>
                <th className={styles.recebidosTh} style={{ width: '9%' }}>PAGAMENTO</th>
                <th className={styles.recebidosTh} style={{ width: '100px', textAlign: 'right' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecebidos.map((item) => (
                <tr key={item.id} className={styles.recebidosTr}>
                  <td className={styles.recebidosTd} style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                    #{item.os}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '600' }} title={item.pagador}>
                    {item.pagador}
                  </td>
                  <td className={styles.recebidosTd}>
                    {item.cidade || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd}>
                    {item.vencimentoOriginal}
                  </td>
                  <td className={styles.recebidosTd} title={item.endereco || ''}>
                    {item.endereco || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd}>
                    {item.telefone || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '500' }}>
                    {item.pagamentoDate}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '700', color: 'var(--success)' }}>
                    {formatCurrency(item.valorPago)}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                    {item.parcelaLabel}
                  </td>
                  <td className={styles.recebidosTd}>
                    <span className={styles.recebidosBadgePaid}>
                      {item.statusPagamento}
                    </span>
                  </td>
                  <td className={styles.recebidosTd}>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end', margin: 0, padding: 0 }}>
                      <button
                        className={`${styles.actionBtn} ${styles.btnEdit}`}
                        title="Editar Recebido"
                        onClick={() => handleOpenEditRecebido(item.raw)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                        </svg>
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.btnDelete}`}
                        title="Excluir Recebido"
                        onClick={() => handleDeleteRecebido(item.raw)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
