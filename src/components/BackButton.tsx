'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()}
      className="back-button glass"
      title="Regresar"
    >
      <ChevronLeft size={20} />
      <span>Regresar</span>
      <style jsx>{`
        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.875rem;
          transition: var(--transition-fast);
          margin-bottom: 1rem;
        }
        .back-button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          transform: translateX(-4px);
        }
      `}</style>
    </button>
  );
}
