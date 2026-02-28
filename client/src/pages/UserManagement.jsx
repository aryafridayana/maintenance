import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Pencil, Trash2, Lock, Unlock, ShieldCheck, Shield, HardHat, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teknisi', phone: '' });
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const toast = useToast();

    const fetchUsers = () => {
        api.get('/users')
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, []);

    const openAdd = () => {
        setEditUser(null);
        setForm({ name: '', email: '', password: '', role: 'teknisi', phone: '' });
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditUser(user);
        setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) {
                const payload = { ...form };
                if (!payload.password) delete payload.password;
                await api.put(`/users/${editUser.id}`, payload);
                toast.success('User berhasil diperbarui');
            } else {
                await api.post('/users', form);
                toast.success('User berhasil ditambahkan');
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan');
        }
    };

    const toggleActive = async (user) => {
        try {
            await api.put(`/users/${user.id}`, { active: user.active ? 0 : 1 });
            toast.success(user.active ? 'User dinonaktifkan' : 'User diaktifkan');
            fetchUsers();
        } catch (err) {
            toast.error('Gagal update status');
        }
    };

    const handleDelete = async () => {
        try { await api.delete(`/users/${deleteId}`); toast.success('User berhasil dihapus'); fetchUsers(); } catch { toast.error('Gagal menghapus'); } finally { setDeleteId(null); }
    };

    const getRoleBadge = (role) => {
        const map = {
            superadmin: { cls: 'badge-red', icon: ShieldCheck, label: 'Super Admin' },
            admin: { cls: 'badge-blue', icon: Shield, label: 'Admin' },
            teknisi: { cls: 'badge-green', icon: HardHat, label: 'Teknisi' },
        };
        const r = map[role] || map.teknisi;
        return <span className={`badge ${r.cls}`}><r.icon size={12} /> {r.label}</span>;
    };

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <div><h2>Manajemen User</h2><p>Kelola akun pengguna sistem</p></div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah User</button>
            </div>
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={16} className="search-box-icon" />
                    <input type="text" className="form-input search-input" placeholder="Cari user..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Telepon</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {users.filter(u => {
                            if (!search) return true;
                            const q = search.toLowerCase();
                            return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q);
                        }).map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{getRoleBadge(u.role)}</td>
                                <td>{u.phone || '-'}</td>
                                <td><span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>{u.active ? 'Aktif' : 'Nonaktif'}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button className="btn btn-sm btn-ghost" onClick={() => openEdit(u)}><Pencil size={14} /></button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(u)}>{u.active ? <Lock size={14} /> : <Unlock size={14} />}</button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => setDeleteId(u.id)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{loading ? 'Memuat...' : 'Belum ada user'}</td></tr>}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editUser ? 'Edit User' : 'Tambah User Baru'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Nama Lengkap *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">{editUser ? 'Password (kosongkan jika tidak diubah)' : 'Password *'}</label><input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Role *</label>
                                        <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                            <option value="teknisi">Teknisi</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label className="form-label">Telepon</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editUser ? 'Simpan' : 'Tambah'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!deleteId}
                title="Hapus User"
                message="Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
