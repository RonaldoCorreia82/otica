'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, Venda } from '@/services/db';
import VendaModal from '../VendaModal';
import styles from '../Dashboard.module.css';

export default function VendasPanel() {
  const [subTab, setSubTab] = useState<'sede' | 'povoados'>('sede');
  const [vendasSede, setVendasSede] = useState<Venda[]>([]);
  const [vendasPovoados, setVendasPovoados] = useState<Venda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);

  const fetchVendas = async () => {
    setIsLoading(true);
    try {
      if (subTab === 'sede') {
        const data = await db.getVendasSede();
        setVendasSede(data);
      } else {
        const data = await db.getVendasPovoados();
        setVendasPovoados(data);
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
  }, [subTab]);

  const activeVendas = useMemo(() => {
    return subTab === 'sede' ? vendasSede : vendasPovoados;
  }, [subTab, vendasSede, vendasPovoados]);

  // Client side search filtering
  const filteredVendas = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return activeVendas;
    return activeVendas.filter(item =>
      (item.paciente && item.paciente.toLowerCase().includes(query)) ||
      (item.os && item.os.toLowerCase().includes(query)) ||
      (item.lab && item.lab.toLowerCase().includes(query)) ||
      (item.cidade && item.cidade.toLowerCase().includes(query)) ||
      (item.endereco && item.endereco.toLowerCase().includes(query)) ||
      (item.telefone && item.telefone.includes(query))
    );
  }, [activeVendas, searchQuery]);

  // Metrics calculations
  const metrics = useMemo(() => {
    const totalCount = filteredVendas.length;
    const totalAmount = filteredVendas.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    return {
      totalCount,
      totalAmount,
      averageAmount
    };
  }, [filteredVendas]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSaveVenda = async (vendaData: Omit<Venda, 'id' | 'created_at'>) => {
    try {
      if (editingVenda?.id) {
        if (subTab === 'sede') {
          await db.updateVendaSede(editingVenda.id, vendaData);
        } else {
          await db.updateVendaPovoados(editingVenda.id, vendaData);
        }
      } else {
        if (subTab === 'sede') {
          await db.createVendaSede(vendaData);
        } else {
          await db.createVendaPovoados(vendaData);
        }
      }
      fetchVendas();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteVenda = async (item: Venda) => {
    if (!item.id) return;
    if (confirm(`Tem certeza de que deseja excluir a venda de "${item.paciente}"?`)) {
      try {
        if (subTab === 'sede') {
          await db.deleteVendaSede(item.id);
        } else {
          await db.deleteVendaPovoados(item.id);
        }
        fetchVendas();
      } catch (err) {
        console.error(err);
        alert('Erro ao deletar venda.');
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingVenda(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Venda) => {
    setEditingVenda(item);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.recebidosPanel}>
      {/* Vendas Sub-tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => { setSubTab('sede'); setSearchQuery(''); }}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: subTab === 'sede' ? '3px solid var(--primary)' : '3px solid transparent',
            color: subTab === 'sede' ? 'var(--text-main)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            padding: '12px 24px',
            transition: 'all var(--transition-fast)'
          }}
        >
          Vendas Sede
        </button>
        <button
          type="button"
          onClick={() => { setSubTab('povoados'); setSearchQuery(''); }}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: subTab === 'povoados' ? '3px solid var(--primary)' : '3px solid transparent',
            color: subTab === 'povoados' ? 'var(--text-main)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            padding: '12px 24px',
            transition: 'all var(--transition-fast)'
          }}
        >
          Vendas Povoados
        </button>
      </div>

      <div className={styles.recebidosHeader}>
        <div>
          <h3>Controle de Vendas ({subTab === 'sede' ? 'Sede' : 'Povoados'})</h3>
          <p className={styles.recebidosSubtitle}>Gerenciamento de vendas de óculos, lentes e armações.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={styles.recebidosSummary}>
            <span className={styles.recebidosSummaryLabel} style={{ color: 'var(--text-secondary)' }}>Faturamento:</span>
            <span className={styles.recebidosSummaryValue} style={{ color: 'var(--primary)' }}>
              {formatCurrency(metrics.totalAmount)}
            </span>
            <span className={styles.recebidosSummaryCount} style={{ marginLeft: '8px' }}>
              ({metrics.totalCount} {metrics.totalCount === 1 ? 'venda' : 'vendas'} | Média: {formatCurrency(metrics.averageAmount)})
            </span>
          </div>
          <button type="button" className={styles.addBtn} onClick={handleOpenCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span style={{ verticalAlign: 'middle' }}>Nova Venda</span>
          </button>
        </div>
      </div>

      {/* Search Input Box */}
      <div className={styles.recebidosBar}>
        <div className={styles.searchBox} style={{ flex: 1, marginBottom: 0 }}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar por paciente, OS, lab, cidade, telefone ou endereço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearSearchBtn} title="Limpar pesquisa">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Table & List View */}
      {isLoading ? (
        <div className={styles.loadingContainer} style={{ padding: '40px 0' }}>
          <div className={styles.spinner}></div>
          <p>Carregando vendas...</p>
        </div>
      ) : filteredVendas.length === 0 ? (
        <div className={styles.recebidosEmpty}>
          <div className={styles.recebidosEmptyIcon}>🛒</div>
          <h4>Nenhuma venda encontrada</h4>
          <p>Não há vendas registradas ou compatíveis com a busca.</p>
        </div>
      ) : (
        <div className={styles.recebidosTableWrapper} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <table className={styles.recebidosTable} style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th className={styles.recebidosTh} style={{ width: '8%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>NIVER</th>
                <th className={styles.recebidosTh} style={{ width: '10%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>LAB</th>
                <th className={styles.recebidosTh} style={{ width: '7%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>OS</th>
                <th className={styles.recebidosTh} style={{ width: '22%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>PACIENTE</th>
                <th className={styles.recebidosTh} style={{ width: '9%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>CIDADE</th>
                <th className={styles.recebidosTh} style={{ width: '10%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>TELEFONE</th>
                <th className={styles.recebidosTh} style={{ width: '10%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>VALOR TOTAL</th>
                <th className={styles.recebidosTh} style={{ width: '6%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>VEZES</th>
                <th className={styles.recebidosTh} style={{ width: '10%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>PARCELA</th>
                <th className={styles.recebidosTh} style={{ width: '8%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>COMPRA</th>
                <th className={styles.recebidosTh} style={{ width: '15%', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', borderBottom: '1px solid var(--border-color)' }}>ENDEREÇO</th>
                <th className={styles.recebidosTh} style={{ width: '100px', backgroundColor: '#f1f5f9 !important', color: 'var(--text-main) !important', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendas.map((item) => (
                <tr key={item.id} className={styles.recebidosTr}>
                  <td className={styles.recebidosTd} style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                    {item.aniversario || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '500' }}>
                    {item.lab || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {item.os ? `#${item.os}` : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '600' }} title={item.paciente}>
                    {item.paciente}
                  </td>
                  <td className={styles.recebidosTd}>
                    {item.cidade || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd}>
                    {item.telefone || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    {item.valor_total != null ? formatCurrency(Number(item.valor_total)) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '600', color: 'var(--primary)' }}>
                    {item.vezes || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '600' }}>
                    {item.valor_parcela != null ? formatCurrency(Number(item.valor_parcela)) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                    {item.compra || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd} title={item.endereco || ''}>
                    {item.endereco || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className={styles.recebidosTd}>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end', margin: 0, padding: 0 }}>
                      <button
                        className={`${styles.actionBtn} ${styles.btnEdit}`}
                        title="Editar Venda"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                        </svg>
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.btnDelete}`}
                        title="Excluir Venda"
                        onClick={() => handleDeleteVenda(item)}
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

      {/* Sale Form Modal */}
      <VendaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVenda}
        editingVenda={editingVenda}
      />
    </div>
  );
}
