import { useAuth } from '../context/AuthContext';
import { LogOut, Mail, Phone, Shield, User } from 'lucide-react';

export default function TechProfile() {
    const { user, logout } = useAuth();

    return (
        <div className="page-content fade-in">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Profil Saya</h2>

            <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        background: 'var(--primary-600)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', fontWeight: 700, color: 'white'
                    }}>
                        {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 700, fontSize: '18px' }}>{user?.name}</h3>
                        <span className="badge badge-green"><Shield size={12} /> {user?.role}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                        <User size={16} style={{ color: 'var(--accent-primary)' }} />
                        <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Nama</div><div style={{ fontWeight: 500 }}>{user?.name}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                        <Mail size={16} style={{ color: 'var(--accent-primary)' }} />
                        <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email</div><div style={{ fontWeight: 500 }}>{user?.email}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                        <Phone size={16} style={{ color: 'var(--accent-primary)' }} />
                        <div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Telepon</div><div style={{ fontWeight: 500 }}>{user?.phone || '-'}</div></div>
                    </div>
                </div>
            </div>

            <button className="btn btn-ghost" onClick={logout} style={{ width: '100%', color: 'var(--accent-danger)', border: '1px solid var(--accent-danger)' }}>
                <LogOut size={16} /> Keluar
            </button>
        </div>
    );
}
