import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Building2, CalendarClock, CheckCircle2, FileBarChart, Users, Clock } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reports/stats')
            .then(res => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-content"><div className="empty-state"><p>Memuat data...</p></div></div>;

    return (
        <div className="page-content fade-in">

            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon blue"><Building2 size={22} /></div>
                    <div className="stat-info">
                        <h3>{stats?.totalLifts || 0}</h3>
                        <p>Total Lift Aktif</p>
                    </div>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-icon yellow"><Clock size={22} /></div>
                    <div className="stat-info">
                        <h3>{stats?.pendingSchedules || 0}</h3>
                        <p>Jadwal Pending</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><CheckCircle2 size={22} /></div>
                    <div className="stat-info">
                        <h3>{stats?.completedSchedules || 0}</h3>
                        <p>Selesai</p>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><FileBarChart size={22} /></div>
                    <div className="stat-info">
                        <h3>{stats?.totalReports || 0}</h3>
                        <p>Total Laporan</p>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><CalendarClock size={16} style={{ marginRight: '8px', verticalAlign: '-3px' }} />Jadwal Mendatang</h3>
                    </div>
                    {stats?.upcomingSchedules?.length > 0 ? (
                        stats.upcomingSchedules.map(s => (
                            <div key={s.id} className="schedule-card">
                                <div className="schedule-date">
                                    <span className="day">{new Date(s.scheduled_date).getDate()}</span>
                                    <span className="month">{new Date(s.scheduled_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                </div>
                                <div className="schedule-info">
                                    <h4>{s.lift_name}</h4>
                                    <p>{s.technician_name} &bull; {s.cabang}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state"><p>Tidak ada jadwal mendatang</p></div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><FileBarChart size={16} style={{ marginRight: '8px', verticalAlign: '-3px' }} />Laporan Terbaru</h3>
                    </div>
                    {stats?.recentReports?.length > 0 ? (
                        stats.recentReports.map(r => (
                            <div key={r.id} className="schedule-card">
                                <div className="schedule-info" style={{ flex: 1 }}>
                                    <h4>{r.lift_name}</h4>
                                    <p>{r.technician_name} &bull; {new Date(r.completed_at).toLocaleDateString('id-ID')}</p>
                                </div>
                                <span className={`badge ${r.lift_type === 'cargo' ? 'badge-blue' : 'badge-purple'}`}>
                                    {r.lift_type === 'cargo' ? 'Cargo' : 'Elevator'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state"><p>Belum ada laporan</p></div>
                    )}
                </div>
            </div>
        </div>
    );
}
