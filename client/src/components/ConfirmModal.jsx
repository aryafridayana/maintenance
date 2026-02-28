import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                <div className="modal-header">
                    <h2>{title || 'Konfirmasi'}</h2>
                    <button className="modal-close" onClick={onCancel}><X size={18} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'rgba(239,68,68,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                        {message || 'Apakah Anda yakin ingin menghapus? Tindakan ini tidak dapat dibatalkan.'}
                    </p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onCancel}>Batal</button>
                    <button className="btn" onClick={onConfirm} style={{
                        background: '#ef4444', color: 'white', border: 'none'
                    }}>Hapus</button>
                </div>
            </div>
        </div>
    );
}
