import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 380,
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        const bg = isSuccess ? '#0d6e4f' : isError ? '#c0392b' : '#2364aa';
        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

        return (
          <div
            key={t.id}
            style={{
              background: bg,
              color: '#ffffff',
              borderRadius: 10,
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'auto',
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            <Icon size={20} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
              {t.title && <div style={{ fontWeight: 700, marginBottom: 2 }}>{t.title}</div>}
              <div>{t.message}</div>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

