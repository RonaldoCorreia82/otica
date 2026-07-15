'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { db, Billing, parseInstallments, Recebido } from '@/services/db';
import BillingModal from './BillingModal';
import ChangePasswordModal from './ChangePasswordModal';
import UserManagementModal from './UserManagementModal';
import UnifyModal from './UnifyModal';
import RecebidoModal from './RecebidoModal';
import CobrancasPanel from './panels/CobrancasPanel';
import RecebidosPanel from './panels/RecebidosPanel';
import RelatorioPanel from './panels/RelatorioPanel';
import BackupPanel from './panels/BackupPanel';
import VendasPanel from './panels/VendasPanel';
import MensagensPanel from './panels/MensagensPanel';
import UserManagementPanel from './panels/UserManagementPanel';
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
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUnifyModalOpen, setIsUnifyModalOpen] = useState(false);
  
  // Real-time clock state
  const [timeStr, setTimeStr] = useState<string>('');
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'cobranças' | 'vendas' | 'recebidos' | 'mensagens' | 'relatório' | 'backup' | 'gerenciar usuários'>('cobranças');
  
  // Print Mode state
  const [printMode, setPrintMode] = useState<'summary' | 'detailed' | null>(null);

  // Selected Location for printing filter state
  const [printLocationFilter, setPrintLocationFilter] = useState<string>('all');

  // Selected Location filter for main Cobranças page
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Selected Bank filter for main Cobranças page
  const [selectedBanco, setSelectedBanco] = useState<string>('all');

  // Search state for Recebidos tab
  const [recebidosSearch, setRecebidosSearch] = useState('');

  // Selected Month filter state
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');

  // Recebidos list state
  const [recebidos, setRecebidos] = useState<Recebido[]>([]);

  // Recebido modal visibility state
  const [isRecebidoModalOpen, setIsRecebidoModalOpen] = useState(false);

  // Currently editing Recebido reference state
  const [editingRecebido, setEditingRecebido] = useState<Recebido | null>(null);

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

  // Fetch billings and recebidos from Supabase
  const fetchBillings = async () => {
    setIsLoading(true);
    try {
      const [billingsData, recebidosData] = await Promise.all([
        db.getBillings(),
        db.getRecebidos()
      ]);
      setBillings(billingsData);
      setRecebidos(recebidosData);
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
    try {
      if (editingBilling && editingBilling.id) {
        const updated = await db.updateBilling(editingBilling.id, data);
        await db.syncRecebidosFromBillingObject(updated);
      } else {
        const created = await db.createBilling(data);
        await db.syncRecebidosFromBillingObject(created);
      }
      fetchBillings();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar cobrança.');
    }
  };

  // Save manual recebido handler
  const handleSaveRecebido = async (data: Omit<Recebido, 'id' | 'created_at'>) => {
    try {
      if (editingRecebido && editingRecebido.id) {
        await db.updateRecebido(editingRecebido.id, data);
      } else {
        await db.createRecebido(data);
      }
      fetchBillings();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar recebimento.');
    }
  };

  const handleOpenEditRecebido = (item: Recebido) => {
    setEditingRecebido(item);
    setIsRecebidoModalOpen(true);
  };

  const handleDeleteRecebido = async (item: Recebido) => {
    if (!item.id) return;
    if (confirm(`Tem certeza que deseja excluir o recebimento de R$ ${formatCurrency(item.valor_pago)} de ${item.nome}?`)) {
      try {
        await db.deleteRecebido(item.id);
        fetchBillings();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir recebimento.');
      }
    }
  };

  // Toggle paid handler
  const handleTogglePaid = async (item: Billing) => {
    if (!item.id) return;
    const newStatus: 'paid' | 'pending' = item.status === 'paid' ? 'pending' : 'paid';
    try {
      let updatedParcelas = item.parcelas;
      if (item.parcelas) {
        try {
          const parsed = JSON.parse(item.parcelas);
          if (Array.isArray(parsed)) {
            updatedParcelas = JSON.stringify(
              parsed.map(p => ({ ...p, paga: newStatus === 'paid' }))
            );
          }
        } catch (e) {
          console.error(e);
        }
      }
      const updated = await db.updateBilling(item.id, { status: newStatus, parcelas: updatedParcelas });
      await db.syncRecebidosFromBillingObject(updated);
      fetchBillings();
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
        fetchBillings();
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

  // Printing dispatcher
  const handlePrint = (mode: 'summary' | 'detailed', location: string = 'all') => {
    setPrintLocationFilter(location);
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode(null);
      setPrintLocationFilter('all');
    }, 150);
  };

  // Extract unique locations from billings list
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    billings.forEach(b => {
      if (b.cidade && b.cidade.trim()) {
        locations.add(b.cidade.trim());
      }
    });
    return Array.from(locations).sort();
  }, [billings]);

  // Extract unique banks from billings list
  const uniqueBancos = useMemo(() => {
    const bancos = new Set<string>();
    billings.forEach(b => {
      if (b.banco && b.banco.trim()) {
        bancos.add(b.banco.trim());
      }
    });
    return Array.from(bancos).sort();
  }, [billings]);

  // Filtering list based on search, status, location and bank
  const filteredBillings = billings.filter(item => {
    const displayStatus = getDisplayStatus(item);
    const matchesStatus = filterStatus === 'all' || displayStatus === filterStatus;
    
    const matchesLocation = selectedLocation === 'all' || 
      (item.cidade && item.cidade.trim().toLowerCase() === selectedLocation.trim().toLowerCase());

    const matchesBanco = selectedBanco === 'all' || 
      (item.banco && item.banco.trim().toLowerCase() === selectedBanco.trim().toLowerCase());
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.pagador.toLowerCase().includes(query) ||
      item.os.toLowerCase().includes(query) ||
      (item.cpf && item.cpf.includes(query)) ||
      (item.cidade && item.cidade.toLowerCase().includes(query)) ||
      (item.endereco && item.endereco.toLowerCase().includes(query)) ||
      (item.observacao && item.observacao.toLowerCase().includes(query)) ||
      (item.banco && item.banco.toLowerCase().includes(query));
    
    return matchesStatus && matchesLocation && matchesBanco && matchesSearch;
  });

  // Extracting paid installments from Supabase recebidos table
  const paidInstallments = useMemo(() => {
    return recebidos.map(r => ({
      id: r.id || Math.random().toString(),
      os: r.os,
      pagador: r.nome,
      cidade: r.cidade || '',
      endereco: r.endereco || '',
      telefone: r.telefone || '',
      vencimentoOriginal: formatDate(r.vencimento),
      pagamentoDate: formatDate(r.pagamento),
      valorPago: Number(r.valor_pago),
      parcelaLabel: r.parcela,
      statusPagamento: r.pagamento_metodo || 'Pago',
      raw: r
    }));
  }, [recebidos]);

  // Extract available payment months dynamically from recebidos database list
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    recebidos.forEach(r => {
      if (r.pagamento) {
        const [year, month] = r.pagamento.split('-');
        if (year && month) {
          months.add(`${year}-${month}`);
        }
      }
    });
    return Array.from(months).sort().reverse();
  }, [recebidos]);

  // Format month and year into user-friendly text
  const formatMonthOption = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    return `${monthNames[monthIdx]} de ${year}`;
  };

  // Filtering paid installments based on recebidosSearch query and month filter
  const filteredRecebidos = useMemo(() => {
    let list = paidInstallments;

    // 1. Month filter
    if (selectedMonthFilter !== 'all') {
      list = list.filter(item => {
        if (item.raw && item.raw.pagamento) {
          return item.raw.pagamento.startsWith(selectedMonthFilter);
        }
        return false;
      });
    }

    // 2. Search query filter
    const query = recebidosSearch.toLowerCase();
    if (query) {
      list = list.filter(item =>
        item.pagador.toLowerCase().includes(query) ||
        item.os.toLowerCase().includes(query) ||
        item.cidade.toLowerCase().includes(query) ||
        item.endereco.toLowerCase().includes(query) ||
        item.telefone.includes(query)
      );
    }

    return list;
  }, [paidInstallments, recebidosSearch, selectedMonthFilter]);

  // Pagination logic
  const totalItems = filteredBillings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBillings = filteredBillings.slice(startIndex, startIndex + pageSize);

  // Printed list filtered by location if specified
  const printedBillings = useMemo(() => {
    if (printLocationFilter === 'all') return billings;
    return billings.filter(b => b.cidade && b.cidade.trim().toLowerCase() === printLocationFilter.trim().toLowerCase());
  }, [billings, printLocationFilter]);

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
    <div className={`${styles.wrapper} ${printMode === 'detailed' ? styles.printDetailedMode : ''}`}>
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
          <button 
            type="button"
            onClick={() => setIsPasswordModalOpen(true)} 
            title="Alterar Senha"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              marginRight: '16px',
              padding: 0,
              textDecoration: 'underline'
            }}
          >
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
          className={`${styles.navLink} ${activeTab === 'relatório' ? styles.navLinkActive : ''}`}
          onClick={() => {
            setActiveTab('relatório');
            setSelectedIds(new Set());
          }}
        >
          Relatório
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
        {user.role === 'admin' && (
          <button
            className={`${styles.navLink} ${activeTab === 'gerenciar usuários' ? styles.navLinkActive : ''}`}
            onClick={() => {
              setActiveTab('gerenciar usuários');
              setSelectedIds(new Set());
            }}
          >
            Gerenciar Usuários
          </button>
        )}
      </nav>

      {/* Main Container */}
      <main className={styles.container}>
        {activeTab === 'cobranças' && (
          <CobrancasPanel
            billings={billings}
            filteredBillings={filteredBillings}
            paginatedBillings={paginatedBillings}
            totalBilled={totalBilled}
            totalPaid={totalPaid}
            totalPending={totalPending}
            totalOverdue={totalOverdue}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            selectedIds={selectedIds}
            handleToggleSelect={handleToggleSelect}
            handleToggleSelectAllPage={handleToggleSelectAllPage}
            isAllPageSelected={isAllPageSelected}
            handleOpenCreate={handleOpenCreate}
            handleOpenEdit={handleOpenEdit}
            handleTogglePaid={handleTogglePaid}
            handleDeleteBilling={handleDeleteBilling}
            handleWhatsAppReminder={handleWhatsAppReminder}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getDisplayStatus={getDisplayStatus}
            isLoading={isLoading}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            uniqueLocations={uniqueLocations}
            selectedBanco={selectedBanco}
            setSelectedBanco={setSelectedBanco}
            uniqueBancos={uniqueBancos}
            onPrint={handlePrint}
          />
        )}

        {activeTab === 'vendas' && (
          <VendasPanel />
        )}

        {activeTab === 'recebidos' && (
          <RecebidosPanel
            filteredRecebidos={filteredRecebidos}
            recebidosSearch={recebidosSearch}
            setRecebidosSearch={setRecebidosSearch}
            selectedMonthFilter={selectedMonthFilter}
            setSelectedMonthFilter={setSelectedMonthFilter}
            availableMonths={availableMonths}
            formatMonthOption={formatMonthOption}
            setIsRecebidoModalOpen={setIsRecebidoModalOpen}
            setEditingRecebido={setEditingRecebido}
            handleOpenEditRecebido={handleOpenEditRecebido}
            handleDeleteRecebido={handleDeleteRecebido}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'mensagens' && (
          <MensagensPanel />
        )}

        {activeTab === 'relatório' && (
          <RelatorioPanel
            billings={billings}
            onPrint={handlePrint}
            formatCurrency={formatCurrency}
            getDisplayStatus={getDisplayStatus}
          />
        )}

        {activeTab === 'backup' && (
          <BackupPanel onExportCSV={handleExportCSV} />
        )}

        {activeTab === 'gerenciar usuários' && user.role === 'admin' && (
          <UserManagementPanel currentUsername={user.username} />
        )}
      </main>

      {/* Slide-over Form Modal */}
      <BillingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBilling}
        editingBilling={editingBilling}
      />

      {/* Manual Recebido Form Modal */}
      <RecebidoModal
        isOpen={isRecebidoModalOpen}
        onClose={() => setIsRecebidoModalOpen(false)}
        onSave={handleSaveRecebido}
        editingRecebido={editingRecebido}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        username={user.username}
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

      {/* Hidden Print-Only Detailed Table */}
      <div className={styles.printTableArea}>
        <h2>Relatório Detalhado de Cobranças - Ótica {printLocationFilter !== 'all' ? `(${printLocationFilter})` : ''}</h2>
        <p>Gerado em {timeStr ? timeStr.split(' - ')[0] : new Date().toLocaleDateString('pt-BR')}</p>
        <table className={styles.printTable}>
          <thead>
            <tr>
              <th style={{ width: '12%' }}>OS</th>
              <th style={{ width: '22%' }}>Pagador / CPF / Contato</th>
              <th style={{ width: '18%' }}>Localização / Endereço</th>
              <th style={{ width: '11%' }}>Banco</th>
              <th style={{ width: '11%' }}>Vencimento</th>
              <th style={{ width: '11%' }}>Valor</th>
              <th style={{ width: '15%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {printedBillings.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: '600' }}>#{item.os}</td>
                <td>
                  <div>{item.pagador}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                    {item.cpf && `CPF: ${item.cpf}`}
                    {item.cpf && item.telefone && ' | '}
                    {item.telefone && `Tel: ${item.telefone}`}
                  </div>
                </td>
                <td>
                  <div>{item.cidade || '-'}</div>
                  {item.endereco && <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{item.endereco}</div>}
                </td>
                <td>{item.banco || '-'}</td>
                <td style={{ padding: '0' }}>
                  {(() => {
                    const installments = parseInstallments(item);
                    if (installments) {
                      return (
                        <div className={styles.printInstallmentsCol}>
                          {installments.map((inst, idx) => (
                            <div key={idx} className={`${styles.printInstallmentRow} ${inst.paga ? styles.printInstallmentPaid : ''}`}>
                              {inst.date} {inst.paga && '✓'}
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return <div style={{ padding: '6px 8px' }}>{formatDate(item.vencimento)}</div>;
                  })()}
                </td>
                <td style={{ padding: '0' }}>
                  {(() => {
                    const installments = parseInstallments(item);
                    if (installments) {
                      return (
                        <div className={styles.printInstallmentsCol}>
                          {installments.map((inst, idx) => (
                            <div key={idx} className={`${styles.printInstallmentRow} ${inst.paga ? styles.printInstallmentPaid : ''}`}>
                              {formatCurrency(inst.value)}
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return <div style={{ padding: '6px 8px' }}>{formatCurrency(item.valor)}</div>;
                  })()}
                </td>
                <td>
                  <span className={item.status === 'paid' ? styles.printBadgePaid : item.status === 'overdue' ? styles.printBadgeOverdue : styles.printBadgePending}>
                    {item.status === 'paid' ? 'Pago' : item.status === 'overdue' ? 'Vencido' : 'Pendente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
