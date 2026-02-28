import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Plus, Play, CheckCircle2, Trash2, CalendarDays, MapPin, User, StickyNote, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function Schedule() {
    const [schedules, setSchedules] = useState([]);
    const [lifts, setLifts] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({ status: '', technician_id: '' });
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [form, setForm] = useState({ lift_id: '', technician_id: '', scheduled_date: '', notes: '' });
    const [deleteId, setDeleteId] = useState(null);
    const toast = useToast();

    const fetchData = () => {
        const params = {};
        if (filter.status) params.status = filter.status;
        if (filter.technician_id) params.technician_id = filter.technician_id;
        Promise.all([
            api.get('/schedules', { params }),
            api.get('/lifts'),
            api.get('/users', { params: { role: 'teknisi' } }),
        ]).then(([sRes, lRes, tRes]) => {
            setSchedules(sRes.data);
            setLifts(lRes.data);
            setTechnicians(tRes.data);
        }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [filter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/schedules', form);
            toast.success('Jadwal berhasil dibuat');
            setShowModal(false);
            setForm({ lift_id: '', technician_id: '', scheduled_date: '', notes: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/schedules/${id}`, { status });
            toast.success(status === 'completed' ? 'Jadwal selesai' : 'Status berhasil diperbarui');
            fetchData();
        } catch (err) {
            toast.error('Gagal update status');
        }
    };

    const handleDelete = async () => {
        try { await api.delete(`/schedules/${deleteId}`); toast.success('Jadwal berhasil dihapus'); fetchData(); } catch { toast.error('Gagal menghapus'); } finally { setDeleteId(null); }
    };

    const getStatusBadge = (status) => {
        const map = {
            scheduled: { class: 'badge-yellow', label: 'Terjadwal' },
            in_progress: { class: 'badge-blue', label: 'Dalam Proses' },
            completed: { class: 'badge-green', label: 'Selesai' },
            cancelled: { class: 'badge-red', label: 'Dibatalkan' },
        };
        const s = map[status] || map.scheduled;
        return <span className={`badge ${s.class}`}>{s.label}</span>;
    };

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <div>
                    <h2>Jadwal Maintenance</h2>
                    <p>Kelola jadwal maintenance dan penugasan teknisi</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Buat Jadwal</button>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={16} className="search-box-icon" />
                    <input type="text" className="form-input search-input" placeholder="Cari jadwal..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-select" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
                    <option value="">Semua Status</option>
                    <option value="scheduled">Terjadwal</option>
                    <option value="in_progress">Dalam Proses</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>
                <select className="form-select" value={filter.technician_id} onChange={e => setFilter({ ...filter, technician_id: e.target.value })}>
                    <option value="">Semua Teknisi</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input type="month" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} title="Filter bulan" style={{ maxWidth: '170px' }} />
            </div>

            {(() => {
                let filtered = schedules.filter(s => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (s.lift_name || '').toLowerCase().includes(q) || (s.technician_name || '').toLowerCase().includes(q) || (s.cabang || '').toLowerCase().includes(q);
                });
                if (dateFilter) filtered = filtered.filter(s => {
                    const d = s.scheduled_date?.slice(0, 7);
                    return d && d === dateFilter;
                });
                return filtered.length > 0 ? (
                    filtered.map(s => (
                        <div key={s.id} className="schedule-card">
                            <div className="schedule-date">
                                <span className="day">{new Date(s.scheduled_date).getDate()}</span>
                                <span className="month">{new Date(s.scheduled_date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                            </div>
                            <div className="schedule-info" style={{ flex: 1 }}>
                                <h4>{s.lift_name}</h4>
                                <p><User size={12} style={{ verticalAlign: '-2px' }} /> {s.technician_name} &bull; <MapPin size={12} style={{ verticalAlign: '-2px' }} /> {s.cabang || '-'} &bull; {s.lift_type === 'cargo' ? 'Cargo' : 'Elevator'}</p>
                                {s.notes && <p style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}><StickyNote size={12} style={{ verticalAlign: '-2px' }} /> {s.notes}</p>}
                            </div>
                            {getStatusBadge(s.status)}
                            <div className="schedule-actions">
                                {s.status === 'scheduled' && (
                                    <Link to={`/maintenance-form?schedule=${s.id}`} className="btn btn-sm btn-primary"><Play size={14} /> Mulai</Link>
                                )}
                                {s.status === 'in_progress' && (
                                    <Link to={`/maintenance-form?schedule=${s.id}`} className="btn btn-sm btn-primary"><Play size={14} /> Lanjutkan</Link>
                                )}
                                <button className="btn btn-sm btn-ghost" onClick={() => setDeleteId(s.id)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card">
                        <div className="empty-state">
                            <div className="icon"><CalendarDays size={40} /></div>
                            <h3>Belum ada jadwal</h3>
                            <p>Buat jadwal maintenance baru untuk memulai</p>
                        </div>
                    </div>
                );
            })()}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Buat Jadwal Baru</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Pilih Lift *</label>
                                    <select className="form-select" value={form.lift_id} onChange={e => setForm({ ...form, lift_id: e.target.value })} required>
                                        <option value="">-- Pilih Lift --</option>
                                        {lifts.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type === 'cargo' ? 'Cargo' : 'Elevator'}) - {l.cabang}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Assign Teknisi *</label>
                                    <select className="form-select" value={form.technician_id} onChange={e => setForm({ ...form, technician_id: e.target.value })} required>
                                        <option value="">-- Pilih Teknisi --</option>
                                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tanggal Maintenance *</label>
                                    <input type="date" className="form-input" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Catatan</label>
                                    <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Buat Jadwal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!deleteId}
                title="Hapus Jadwal"
                message="Apakah Anda yakin ingin menghapus jadwal ini?"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
