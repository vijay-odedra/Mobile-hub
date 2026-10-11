import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthModal({ isFullScreen = false, onClose }) {
  const { currentUser, login, signup } = useApp();
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (currentUser) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (tab === 'login') {
      const ok = login(username.trim(), password);
      if (!ok) setError('Invalid username or password');
    } else {
      const ok = signup(name.trim(), username.trim(), password);
      if (!ok) setError('Username already exists or password too short (min 4 chars)');
    }
  };

  const cardContent = (
    <div 
      className="modal-card auth-card" 
      style={{ 
        maxWidth: '440px', 
        width: '100%',
        boxSizing: 'border-box',
        padding: '34px 28px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        margin: 'auto'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <img 
          src="/images/logo.png" 
          alt="Stockly Logo" 
          style={{ maxHeight: '60px', maxWidth: '80%', objectFit: 'contain' }} 
        />
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '12px', color: '#1e1e2d', letterSpacing: '-0.5px' }}>
          Stockly
        </h2>
        <p style={{ color: '#78829d', fontSize: '0.86rem', marginTop: '4px' }}>
          Retail &amp; Inventory Management Suite
        </p>
      </div>

      <div style={{ display: 'flex', background: '#f4f3ff', padding: '4px', borderRadius: '40px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => { setTab('login'); setError(''); }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '30px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            background: tab === 'login' ? 'var(--primary-gradient)' : 'transparent',
            color: tab === 'login' ? 'white' : '#64748b',
            boxShadow: tab === 'login' ? '0 4px 12px rgba(109,84,254,0.3)' : 'none',
            transition: '0.2s'
          }}
        >
          🔐 Login
        </button>
        <button
          type="button"
          onClick={() => { setTab('signup'); setError(''); }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '30px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            background: tab === 'signup' ? 'var(--primary-gradient)' : 'transparent',
            color: tab === 'signup' ? 'white' : '#64748b',
            boxShadow: tab === 'signup' ? '0 4px 12px rgba(109,84,254,0.3)' : 'none',
            transition: '0.2s'
          }}
        >
          📝 Sign Up
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '14px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tab === 'signup' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', marginBottom: '5px' }}>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Store Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 18px', borderRadius: '30px', border: '1.5px solid #e2e8f0', outline: 'none' }}
            />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', marginBottom: '5px' }}>Username</label>
          <input
            type="text"
            placeholder="Username (e.g. admin)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 18px', borderRadius: '30px', border: '1.5px solid #e2e8f0', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', marginBottom: '5px' }}>Password</label>
          <input
            type="password"
            placeholder="Password (e.g. admin123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 18px', borderRadius: '30px', border: '1.5px solid #e2e8f0', outline: 'none' }}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ justifyContent: 'center', padding: '13px', marginTop: '6px', fontSize: '0.95rem', fontWeight: 700 }}
        >
          {tab === 'login' ? 'Access Dashboard 🚀' : 'Create Account & Login ✨'}
        </button>

        {tab === 'login' && (
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
            Default Login: <strong style={{ color: '#6366f1' }}>admin</strong> &bull; Password: <strong style={{ color: '#6366f1' }}>admin123</strong>
          </div>
        )}
      </form>
    </div>
  );

  if (isFullScreen) {
    return cardContent;
  }

  return (
    <div className="modal-overlay" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 27, 75, 0.92) 100%)', zIndex: 9000 }}>
      {cardContent}
    </div>
  );
}
