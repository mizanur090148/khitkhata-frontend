import React from 'react';
import { Phone, MessageCircle, X, ShieldCheck } from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  phone: string;
  whatsapp?: string;
  name?: string;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  phone,
  whatsapp,
  name,
}) => {
  if (!isOpen) return null;

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const waNumber = (whatsapp || phone).replace(/[^0-9]/g, '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0d6e4f', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              <ShieldCheck size={16} />
              <span>ভেরিফায়েড নিটিং নেটওয়ার্ক</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {name && (
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b' }}>যোগাযোগকারী: </span>
            <strong style={{ color: '#0f172a' }}>{name}</strong>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={`tel:${cleanPhone}`}
            className="btn btn-primary"
            style={{ textDecoration: 'none', padding: '12px', fontSize: 15 }}
          >
            <Phone size={18} />
            <span>সরাসরি কল করুন ({phone})</span>
          </a>

          <a
            href={`https://wa.me/${waNumber.startsWith('88') ? waNumber : '88' + waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              textDecoration: 'none',
              padding: '12px',
              fontSize: 15,
              background: '#25D366',
              color: '#ffffff',
            }}
          >
            <MessageCircle size={18} />
            <span>হোয়াটসঅ্যাপে চ্যাট করুন</span>
          </a>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '10px' }}>
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

