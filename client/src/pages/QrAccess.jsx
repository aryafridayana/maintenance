import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, QrCode } from 'lucide-react';

const baseURL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

export default function QrAccess() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, error
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('Token QR tidak ditemukan');
            return;
        }

        axios.get(`${baseURL}/qr/validate/${token}`)
            .then(res => {
                const { token: jwtToken, lift } = res.data;

                // Store JWT token and temporary user for the session
                localStorage.setItem('token', jwtToken);
                localStorage.setItem('user', JSON.stringify({
                    id: 0,
                    name: 'QR Access',
                    email: 'qr-access@liftcare.com',
                    role: 'teknisi',
                    qr_access: true
                }));

                // Redirect to maintenance form with lift ID
                navigate(`/maintenance-form?lift=${lift.id}`, { replace: true });
            })
            .catch(err => {
                setStatus('error');
                setError(err.response?.data?.error || 'QR code tidak valid');
            });
    }, [token, navigate]);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '24px',
            background: 'var(--bg-primary, #0f1117)'
        }}>
            <div style={{
                background: 'var(--bg-card, #1a1d27)', borderRadius: '16px',
                padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%',
                border: '1px solid var(--border-primary, #2a2d37)'
            }}>
                {status === 'loading' ? (
                    <>
                        <Loader2 size={48} style={{ color: 'var(--accent-primary, #6366f1)', marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
                            Memvalidasi QR Code...
                        </h2>
                        <p style={{ color: 'var(--text-muted, #888)', fontSize: '14px' }}>
                            Mohon tunggu sebentar
                        </p>
                    </>
                ) : (
                    <>
                        <AlertCircle size={48} style={{ color: 'var(--accent-danger, #ef4444)', marginBottom: '16px' }} />
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
                            QR Code Tidak Valid
                        </h2>
                        <p style={{ color: 'var(--text-muted, #888)', fontSize: '14px', marginBottom: '24px' }}>
                            {error}
                        </p>
                        <a href="/login" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', background: 'var(--accent-primary, #6366f1)',
                            color: 'white', borderRadius: '8px', textDecoration: 'none',
                            fontSize: '14px', fontWeight: 600
                        }}>
                            <QrCode size={16} /> Login Manual
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}
