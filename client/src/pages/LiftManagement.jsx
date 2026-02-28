import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Pencil, Trash2, Search, Package, Users as UsersIcon, QrCode, Download, Printer } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { QRCodeCanvas } from 'qrcode.react';

export default function LiftManagement() {
    const [lifts, setLifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editLift, setEditLift] = useState(null);
    const [filter, setFilter] = useState({ type: '', cabang: '' });
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', type: 'cargo', merk: '', model: '', cabang: '', location: '', floors: '' });
    const [deleteId, setDeleteId] = useState(null);
    const [qrLift, setQrLift] = useState(null);
    const [qrToken, setQrToken] = useState(null);
    const [qrPin, setQrPin] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTechId, setSelectedTechId] = useState('');
    const toast = useToast();

    const fetchLifts = () => {
        const params = {};
        if (filter.type) params.type = filter.type;
        if (filter.cabang) params.cabang = filter.cabang;
        api.get('/lifts', { params })
            .then(res => setLifts(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLifts();
        api.get('/users?role=teknisi').then(res => setTechnicians(res.data.filter(u => u.role === 'teknisi' && u.active !== 0))).catch(() => { });
    }, [filter]);

    const openAdd = () => {
        setEditLift(null);
        setForm({ name: '', type: 'cargo', merk: '', model: '', cabang: '', location: '', floors: '' });
        setShowModal(true);
    };

    const openEdit = (lift) => {
        setEditLift(lift);
        setForm({
            name: lift.name, type: lift.type, merk: lift.merk || '', model: lift.model || '',
            cabang: lift.cabang || '', location: lift.location || '', floors: lift.floors || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editLift) {
                await api.put(`/lifts/${editLift.id}`, form);
                toast.success('Lift berhasil diperbarui');
            } else {
                await api.post('/lifts', form);
                toast.success('Lift berhasil ditambahkan');
            }
            setShowModal(false);
            fetchLifts();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/lifts/${deleteId}`);
            toast.success('Lift berhasil dihapus');
            fetchLifts();
        } catch (err) {
            toast.error('Gagal menghapus');
        } finally {
            setDeleteId(null);
        }
    };

    const getQrUrl = () => {
        if (!qrToken) return '';
        const base = window.location.origin;
        return `${base}/qr/${qrToken}`;
    };

    const openQr = async (lift) => {
        setQrLift(lift);
        setQrToken(null);
        setQrPin(null);
        setQrLoading(true);
        try {
            const res = await api.post('/qr/generate', { lift_id: lift.id });
            setQrToken(res.data.token);
            setQrPin(res.data.pin);
        } catch (err) {
            toast.error('Gagal generate QR token');
            setQrLift(null);
        } finally {
            setQrLoading(false);
        }
    };

    const downloadQr = () => {
        if (!qrLift) return;
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `qr-lift-${qrLift.name.replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const printQr = () => {
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head><title>QR Code - ${qrLift?.name}</title>
            <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                img { width: 280px; height: 280px; }
                h2 { margin: 24px 0 4px; font-size: 22px; }
                p { color: #666; font-size: 14px; margin: 4px 0; }
                .info { margin-top: 12px; font-size: 13px; color: #888; border-top: 1px solid #eee; padding-top: 12px; text-align: center; }
            </style>
            </head>
            <body>
                <img src="${canvas.toDataURL('image/png')}" />
                <h2>${qrLift?.name}</h2>
                <p>${qrLift?.type === 'cargo' ? 'Cargo Lift' : 'Elevator'} — ${qrLift?.cabang || ''}</p>
                <p>${qrLift?.location || ''}</p>
                <div class="info">Scan QR code ini untuk mengakses form maintenance</div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <div>
                    <h2>Kelola Lift</h2>
                    <p>Manajemen data lift dan elevator</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah Lift</button>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={16} className="search-box-icon" />
                    <input type="text" className="form-input search-input" placeholder="Cari lift..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-select" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
                    <option value="">Semua Tipe</option>
                    <option value="cargo">Cargo Lift</option>
                    <option value="passenger">Passenger Elevator</option>
                </select>
                <select className="form-select" value={filter.cabang} onChange={e => setFilter({ ...filter, cabang: e.target.value })}>
                    <option value="">Semua Cabang</option>
                    {[...new Set(lifts.map(l => l.cabang).filter(Boolean))].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Tipe</th>
                            <th>Merk</th>
                            <th>Cabang</th>
                            <th>Lokasi</th>
                            <th>Lantai</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lifts.filter(l => {
                            if (!search) return true;
                            const q = search.toLowerCase();
                            return (l.name || '').toLowerCase().includes(q) || (l.merk || '').toLowerCase().includes(q) || (l.cabang || '').toLowerCase().includes(q) || (l.location || '').toLowerCase().includes(q);
                        }).map(l => (
                            <tr key={l.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</td>
                                <td>
                                    <span className={`badge ${l.type === 'cargo' ? 'badge-blue' : 'badge-purple'}`}>
                                        {l.type === 'cargo' ? <><Package size={12} /> Cargo</> : <><UsersIcon size={12} /> Elevator</>}
                                    </span>
                                </td>
                                <td>{l.merk || '-'}</td>
                                <td>{l.cabang || '-'}</td>
                                <td>{l.location || '-'}</td>
                                <td>{l.floors || '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <button className="btn btn-sm btn-ghost" onClick={() => openQr(l)} title="QR Code"><QrCode size={14} /></button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => openEdit(l)} title="Edit"><Pencil size={14} /></button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => setDeleteId(l.id)} title="Hapus" style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {lifts.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                {loading ? 'Memuat...' : 'Belum ada data lift'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editLift ? 'Edit Lift' : 'Tambah Lift Baru'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Nama Lift *</label>
                                        <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tipe *</label>
                                        <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                            <option value="cargo">Cargo Lift</option>
                                            <option value="passenger">Passenger Elevator</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Merk</label>
                                        <input className="form-input" value={form.merk} onChange={e => setForm({ ...form, merk: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Model</label>
                                        <input className="form-input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Cabang</label>
                                        <input className="form-input" value={form.cabang} onChange={e => setForm({ ...form, cabang: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Lantai</label>
                                        <input type="number" className="form-input" value={form.floors} onChange={e => setForm({ ...form, floors: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lokasi</label>
                                    <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editLift ? 'Simpan' : 'Tambah'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrLift && (
                <div className="modal-overlay" onClick={() => setQrLift(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h2>QR Code Lift</h2>
                            <button className="modal-close" onClick={() => setQrLift(null)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center' }}>
                            <div style={{
                                background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
                                display: 'inline-block', border: '1px solid var(--gray-200)', marginBottom: '16px'
                            }}>
                                {qrLoading ? (
                                    <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Generating...</div>
                                ) : qrToken ? (
                                    <QRCodeCanvas
                                        id="qr-canvas"
                                        value={getQrUrl()}
                                        size={220}
                                        level="H"
                                        includeMargin={true}
                                    />
                                ) : null}
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{qrLift.name}</h3>
                            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '4px' }}>
                                {qrLift.type === 'cargo' ? 'Cargo Lift' : 'Elevator'} — {qrLift.cabang || '-'}
                            </p>
                            <p style={{ color: 'var(--gray-400)', fontSize: '13px', marginBottom: '16px' }}>
                                {qrLift.location || '-'}
                            </p>
                            <div style={{
                                padding: '10px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)',
                                fontSize: '12px', color: 'var(--gray-500)', wordBreak: 'break-all', marginBottom: '16px'
                            }}>
                                {qrLoading ? 'Generating...' : getQrUrl()}
                            </div>
                            {qrPin && (
                                <div style={{
                                    padding: '12px 16px', background: 'var(--primary-50)',
                                    borderRadius: '10px', marginBottom: '16px',
                                    border: '1px solid var(--primary-100)'
                                }}>
                                    <p style={{ fontSize: '12px', color: 'var(--primary-600)', fontWeight: 600, marginBottom: '4px' }}>PIN AKSES</p>
                                    <p style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '8px', color: 'var(--primary-700)' }}>{qrPin}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>Berikan PIN ini kepada teknisi</p>
                                </div>
                            )}
                            <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>
                                Tempel QR di unit lift. Teknisi scan QR lalu masukkan PIN untuk akses form.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-ghost" onClick={downloadQr}><Download size={14} /> Download PNG</button>
                            <button className="btn btn-primary" onClick={printQr}><Printer size={14} /> Print</button>
                            {qrPin && technicians.length > 0 && (
                                <div style={{ marginBottom: '12px', width: '100%' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>Kirim PIN ke Teknisi</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select
                                            className="form-select"
                                            value={selectedTechId}
                                            onChange={e => setSelectedTechId(e.target.value)}
                                            style={{ flex: 1, fontSize: '13px' }}
                                        >
                                            <option value="">— Pilih teknisi —</option>
                                            {technicians.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} {t.phone ? `(${t.phone})` : '(no HP)'}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn btn-success"
                                            disabled={!selectedTechId}
                                            onClick={() => {
                                                const tech = technicians.find(t => t.id === Number(selectedTechId));
                                                if (!tech?.phone) { toast.error('Teknisi belum punya nomor HP'); return; }
                                                const phone = tech.phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
                                                const msg = `🔐 PIN Akses Maintenance\n${qrLift.name} (${qrLift.cabang || '-'})\n\nPIN: *${qrPin}*\n\nMasukkan PIN ini setelah scan QR di unit lift.`;
                                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >Kirim via WA</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!deleteId}
                title="Hapus Lift"
                message="Apakah Anda yakin ingin menghapus lift ini? Semua jadwal dan laporan terkait juga akan terhapus."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
