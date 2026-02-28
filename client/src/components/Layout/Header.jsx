import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, Calendar } from 'lucide-react';

export default function Header({ title, onMenuToggle }) {
    const { logout } = useAuth();
    const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="menu-toggle" onClick={onMenuToggle}>
                    <Menu size={20} />
                </button>
            </div>
            <div className="header-actions">
                <span className="header-btn" style={{ cursor: 'default' }}>
                    <Calendar size={14} /> {today}
                </span>
                <button className="header-btn" onClick={logout}>
                    <LogOut size={14} /> <span>Keluar</span>
                </button>
            </div>
        </header>
    );
}
