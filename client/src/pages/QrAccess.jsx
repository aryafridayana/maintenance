import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ShieldCheck, Loader2, AlertCircle, Lock } from 'lucide-react';

export default function QrAccess() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setError('PIN harus 4 digit');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post(`/qr/validate/${token}`, { pin });
            // Store temp JWT
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: 0,
                email: 'qr-access@liftcare.com',
                role: 'teknisi',
                name: 'QR Access'
            }));
            // Redirect to maintenance form
            navigate(`/maintenance-form?lift=${res.data.lift.id}`);
        } catch (err) {
            const msg = err.response?.data?.error || 'Gagal memvalidasi QR';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f3ff 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', padding: '32px',
                width: '100%', maxWidth: '360px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: 'var(--primary-600)', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                }}>
                    <ShieldCheck size={28} color="white" />
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Verifikasi Akses</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                    Masukkan PIN 4 digit untuk mengakses form maintenance
                </p>

                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                        padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
                        marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <Lock size={18} style={{
                            position: 'absolute', left: '14px', top: '50%',
                            transform: 'translateY(-50%)', color: '#9ca3af'
                        }} />
                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={4}
                            value={pin}
                            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="● ● ● ●"
                            autoFocus
                            style={{
                                width: '100%', padding: '14px 14px 14px 44px',
                                fontSize: '24px', fontWeight: 700, letterSpacing: '12px',
                                textAlign: 'center', border: '2px solid #e5e7eb',
                                borderRadius: '12px', outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2e90fa'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || pin.length !== 4}
                        style={{
                            width: '100%', padding: '14px',
                            background: pin.length === 4 ? 'var(--primary-600)' : '#d1d5db',
                            color: 'white', border: 'none', borderRadius: '12px',
                            fontSize: '16px', fontWeight: 600, cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            transition: 'background 0.2s'
                        }}
                    >
                        {loading ? <><Loader2 size={18} className="spin" /> Memvalidasi...</> : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
}
