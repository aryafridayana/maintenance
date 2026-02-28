import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Building2, CalendarClock, CheckCircle2, Clock, ChevronRight, History } from 'lucide-react';

export default function TechnicianDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/reports/stats'),
            api.get('/schedules'),
        ]).then(([statsRes, schedRes]) => {
            setStats(statsRes.data);
            const today = new Date().toISOString().split('T')[0];
            setTodaySchedules(schedRes.data.filter(s => s.scheduled_date === today && s.status !== 'completed' && s.status !== 'cancelled'));
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-content"><div className="empty-state"><p>Memuat...</p></div></div>;

    return (
        <div className="page-content fade-in">
            <div className="tech-header">
                <h2 style={{ color: 'white' }}>Halo, {user?.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.85)' }}>Selamat datang di LiftCare</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card blue">
                    <div className="stat-icon blue"><CalendarClock size={20} /></div>
                    <div className="stat-info">
                        <h3>{stats?.pendingSchedules || 0}</h3>
                        <p>Jadwal Pending</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><CheckCircle2 size={20} /></div>
                    <div className="stat-info">
                        <h3>{stats?.completedSchedules || 0}</h3>
                        <p>Selesai</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">
                    <h3 className="card-title"><Clock size={16} style={{ marginRight: '8px', verticalAlign: '-3px' }} />Jadwal Hari Ini</h3>
                </div>
                {todaySchedules.length > 0 ? todaySchedules.map(s => (
                    <Link key={s.id} to={`/maintenance-form?schedule=${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="tech-schedule-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{s.lift_name}</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                                        <Building2 size={12} style={{ verticalAlign: '-2px' }} /> {s.cabang || '-'} &bull; {s.lift_type === 'cargo' ? 'Cargo' : 'Elevator'}
                                    </p>
                                </div>
                                <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                    </Link>
                )) : (
                    <div className="empty-state" style={{ padding: '24px' }}>
                        <p>Tidak ada jadwal hari ini</p>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><History size={16} style={{ marginRight: '8px', verticalAlign: '-3px' }} />Jadwal Mendatang</h3>
                </div>
                {stats?.upcomingSchedules?.length > 0 ? stats.upcomingSchedules.map(s => (
                    <div key={s.id} className="schedule-card">
                        <div className="schedule-date">
                            <span className="day">{new Date(s.scheduled_date).getDate()}</span>
                            <span className="month">{new Date(s.scheduled_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                        </div>
                        <div className="schedule-info">
                            <h4>{s.lift_name}</h4>
                            <p>{s.cabang || '-'}</p>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state" style={{ padding: '24px' }}><p>Tidak ada jadwal mendatang</p></div>
                )}
            </div>
        </div>
    );
}
