'use client';

import { useState, useEffect } from 'react';
import { Venda } from '@/services/db';
import styles from './BillingModal.module.css';

interface VendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (venda: Omit<Venda, 'id' | 'created_at'>) => Promise<void>;
  editingVenda: Venda | null;
}

export default function VendaModal({ isOpen, onClose, onSave, editingVenda }: VendaModalProps) {
  const [paciente, setPaciente] = useState('');
  const [os, setOs] = useState('');
  const [lab, setLab] = useState('');
  const [aniversario, setAniversario] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [vezes, setVezes] = useState('');
  const [valorParcela, setValorParcela] = useState('');
  const [compra, setCompra] = useState('');
  const [endereco, setEndereco] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingVenda) {
        setPaciente(editingVenda.paciente || '');
        setOs(editingVenda.os || '');
        setLab(editingVenda.lab || '');
        setAniversario(editingVenda.aniversario || '');
        setCidade(editingVenda.cidade || '');
        setTelefone(editingVenda.telefone || '');
        setValorTotal(editingVenda.valor_total != null ? String(editingVenda.valor_total) : '');
        setVezes(editingVenda.vezes || '');
        setValorParcela(editingVenda.valor_parcela != null ? String(editingVenda.valor_parcela) : '');
        setCompra(editingVenda.compra || '');
        setEndereco(editingVenda.endereco || '');
      } else {
        setPaciente('');
        setOs('');
        setLab('');
        setAniversario('');
        setCidade('');
        setTelefone('');
        setValorTotal('');
        setVezes('');
        setValorParcela('');
        setCompra('');
        setEndereco('');
      }
    }
  }, [isOpen, editingVenda]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paciente.trim()) {
      alert('Por favor, preencha o nome do paciente (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        paciente: paciente.trim(),
        os: os.trim() || undefined,
        lab: lab.trim() || undefined,
        aniversario: aniversario.trim() || undefined,
        cidade: cidade.trim() || undefined,
        telefone: telefone.trim() || undefined,
        valor_total: valorTotal.trim() ? parseFloat(valorTotal) : undefined,
        vezes: vezes.trim() || undefined,
        valor_parcela: valorParcela.trim() ? parseFloat(valorParcela) : undefined,
        compra: compra.trim() || undefined,
        endereco: endereco.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar a venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{editingVenda ? 'Editar Venda' : 'Cadastrar Venda'}</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.label}>Paciente *</label>
              <input
                type="text"
                className={styles.input}
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                placeholder="Nome completo do paciente"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>OS</label>
              <input
                type="text"
                className={styles.input}
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Número da OS"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Laboratório (LAB)</label>
              <input
                type="text"
                className={styles.input}
                value={lab}
                onChange={(e) => setLab(e.target.value)}
                placeholder="Ex: TECNOLENS"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Aniversário (Dia/Mês)</label>
              <input
                type="text"
                className={styles.input}
                value={aniversario}
                onChange={(e) => setAniversario(e.target.value)}
                placeholder="Ex: 26/out"
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
                placeholder="Ex: 77-93136-1825"
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
              <label className={styles.label}>Dia do Pagamento (Compra)</label>
              <input
                type="text"
                className={styles.input}
                value={compra}
                onChange={(e) => setCompra(e.target.value)}
                placeholder="Ex: DIA 05"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                className={styles.input}
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="Ex: 620.00"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Quantidade de Vezes</label>
              <input
                type="text"
                className={styles.input}
                value={vezes}
                onChange={(e) => setVezes(e.target.value)}
                placeholder="Ex: 5X"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.label}>Valor da Parcela (R$)</label>
              <input
                type="number"
                step="0.01"
                className={styles.input}
                value={valorParcela}
                onChange={(e) => setValorParcela(e.target.value)}
                placeholder="Ex: 100.00"
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
                placeholder="Endereço completo"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.footer} style={{ marginTop: '16px' }}>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
