'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db, Billing, parseInstallments } from '@/services/db';
import BillingModal from './BillingModal';
import ChangePasswordModal from './ChangePasswordModal';
import UserManagementModal from './UserManagementModal';
import UnifyModal from './UnifyModal';
import styles from './Dashboard.module.css';

interface DashboardProps {
  user: { username: string; role: 'admin' | 'operator' };
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states for user management and change password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUnifyModalOpen, setIsUnifyModalOpen] = useState(false);
  
  // Real-time clock state
  const [timeStr, setTimeStr] = useState<string>('');
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'cobranças' | 'vendas' | 'recebidos' | 'mensagens' | 'backup'>('cobranças');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setTimeStr(`${datePart} - ${timePart}`);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<Billing | null>(null);

  // Reset to first page when search query or filter status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Fetch billings from Supabase
  const fetchBillings = async () => {
    setIsLoading(true);
    try {
      const data = await db.getBillings();
      setBillings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  // Selection helpers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Format date helper (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Determine display status based on due date
  const getDisplayStatus = (item: Billing): 'paid' | 'pending' | 'overdue' => {
    if (item.status === 'paid') return 'paid';
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (item.vencimento < todayStr) return 'overdue';
    
    return item.status;
  };

  // Metrics calculations
  const totalBilled = billings.reduce((acc, curr) => acc + curr.valor, 0);
  
  const totalPaid = billings
    .filter(item => getDisplayStatus(item) === 'paid')
    .reduce((acc, curr) => acc + curr.valor, 0);
    
  const totalPending = billings
    .filter(item => getDisplayStatus(item) === 'pending')
    .reduce((acc, curr) => acc + curr.valor, 0);
    
  const totalOverdue = billings
    .filter(item => getDisplayStatus(item) === 'overdue')
    .reduce((acc, curr) => acc + curr.valor, 0);

  // Save billing handler (insert or update)
  const handleSaveBilling = async (data: Omit<Billing, 'id' | 'created_at'>) => {
    if (editingBilling && editingBilling.id) {
      const updated = await db.updateBilling(editingBilling.id, data);
      setBillings(prev => prev.map(item => item.id === editingBilling.id ? updated : item));
    } else {
      const created = await db.createBilling(data);
      setBillings(prev => [...prev, created]);
    }
  };

  // Toggle paid handler
  const handleTogglePaid = async (item: Billing) => {
    if (!item.id) return;
    const newStatus: 'paid' | 'pending' = item.status === 'paid' ? 'pending' : 'paid';
    try {
      const updated = await db.updateBilling(item.id, { status: newStatus });
      setBillings(prev => prev.map(b => b.id === item.id ? updated : b));
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    }
  };

  // Delete billing handler
  const handleDeleteBilling = async (item: Billing) => {
    if (!item.id) return;
    if (confirm(`Tem certeza que deseja excluir a cobrança da OS ${item.os} (${item.pagador}) no valor de ${formatCurrency(item.valor)}?`)) {
      try {
        await db.deleteBilling(item.id);
        setBillings(prev => prev.filter(b => b.id !== item.id));
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir cobrança.');
      }
    }
  };

  // Open modal for editing
  const handleOpenEdit = (item: Billing) => {
    setEditingBilling(item);
    setIsModalOpen(true);
  };

  // Open modal for creating new
  const handleOpenCreate = () => {
    setEditingBilling(null);
    setIsModalOpen(true);
  };

  // Open WhatsApp reminder
  const handleWhatsAppReminder = (item: Billing) => {
    const displayStatus = getDisplayStatus(item);
    let message = '';

    if (displayStatus === 'paid') {
      message = `Olá *${item.pagador}*, confirmamos o recebimento do seu pagamento no valor de *${formatCurrency(item.valor)}* referente à OS *#${item.os}*. Muito obrigado!`;
    } else if (displayStatus === 'overdue') {
      message = `Olá *${item.pagador}*, passamos para lembrar que a cobrança no valor de *${formatCurrency(item.valor)}* da sua OS *#${item.os}* venceu em *${formatDate(item.vencimento)}*. Solicitamos que regularize o quanto antes. Qualquer dúvida estamos à disposição!`;
    } else {
      message = `Olá *${item.pagador}*, lembramos que a cobrança no valor de *${formatCurrency(item.valor)}* da sua OS *#${item.os}* tem vencimento em *${formatDate(item.vencimento)}*. Caso já tenha realizado o pagamento, favor desconsiderar. Obrigado!`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Export to CSV Backup
  const handleExportCSV = () => {
    if (billings.length === 0) return;
    
    const headers = ['OS', 'Pagador', 'CPF', 'Telefone', 'Cidade', 'Endereço', 'Vencimento', 'Valor', 'Status', 'Banco', 'Observações'];
    const rows = billings.map(b => [
      b.os,
      b.pagador,
      b.cpf || '',
      b.telefone || '',
      b.cidade || '',
      b.endereco || '',
      b.vencimento,
      b.valor,
      b.status,
      b.banco || '',
      b.observacao || ''
    ]);
    
    // Create CSV content with UTF-8 BOM for Portuguese Excel encoding compatibility
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `backup_otica_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering list based on search and status
  const filteredBillings = billings.filter(item => {
    const displayStatus = getDisplayStatus(item);
    const matchesStatus = filterStatus === 'all' || displayStatus === filterStatus;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.pagador.toLowerCase().includes(query) ||
      item.os.toLowerCase().includes(query) ||
      (item.cpf && item.cpf.includes(query)) ||
      (item.cidade && item.cidade.toLowerCase().includes(query)) ||
      (item.endereco && item.endereco.toLowerCase().includes(query)) ||
      (item.observacao && item.observacao.toLowerCase().includes(query)) ||
      (item.banco && item.banco.toLowerCase().includes(query));
    
    return matchesStatus && matchesSearch;
  });

  // Pagination logic
  const totalItems = filteredBillings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBillings = filteredBillings.slice(startIndex, startIndex + pageSize);

  // Select all visible items on current page helpers
  const pageIds = paginatedBillings.map(b => b.id).filter(Boolean) as string[];
  const isAllPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
  const handleToggleSelectAllPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectedBillings = billings.filter(b => b.id && selectedIds.has(b.id));

  return (
    <div className={styles.wrapper}>
      {/* Navbar Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Image
            className={styles.headerLogo}
            src="/logo.jpg"
            alt="Logo Ótica"
            width={38}
            height={38}
          />
          <span className={styles.headerTitle}>Ótica</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userInfo}>
            Olá, <strong>{user.username}</strong> ({user.role === 'admin' ? 'Admin' : 'Operador'})
            {timeStr && <span className={styles.userTime}> • {timeStr}</span>}
          </span>
          {user.role === 'admin' && (
            <button className={styles.userMgmtBtn} onClick={() => setIsUserModalOpen(true)} title="Gerenciar Usuários">
              Gerenciar Usuários
            </button>
          )}
          <button className={styles.pwdBtn} onClick={() => setIsPasswordModalOpen(true)} title="Alterar Senha">
            Alterar Senha
          </button>
          <button className={styles.logoutBtn} onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sair
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className={styles.navBar}>
        <button
          className={`${styles.navLink} ${activeTab === 'cobranças' ? styles.navLinkActive : ''}`}
          onClick={() => setActiveTab('cobranças')}
        >
          Cobranças
        </button>
        <button
          className={`${styles.navLink} ${activeTab === 'vendas' ? styles.navLinkActive : ''}`}
          onClick={() => {
            setActiveTab('vendas');
            setSelectedIds(new Set());
          }}
        >
          Vendas
        </button>
        <button
          className={`${styles.navLink} ${activeTab === 'recebidos' ? styles.navLinkActive : ''}`}
          onClick={() => {
            setActiveTab('recebidos');
            setSelectedIds(new Set());
          }}
        >
          Recebidos
        </button>
        <button
          className={`${styles.navLink} ${activeTab === 'mensagens' ? styles.navLinkActive : ''}`}
          onClick={() => {
            setActiveTab('mensagens');
            setSelectedIds(new Set());
          }}
        >
          Mensagens
        </button>
        <button
          className={`${styles.navLink} ${activeTab === 'backup' ? styles.navLinkActive : ''}`}
          onClick={() => {
            setActiveTab('backup');
            setSelectedIds(new Set());
          }}
        >
          Backup
        </button>
      </nav>

      {/* Main Container */}
      <main className={styles.container}>
        {activeTab === 'cobranças' && (
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
                        <td className={styles.td} style={{ paddingLeft: '14px', paddingRight: '0', width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id || '')}
                            onChange={() => handleToggleSelect(item.id || '')}
                            className={styles.checkbox}
                          />
                        </td>
                        <td className={styles.td} style={{ fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          #{item.os}
                        </td>
                        <td className={styles.td}>
                          <div className={styles.clientName}>{item.pagador}</div>
                          <div className={styles.clientDesc}>
                            {item.cpf && `CPF: ${item.cpf}`}
                            {item.cpf && item.telefone && ' | '}
                            {item.telefone && `Tel: ${item.telefone}`}
                            {!item.cpf && !item.telefone && <span style={{ color: 'var(--text-muted)' }}>Sem contato cadastrado</span>}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div>{item.cidade || <span style={{ color: 'var(--text-muted)' }}>-</span>}</div>
                          {item.endereco && <div className={styles.clientDesc} title={item.endereco}>{item.endereco}</div>}
                        </td>
                        <td className={styles.td}>
                          <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                            {item.banco || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </span>
                        </td>
                        <td className={styles.td} style={{ padding: '0' }}>
                          {(() => {
                            const installments = parseInstallments(item);
                            if (installments) {
                              return (
                                <div className={styles.installmentsCol}>
                                  {installments.map((inst, idx) => (
                                    <div key={idx} className={styles.installmentRow}>
                                      {inst.date}
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
                        <td className={`${styles.td} ${styles.value}`} style={{ padding: '0' }}>
                          {(() => {
                            const installments = parseInstallments(item);
                            if (installments) {
                              return (
                                <div className={styles.installmentsCol}>
                                  {installments.map((inst, idx) => (
                                    <div key={idx} className={`${styles.installmentRow} ${styles.value}`}>
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
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', padding: '2px 0' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>Venc: {inst.date}</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formatCurrency(inst.value)}</span>
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
                        title="Editar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                        </svg>
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.btnDelete}`}
                        onClick={() => handleDeleteBilling(item)}
                        title="Excluir"
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
                  Exibindo <strong>{startIndex + 1}</strong> a{' '}
                  <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de{' '}
                  <strong>{totalItems}</strong> registros
                </div>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="Primeira Página"
                  >
                    &laquo;
                  </button>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    title="Página Anterior"
                  >
                    &lsaquo;
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return <span key={`ellipsis-${pageNum}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>;
                    }
                    return null;
                  })}

                  <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    title="Próxima Página"
                  >
                    &rsaquo;
                  </button>
                  <button
                    className={styles.pageBtn}
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
        )}

        {activeTab === 'backup' && (
          <div className={styles.placeholderPanel}>
            <div className={styles.placeholderIcon}>💾</div>
            <h3>Backup do Banco de Dados</h3>
            <p>Faça o download do backup completo de todas as cobranças registradas no sistema em formato CSV.</p>
            <button type="button" className={styles.backupBtn} onClick={handleExportCSV}>
              Exportar Cobranças (CSV)
            </button>
          </div>
        )}

        {activeTab === 'vendas' && (
          <div className={styles.placeholderPanel}>
            <div className={styles.placeholderIcon}>🛒</div>
            <h3>Módulo de Vendas</h3>
            <p>Esta área está em desenvolvimento. Em breve você poderá gerenciar as vendas da Ótica diretamente por aqui.</p>
          </div>
        )}

        {activeTab === 'recebidos' && (
          <div className={styles.placeholderPanel}>
            <div className={styles.placeholderIcon}>💰</div>
            <h3>Controle de Recebidos</h3>
            <p>Esta área está em desenvolvimento. Em breve você terá relatórios e gráficos detalhados dos valores recebidos.</p>
          </div>
        )}

        {activeTab === 'mensagens' && (
          <div className={styles.placeholderPanel}>
            <div className={styles.placeholderIcon}>💬</div>
            <h3>Gerenciador de Mensagens</h3>
            <p>Esta área está em desenvolvimento. Em breve você poderá criar modelos de mensagens e disparos automatizados.</p>
          </div>
        )}
      </main>

      {/* Slide-over Form Modal */}
      <BillingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBilling}
        editingBilling={editingBilling}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        username={user.username}
      />

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUsername={user.username}
      />

      {/* Unify Modal */}
      <UnifyModal
        isOpen={isUnifyModalOpen}
        onClose={() => setIsUnifyModalOpen(false)}
        selectedBillings={selectedBillings}
        onSuccess={() => {
          fetchBillings();
          setSelectedIds(new Set());
        }}
      />

      {/* Floating Action Bar */}
      {activeTab === 'cobranças' && selectedIds.size > 0 && (
        <div className={styles.floatingActionBar}>
          <span className={styles.selectedCount}>
            {selectedIds.size} {selectedIds.size === 1 ? 'cobrança selecionada' : 'cobranças selecionadas'}
          </span>
          <button 
            type="button"
            className={styles.unifyActionBtn}
            onClick={() => setIsUnifyModalOpen(true)}
            disabled={selectedIds.size < 2}
            title={selectedIds.size < 2 ? "Selecione pelo menos 2 cobranças para unificar" : "Unificar cobranças selecionadas"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 11 12 14 22 4"></polyline>
            </svg>
            Unificar Cobranças
          </button>
          <button type="button" className={styles.clearSelectionBtn} onClick={handleClearSelection}>
            Limpar Seleção
          </button>
        </div>
      )}
    </div>
  );
}
