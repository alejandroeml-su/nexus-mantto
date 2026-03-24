'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/actions';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [demoLink, setDemoLink] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setStatus('success');
        setMessage(res.message || 'Se han enviado las instrucciones de recuperación.');
        if (res.token) {
          // SOLO PARA DEMOSTRACION: En producción esto iría en un email.
          setDemoLink(`/reset-password?token=${res.token}`);
        }
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Ocurrió un error al procesar la solicitud.');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 animate-fade-in" style={{ background: 'var(--bg-gradient)' }}>
      <div className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <Link href="/login" className="flex items-center text-blue-600 hover:underline text-sm mb-6 font-medium">
          <ArrowLeft size={16} className="mr-1" /> Volver al inicio de sesión
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Contraseña</h1>
        <p className="text-gray-600 text-sm mb-6">
          Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {status === 'success' ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
            <p className="font-medium">{message}</p>
            {demoLink && (
              <div className="mt-4 p-3 bg-white rounded border border-gray-200 text-sm">
                <p className="text-gray-500 mb-2">⚠️ Vínculo de demostración (no hay servicio de email configurado):</p>
                <Link href={demoLink} className="text-blue-600 font-bold break-all hover:underline">
                  Restablecer Contraseña Aquí
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {message}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-md disabled:bg-blue-400"
            >
              {status === 'loading' ? 'Enviando...' : <><Send size={20} /> Enviar enlace</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
