'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface QRModalProps {
  assetName: string;
  qrValue: string;
  onClose: () => void;
}

export default function QRModal({ assetName, qrValue, onClose }: QRModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Código QR: {assetName}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="qr-container">
          <QRCodeSVG value={qrValue} size={256} level="H" includeMargin={true} />
          <code className="qr-text">{qrValue}</code>
        </div>
        <div className="modal-footer">
          <p>Escanee este código desde la App móvil para acceder al expediente.</p>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          width: 400px;
          padding: var(--spacing-xl);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          text-align: center;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .qr-container {
          background: white;
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }
        .qr-text {
          color: #333;
          font-weight: 700;
          font-family: monospace;
        }
        .modal-footer {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
