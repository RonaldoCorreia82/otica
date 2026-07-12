'use client';

import { useState, useEffect } from 'react';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';

interface SessionUser {
  username: string;
  role: 'admin' | 'operator';
}

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    // Check authentication state on mount
    const sessionUser = sessionStorage.getItem('otica_user');
    if (sessionUser) {
      try {
        setUser(JSON.parse(sessionUser));
      } catch (e) {
        sessionStorage.removeItem('otica_user');
      }
    }
    setIsCheckingSession(false);
  }, []);

  const handleLogin = (loggedInUser: SessionUser) => {
    sessionStorage.setItem('otica_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('otica_user');
    setUser(null);
  };

  // Prevent flash of login screen while checking session
  if (isCheckingSession) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base)',
      }}>
        <div className="animate-scale-up" style={{ color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
