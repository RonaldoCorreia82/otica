'use client';

import { useState, useMemo } from 'react';
import styles from '../Dashboard.module.css';

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultText: string;
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: 'cobranca_inicial',
    name: 'Cobrança Geral (Inara - Styllus Ótica)',
    category: 'Financeiro',
    description: 'Mensagem inicial para verificar boletos em aberto e status de pagamento.',
    defaultText: 'Bom dia *[Nome]*, aqui é a *Inara* da *Styllus Ótica*...'
  },
  {
    id: 'lembrete_vencimento',
    name: 'Lembrete Amigável de Vencimento',
    category: 'Cobrança',
    description: 'Lembrete educado enviado alguns dias antes ou no dia do vencimento.',
    defaultText: 'Olá *[Nome]*, lembramos que sua parcela vence em breve...'
  }
];

export default function MensagensPanel() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('cobranca_inicial');
  
  // Form fields
  const [nome, setNome] = useState('Cliente');
  const [telefone, setTelefone] = useState('');
  const [parcela, setParcela] = useState('1ª');
  const [mes, setMes] = useState('Julho');
  const [inaraName, setInaraName] = useState('Inara');
  const [oticaName, setOticaName] = useState('Styllus Ótica');

  // Compute live message text
  const finalMessage = useMemo(() => {
    if (selectedTemplateId === 'cobranca_inicial') {
      return `Bom dia *${nome}*\nAqui é *${inaraName}*, do setor financeiro da *${oticaName}*. \n\nVerificamos um boleto em aberto no nosso sistema no nome do(a) senhor(a) referente a parcela *${parcela}* do mês *${mes}*.\n\nGostaria de confirmar se já foi realizado o pagamento?`;
    } else {
      return `Olá *${nome}*!\nTudo bem?\n\nPassando para lembrar que a parcela *${parcela}* do mês de *${mes}* referente à sua compra na *${oticaName}* vence nos próximos dias.\n\nQualquer dúvida, estamos à disposição!`;
    }
  }, [selectedTemplateId, nome, parcela, mes, inaraName, oticaName]);

  // Clean phone number for WhatsApp link
  const handleSend = () => {
    let cleanPhone = telefone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    const encodedText = encodeURIComponent(finalMessage);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3>Gerenciador de Mensagens</h3>
        <p className={styles.recebidosSubtitle}>Selecione um modelo de mensagem, preencha as variáveis e envie diretamente pelo WhatsApp.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Template selector & Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Modelo de Mensagem</label>
            <select
              className={styles.filterSelect}
              style={{ width: '100%', height: '42px', fontSize: '14px' }}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {TEMPLATES.find(t => t.id === selectedTemplateId)?.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Nome do Cliente</label>
              <input
                type="text"
                className={styles.searchInput}
                style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria Souza"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Telefone (com DDD)</label>
              <input
                type="text"
                className={styles.searchInput}
                style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: 75999998888"
              />
            </div>

            {selectedTemplateId === 'cobranca_inicial' ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Nome do Cobrador</label>
                  <input
                    type="text"
                    className={styles.searchInput}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    value={inaraName}
                    onChange={(e) => setInaraName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Parcela</label>
                  <input
                    type="text"
                    className={styles.searchInput}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    value={parcela}
                    onChange={(e) => setParcela(e.target.value)}
                    placeholder="Ex: 2ª"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Mês da Parcela</label>
                  <input
                    type="text"
                    className={styles.searchInput}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    placeholder="Ex: Julho"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Parcela</label>
                  <input
                    type="text"
                    className={styles.searchInput}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    value={parcela}
                    onChange={(e) => setParcela(e.target.value)}
                    placeholder="Ex: 2ª"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Mês da Parcela</label>
                  <input
                    type="text"
                    className={styles.searchInput}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    placeholder="Ex: Julho"
                  />
                </div>
              </>
            )}

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Nome da Ótica</label>
              <input
                type="text"
                className={styles.searchInput}
                style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                value={oticaName}
                onChange={(e) => setOticaName(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.addBtn}
            style={{ width: '100%', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff', marginTop: '8px' }}
            onClick={handleSend}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Enviar via WhatsApp
          </button>
        </div>

        {/* Right Side: WhatsApp Mockup Live Preview */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          height: '100%',
          minHeight: '400px'
        }}>
          {/* Mockup Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#075E54',
            color: '#ffffff',
            padding: '12px 16px',
            fontWeight: 600
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#128C7E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: '14px' }}>{nome || 'Cliente'}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Online</div>
            </div>
          </div>

          {/* Mockup Chat Area */}
          <div style={{
            flex: 1,
            backgroundColor: '#e5ddd5',
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
            backgroundSize: 'contain',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            overflowY: 'auto'
          }}>
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: '#ffffff',
              padding: '10px 14px',
              borderRadius: '0 8px 8px 8px',
              boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
              maxWidth: '85%',
              position: 'relative',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#303030'
            }}>
              {/* Format bold tags for preview */}
              {finalMessage.split('\n').map((line, idx) => {
                // simple parse of *word* to <strong>word</strong> for the mockup view
                const parts = line.split(/(\*[^*]+\*)/g);
                return (
                  <div key={idx}>
                    {parts.map((part, pIdx) => {
                      if (part.startsWith('*') && part.endsWith('*')) {
                        return <strong key={pIdx}>{part.slice(1, -1)}</strong>;
                      }
                      return part;
                    })}
                  </div>
                );
              })}
              <div style={{
                textAlign: 'right',
                fontSize: '10px',
                color: '#999',
                marginTop: '4px'
              }}>
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
