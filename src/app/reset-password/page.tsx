'use client';

import React, { useState, Suspense } from 'react';
import { Key, Save, CheckCircle2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/actions';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!token) {
    return (
      <div className="text-center p-6">
        <p className="text-red-600 font-medium mb-4">Error: Token de seguridad no válido o ausente.</p>
        <Link href="/recuperar" className="text-blue-600 hover:underline">Volver a solicitar recuperación</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await resetPassword(token as string, password);
      if (res.success) {
        setStatus('success');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Ocurrió un error al restablecer la contraseña.');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center p-6">
        <div className="flex justify-center mb-4">
          <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Contraseña Actualizada!</h2>
        <p className="text-gray-600 mb-6">Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión en el sistema.</p>
        <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md">
          Ir a Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Nueva Contraseña</h1>
      <p className="text-gray-600 text-sm mb-6">
        Ingresa tu nueva contraseña para acceder al sistema.
      </p>

      {status === 'error' && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {message}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nueva Contraseña</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Key size={18} />
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar Contraseña</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Key size={18} />
          </div>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Repite la contraseña"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-md disabled:bg-blue-400"
      >
        {status === 'loading' ? 'Guardando...' : <><Save size={20} /> Restablecer Contraseña</>}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 animate-fade-in" style={{ background: 'var(--bg-gradient)' }}>
      <div className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <Suspense fallback={<div className="text-center p-6 text-gray-500">Cargando verificación...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
