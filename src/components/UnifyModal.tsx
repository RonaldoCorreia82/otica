'use client';

import { useState, useEffect } from 'react';
import { db, Billing } from '@/services/db';
import styles from './UnifyModal.module.css';

interface UnifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBillings: Billing[];
  onSuccess: () => void;
}

export default function UnifyModal({ isOpen, onClose, selectedBillings, onSuccess }: UnifyModalProps) {
  // Form states
  const [pagador, setPagador] = useState('');
  const [os, setOs] = useState('');
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [cpf, setCpf] = useState('');
  const [observacao, setObservacao] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (isOpen && selectedBillings.length > 0) {
      setError('');
      setSuccess('');

      // 1. Calculate values
      const sumValor = selectedBillings.reduce((acc, curr) => acc + curr.valor, 0);
      setValor(sumValor);

      // 2. Combine OS
      const combinedOs = selectedBillings.map(b => b.os).filter(Boolean).join(', ');
      setOs(combinedOs);

      // 3. Set primary pagador
      const firstPagador = selectedBillings[0]?.pagador || '';
      setPagador(firstPagador);

      // 4. Find latest due date (lexicographical comparison YYYY-MM-DD works)
      const dates = selectedBillings.map(b => b.vencimento).filter(Boolean);
      const latestDate = dates.length > 0 ? [...dates].sort().reverse()[0] : '';
      setVencimento(latestDate);

      // 5. Gather contact & location details
      const firstPhone = selectedBillings.find(b => b.telefone)?.telefone || '';
      setTelefone(firstPhone);

      const firstCity = selectedBillings.find(b => b.cidade)?.cidade || '';
      setCidade(firstCity);

      const firstAddress = selectedBillings.find(b => b.endereco)?.endereco || '';
      setEndereco(firstAddress);

      const firstCpf = selectedBillings.find(b => b.cpf)?.cpf || '';
      setCpf(firstCpf);

      // 6. Gather original observations only
      const origObs = selectedBillings
        .map(b => b.observacao)
        .filter(Boolean)
        .join(' | ');
      setObservacao(origObs);
    }
  }, [isOpen, selectedBillings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!pagador.trim() || !os.trim() || !vencimento || valor <= 0) {
      setError('Por favor, preencha os campos obrigatórios (Pagador, OS, Vencimento e Valor).');
      return;
    }

    setIsSubmitting(true);
    try {
      const idsToDelete = selectedBillings.map(b => b.id).filter(Boolean) as string[];
      
      const unifiedData: Omit<Billing, 'id' | 'created_at'> = {
        os: os.trim(),
        pagador: pagador.trim(),
        vencimento,
        valor,
        endereco: endereco.trim() || undefined,
        telefone: telefone.trim() || undefined,
        cidade: cidade.trim() || undefined,
        cpf: cpf.trim() || undefined,
        observacao: observacao.trim() || undefined,
        status: 'pending', // default to pending after negotiation
        parcelas: JSON.stringify(selectedBillings.map(b => ({
          vencimento: b.vencimento,
          valor: b.valor
        })))
      };

      await db.unifyBillings(idsToDelete, unifiedData);
      setSuccess('Cobranças unificadas com sucesso!');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao unificar cobranças.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Unificar Cobranças</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>

        <div className={styles.body}>
          {/* List of selected items */}
          <div className={styles.selectedList}>
            <h3 className={styles.selectedListTitle}>Cobranças Selecionadas ({selectedBillings.length})</h3>
            <div className={styles.itemsGrid}>
              {selectedBillings.map((b) => (
                <div key={b.id} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemOs}>OS #{b.os}</span>
                    <span className={styles.itemDate}>{formatDate(b.vencimento)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <span>{b.pagador}</span>
                  </div>
                  <span className={styles.itemValue}>{formatCurrency(b.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Pagador *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={pagador}
                  onChange={(e) => setPagador(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>OS Consolidadas *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={os}
                  onChange={(e) => setOs(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Valor Total Unificado (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.input}
                  value={valor}
                  onChange={(e) => setValor(Number(e.target.value))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Novo Vencimento *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Telefone de Contato</label>
                <input
                  type="text"
                  className={styles.input}
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>CPF</label>
                <input
                  type="text"
                  className={styles.input}
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Cidade</label>
                <input
                  type="text"
                  className={styles.input}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Endereço Completo</label>
                <input
                  type="text"
                  className={styles.input}
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.inputGroupFull}`}>
                <label className={styles.label}>Observações / Histórico de Negociação</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Unificando...' : 'Confirmar Unificação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
