'use client';

import { useState, useEffect } from 'react';
import { Billing } from '@/services/db';
import styles from './BillingModal.module.css';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (billing: Omit<Billing, 'id' | 'created_at'>) => Promise<void>;
  editingBilling: Billing | null;
}

interface ModalInstallment {
  id: string;
  vencimento: string;
  valor: string;
}

export default function BillingModal({ isOpen, onClose, onSave, editingBilling }: BillingModalProps) {
  const [os, setOs] = useState('');
  const [pagador, setPagador] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [cpf, setCpf] = useState('');
  const [observacao, setObservacao] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Installments state
  const [installments, setInstallments] = useState<ModalInstallment[]>([]);

  const handleAddInstallment = () => {
    const today = new Date().toISOString().split('T')[0];
    setInstallments(prev => [
      ...prev,
      { id: Math.random().toString(), vencimento: today, valor: '' }
    ]);
  };

  const handleRemoveInstallment = (id: string) => {
    setInstallments(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateInstallment = (id: string, field: 'vencimento' | 'valor', value: string) => {
    setInstallments(prev =>
      prev.map(i => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  useEffect(() => {
    if (editingBilling) {
      setOs(editingBilling.os);
      setPagador(editingBilling.pagador);
      setEndereco(editingBilling.endereco || '');
      setTelefone(editingBilling.telefone || '');
      setCidade(editingBilling.cidade || '');
      setCpf(editingBilling.cpf || '');
      setObservacao(editingBilling.observacao || '');
      setStatus(editingBilling.status);
      
      if (editingBilling.parcelas) {
        try {
          const parsed = JSON.parse(editingBilling.parcelas);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInstallments(
              parsed.map((p: any) => ({
                id: Math.random().toString(),
                vencimento: p.vencimento,
                valor: p.valor.toString()
              }))
            );
          } else {
            setInstallments([{ id: '1', vencimento: editingBilling.vencimento, valor: editingBilling.valor.toString() }]);
          }
        } catch (e) {
          setInstallments([{ id: '1', vencimento: editingBilling.vencimento, valor: editingBilling.valor.toString() }]);
        }
      } else {
        setInstallments([{ id: '1', vencimento: editingBilling.vencimento, valor: editingBilling.valor.toString() }]);
      }
    } else {
      setOs('');
      setPagador('');
      setEndereco('');
      setTelefone('');
      setCidade('');
      setCpf('');
      setObservacao('');
      setStatus('pending');
      const today = new Date().toISOString().split('T')[0];
      setInstallments([{ id: '1', vencimento: today, valor: '' }]);
    }
  }, [editingBilling, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!os || !pagador || installments.some(i => !i.vencimento || !i.valor)) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      const sumValor = installments.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);
      const latestVenc = [...installments].map(i => i.vencimento).sort().reverse()[0];
      const serializedParcelas = JSON.stringify(
        installments.map(i => ({
          vencimento: i.vencimento,
          valor: parseFloat(i.valor)
        }))
      );

      await onSave({
        os,
        pagador,
        vencimento: latestVenc,
        valor: sumValor,
        endereco: endereco || undefined,
        telefone: telefone || undefined,
        cidade: cidade || undefined,
        cpf: cpf || undefined,
        observacao: observacao || undefined,
        status,
        parcelas: serializedParcelas
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao salvar a cobrança.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editingBilling ? 'Editar Cobrança' : 'Nova Cobrança'}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="os" className={styles.label}>
                Número da OS *
              </label>
              <input
                id="os"
                type="text"
                className={styles.input}
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Ex: OS-1029"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="cpf" className={styles.label}>
                CPF do Pagador
              </label>
              <input
                id="cpf"
                type="text"
                className={styles.input}
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="pagador" className={styles.label}>
              Nome do Pagador *
            </label>
            <input
              id="pagador"
              type="text"
              className={styles.input}
              value={pagador}
              onChange={(e) => setPagador(e.target.value)}
              placeholder="Nome completo do cliente pagador"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Installments List Section */}
          <div className={styles.installmentsSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Parcelas (Vencimento / Valor)</span>
              <button
                type="button"
                className={styles.addInstallmentBtn}
                onClick={handleAddInstallment}
                disabled={isSubmitting}
              >
                + Adicionar Parcela
              </button>
            </div>
            
            <div className={styles.installmentsList}>
              {installments.map((inst, idx) => (
                <div key={inst.id} className={styles.installmentFormRow}>
                  <div className={styles.inputGroup} style={{ flex: 1.2 }}>
                    <label className={styles.label}>Vencimento {idx + 1} *</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={inst.vencimento}
                      onChange={(e) => handleUpdateInstallment(inst.id, 'vencimento', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Valor {idx + 1} (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className={styles.input}
                      value={inst.valor}
                      onChange={(e) => handleUpdateInstallment(inst.id, 'valor', e.target.value)}
                      placeholder="0,00"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {installments.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeInstallmentBtn}
                      onClick={() => handleRemoveInstallment(inst.id)}
                      disabled={isSubmitting}
                      title="Remover Parcela"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="telefone" className={styles.label}>
                Telefone
              </label>
              <input
                id="telefone"
                type="tel"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 90000-0000"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="cidade" className={styles.label}>
                Cidade
              </label>
              <input
                id="cidade"
                type="text"
                className={styles.input}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Nome da cidade"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="endereco" className={styles.label}>
              Endereço
            </label>
            <input
              id="endereco"
              type="text"
              className={styles.input}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, Número, Bairro, etc."
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label htmlFor="status" className={styles.label}>
                Status de Cobrança
              </label>
              <select
                id="status"
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as 'paid' | 'pending' | 'overdue')}
                disabled={isSubmitting}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Atrasado</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="observacao" className={styles.label}>
              Observações
            </label>
            <textarea
              id="observacao"
              className={styles.textarea}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Informações adicionais..."
              disabled={isSubmitting}
            />
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
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
