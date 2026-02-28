import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Building2, CalendarClock, FileText,
    Users, Wrench, LogOut, X
} from 'lucide-react';

const adminNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/lifts', label: 'Kelola Lift', icon: Building2 },
    { to: '/schedules', label: 'Jadwal Maintenance', icon: CalendarClock },
    { to: '/reports', label: 'Laporan', icon: FileText },
];

const superAdminNav = [
    { to: '/users', label: 'Manajemen User', icon: Users },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout, isRole } = useAuth();
    const location = useLocation();

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    <div>
                        <h1>LiftCare</h1>
                        <span>Maintenance System</span>
                    </div>
                    <button className="sidebar-close-btn mobile-only" onClick={onClose}><X size={20} /></button>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Menu Utama</div>
                    {adminNav.map(item => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                            <span className="icon"><item.icon size={18} /></span>
                            {item.label}
                        </NavLink>
                    ))}
                    {isRole('superadmin') && (
                        <>
                            <div className="sidebar-section-title">Administrator</div>
                            {superAdminNav.map(item => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                                    <span className="icon"><item.icon size={18} /></span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name}</div>
                        <div className="sidebar-user-role">{user?.role}</div>
                    </div>
                    <button className="sidebar-link" onClick={logout} style={{ width: 'auto', padding: '8px' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
        </>
    );
}
