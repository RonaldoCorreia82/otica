'use client';

import { useState, useEffect } from 'react';
import { Recebido } from '@/services/db';
import styles from './BillingModal.module.css'; // Reuses existing billing modal styles

interface RecebidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recebido: Omit<Recebido, 'id' | 'created_at'>) => Promise<void>;
  editingRecebido: Recebido | null;
}

export default function RecebidoModal({ isOpen, onClose, onSave, editingRecebido }: RecebidoModalProps) {
  const [os, setOs] = useState('');
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [parcela, setParcela] = useState('');
  const [pagamentoMetodo, setPagamentoMetodo] = useState('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingRecebido) {
        setOs(editingRecebido.os || '');
        setNome(editingRecebido.nome || '');
        setCidade(editingRecebido.cidade || '');
        setEndereco(editingRecebido.endereco || '');
        setTelefone(editingRecebido.telefone || '');
        setVencimento(editingRecebido.vencimento || '');
        setPagamento(editingRecebido.pagamento || '');
        setValorPago(String(editingRecebido.valor_pago || ''));
        setParcela(editingRecebido.parcela || '');
        setPagamentoMetodo(editingRecebido.pagamento_metodo || 'PIX');
      } else {
        setOs('');
        setNome('');
        setCidade('');
        setEndereco('');
        setTelefone('');
        setValorPago('');
        setParcela('');
        setPagamentoMetodo('PIX');
        
        const today = new Date().toISOString().split('T')[0];
        setVencimento(today);
        setPagamento(today);
      }
    }
  }, [isOpen, editingRecebido]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!os || !nome || !vencimento || !pagamento || !valorPago || !parcela || !pagamentoMetodo) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        os,
        nome,
        cidade: cidade.trim() || undefined,
        vencimento,
        endereco: endereco.trim() || undefined,
        telefone: telefone.trim() || undefined,
        pagamento,
        valor_pago: parseFloat(valorPago),
        parcela: parcela.trim(),
        pagamento_metodo: pagamentoMetodo.trim()
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o recebimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{editingRecebido ? 'Editar Recebido' : 'Registrar Recebido'}</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>OS *</label>
              <input
                type="text"
                className={styles.input}
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Ex: 13887"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Nome do Pagador *</label>
              <input
                type="text"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo do cliente"
                required
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
                placeholder="Ex: Seabra"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Telefone</label>
              <input
                type="text"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: 75999999999"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.label}>Endereço</label>
              <input
                type="text"
                className={styles.input}
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro..."
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Vencimento Original *</label>
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
              <label className={styles.label}>Data de Pagamento *</label>
              <input
                type="date"
                className={styles.input}
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Valor Pago (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={styles.input}
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder="0,00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Parcela *</label>
              <input
                type="text"
                className={styles.input}
                value={parcela}
                onChange={(e) => setParcela(e.target.value)}
                placeholder="Ex: 5ª ou 1 de 3"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.label}>Forma de Pagamento *</label>
              <input
                type="text"
                className={styles.input}
                value={pagamentoMetodo}
                onChange={(e) => setPagamentoMetodo(e.target.value)}
                placeholder="Ex: PIX, Dinheiro, Depósito, Boleto"
                required
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
              className={styles.saveBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Recebido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
