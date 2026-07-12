'use client';

import { useState, useEffect } from 'react';
import { db, User } from '@/services/db';
import styles from './UserManagementModal.module.css';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
}

export default function UserManagementModal({ isOpen, onClose, currentUsername }: UserManagementModalProps) {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // New User Form States
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'operator'>('operator');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users list
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await db.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setError('');
      setSuccess('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('operator');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUsername.trim() || !newPassword) {
      setError('Por favor, preencha usuário e senha.');
      return;
    }

    if (newPassword.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.createUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole
      });
      setSuccess(`Usuário "${newUsername}" criado com sucesso!`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('operator');
      // Reload users list
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário. O nome de usuário pode já estar em uso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: Omit<User, 'password'>) => {
    if (!user.id) return;
    
    if (user.username === currentUsername) {
      alert('Você não pode excluir a sua própria conta.');
      return;
    }

    if (confirm(`Tem certeza de que deseja excluir o usuário "${user.username}"?`)) {
      try {
        await db.deleteUser(user.id);
        setSuccess(`Usuário "${user.username}" excluído.`);
        loadUsers();
      } catch (err) {
        console.error(err);
        setError('Erro ao excluir o usuário.');
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Gerenciar Usuários</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>

        <div className={styles.body}>
          {/* Left Panel: Create User */}
          <div className={styles.leftPanel}>
            <h3 className={styles.sectionTitle}>Novo Usuário</h3>
            
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <form onSubmit={handleCreateUser} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="newUsername" className={styles.label}>
                  Nome de Usuário
                </label>
                <input
                  id="newUsername"
                  type="text"
                  className={styles.input}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: joao.otica"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  Senha
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="newRole" className={styles.label}>
                  Nível de Acesso
                </label>
                <select
                  id="newRole"
                  className={styles.select}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'operator')}
                  disabled={isSubmitting}
                >
                  <option value="operator">Operador (Apenas Cobranças)</option>
                  <option value="admin">Administrador Geral</option>
                </select>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar Conta'}
              </button>
            </form>
          </div>

          {/* Right Panel: Users List */}
          <div className={styles.rightPanel}>
            <h3 className={styles.sectionTitle}>Usuários Cadastrados</h3>
            
            <div className={styles.tableContainer}>
              {isLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Carregando usuários...
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Usuário</th>
                      <th className={styles.th}>Acesso</th>
                      <th className={styles.th} style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.username}>{user.username}</span>
                          {user.username === currentUsername && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>(Você)</span>
                          )}
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.roleBadge} ${
                            user.role === 'admin' ? styles.roleAdmin : styles.roleOperator
                          }`}>
                            {user.role === 'admin' ? 'Administrador' : 'Operador'}
                          </span>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.username === currentUsername}
                            title={user.username === currentUsername ? 'Não é possível excluir você mesmo' : 'Excluir Usuário'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.closePanelBtn} onClick={onClose}>
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}
