'use client';

import React, { useState } from 'react';
import { ShieldAlert, LogIn, Key, Mail, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/actions';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        // För compatibilitet med useRole actual
        localStorage.setItem('user_role', res.user.rol);
        localStorage.setItem('user_name', res.user.nombre);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* Lado Izquierdo: Branding & Hero Image */}
      <div className="login-hero">
        <div className="login-hero-bg" />
        <div className="login-hero-overlay" />
        
        {/* Contenido Hero */}
        <div className="login-hero-content">
          <div className="login-badge-container">
            <div className="login-badge-icon">
              <ShieldAlert size={40} />
            </div>
            <span className="login-badge-text">Nexus Digital Ecosystem</span>
          </div>
          
          <h1 className="login-title">
            NEXUS <span className="text-gradient">4.0</span>
          </h1>
          
          <p className="login-description">
            Gestión inteligente de activos y mantenimiento industrial con análisis predictivo y control total.
          </p>
          
          <div className="login-stats">
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Control</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">24/7</span>
              <span className="stat-label">Monitoreo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario de Login */}
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-header">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para acceder</p>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-dot" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label className="input-label">Correo Electrónico</label>
              <div className="input-container">
                <div className="input-icon">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Contraseña</label>
                <Link href="/recuperar" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                  ¿Olvidaste la clave?
                </Link>
              </div>
              <div className="input-container">
                <div className="input-icon">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-login"
            >
              <div className="shine-effect" />
              {loading ? (
                  <span>Verificando...</span>
              ) : (
                  <>
                      <span>Acceder al Sistema</span>
                      <ChevronRight size={18} />
                  </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Nexum Core Services &copy; {new Date().getFullYear()}
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
