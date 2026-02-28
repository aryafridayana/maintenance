import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, ClipboardList, UserCircle } from 'lucide-react';

const navItems = [
    { to: '/tech', icon: Home, label: 'Beranda' },
    { to: '/tech/schedules', icon: CalendarDays, label: 'Jadwal' },
    { to: '/tech/history', icon: ClipboardList, label: 'Riwayat' },
    { to: '/tech/profile', icon: UserCircle, label: 'Profil' },
];

export default function MobileNav() {
    return (
        <nav className="mobile-nav">
            {navItems.map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/tech'}
                    className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="icon"><item.icon size={22} /></span>
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}
