import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Play, MapPin, CalendarDays } from 'lucide-react';

export default function TechSchedules() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('scheduled');

    const fetchSchedules = () => {
        api.get('/schedules')
            .then(res => setSchedules(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSchedules(); }, []);

    const filtered = schedules.filter(s => tab === 'all' ? true : s.status === tab);

    const tabs = [
        { key: 'scheduled', label: 'Terjadwal' },
        { key: 'in_progress', label: 'Proses' },
        { key: 'completed', label: 'Selesai' },
        { key: 'all', label: 'Semua' },
    ];

    const getStatusBadge = (status) => {
        const map = {
            scheduled: { class: 'badge-yellow', label: 'Terjadwal' },
            in_progress: { class: 'badge-blue', label: 'Proses' },
            completed: { class: 'badge-green', label: 'Selesai' },
        };
        const s = map[status] || { class: 'badge-gray', label: status };
        return <span className={`badge ${s.class}`}>{s.label}</span>;
    };

    return (
        <div className="page-content fade-in">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Jadwal Saya</h2>

            <div className="filters-bar" style={{ gap: '6px', marginBottom: '16px' }}>
                {tabs.map(t => (
                    <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {filtered.length > 0 ? filtered.map(s => (
                <div key={s.id} className="tech-schedule-card" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{s.lift_name}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                                <MapPin size={12} style={{ verticalAlign: '-2px' }} /> {s.cabang || '-'} &bull; <CalendarDays size={12} style={{ verticalAlign: '-2px' }} /> {new Date(s.scheduled_date).toLocaleDateString('id-ID')}
                            </p>
                            {s.notes && <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>{s.notes}</p>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            {getStatusBadge(s.status)}
                            {(s.status === 'scheduled' || s.status === 'in_progress') && (
                                <Link to={`/maintenance-form?schedule=${s.id}`} className="btn btn-sm btn-primary">
                                    <Play size={14} /> Mulai
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )) : (
                <div className="card"><div className="empty-state"><CalendarDays size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} /><h3>{loading ? 'Memuat...' : 'Tidak ada jadwal'}</h3></div></div>
            )}
        </div>
    );
}
