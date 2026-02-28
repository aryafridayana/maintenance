import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Plus, FileText, Eye, Download, Package, Users as UsersIcon, Search, PenTool } from 'lucide-react';
import { generateCargoLiftPDF } from '../utils/pdfCargoLift';
import { generateElevatorPDF } from '../utils/pdfElevator';
import { useToast } from '../context/ToastContext';
import SignaturePad from '../components/SignaturePad';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: '' });
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [viewReport, setViewReport] = useState(null);
    const [signReport, setSignReport] = useState(null);
    const [signStep, setSignStep] = useState(1); // 1 = teknisi, 2 = pihak lain
    const [teknisiSig, setTeknisiSig] = useState(null);
    const [teknisiName, setTeknisiName] = useState('');
    const [clientName, setClientName] = useState('');
    const toast = useToast();

    const fetchReports = () => {
        const params = {};
        if (filter.type) params.type = filter.type;
        api.get('/reports', { params })
            .then(res => setReports(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReports(); }, [filter]);

    const viewDetail = async (id) => {
        try {
            const res = await api.get(`/reports/${id}`);
            setViewReport(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const downloadPDF = async (id, signatures = null) => {
        try {
            const res = await api.get(`/reports/${id}`);
            const report = res.data;
            const doc = report.type === 'cargo'
                ? generateCargoLiftPDF(report, signatures)
                : generateElevatorPDF(report, signatures);
            const suffix = signatures ? '-signed' : '';
            doc.save(`laporan-maintenance-${report.type}-${report.id}${suffix}.pdf`);
            return true;
        } catch (err) {
            toast.error('Gagal generate PDF');
            console.error(err);
            return false;
        }
    };

    const openSignModal = async (id) => {
        try {
            const res = await api.get(`/reports/${id}`);
            setSignReport(res.data);
            setSignStep(1);
            setTeknisiSig(null);
            setTeknisiName(res.data.technician_name || '');
            setClientName('');
        } catch (err) {
            toast.error('Gagal memuat laporan');
        }
    };

    // Step 1: Teknisi signs -> go to step 2
    const handleTeknisiSign = (sigDataURL) => {
        setTeknisiSig(sigDataURL);
        setSignStep(2);
    };

    // Step 2: Client/manager signs -> generate PDF with both signatures
    const handleClientSign = (sigDataURL) => {
        if (!signReport) return;
        const report = signReport;
        const signatures = {
            teknisi: { image: teknisiSig, name: teknisiName },
            client: { image: sigDataURL, name: clientName },
        };
        try {
            const doc = report.type === 'cargo'
                ? generateCargoLiftPDF(report, signatures)
                : generateElevatorPDF(report, signatures);
            doc.save(`laporan-maintenance-${report.type}-${report.id}-signed.pdf`);
            toast.success('PDF dengan tanda tangan berhasil diunduh!');
        } catch (err) {
            toast.error('Gagal generate PDF');
        }
        setSignReport(null);
    };

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <div>
                    <h2>Laporan Maintenance</h2>
                    <p>Riwayat semua laporan maintenance yang telah dibuat</p>
                </div>
                <Link to="/maintenance-form" className="btn btn-primary"><Plus size={16} /> Buat Laporan</Link>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={16} className="search-box-icon" />
                    <input type="text" className="form-input search-input" placeholder="Cari laporan..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-select" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
                    <option value="">Semua Tipe</option>
                    <option value="cargo">Cargo Lift</option>
                    <option value="passenger">Passenger Elevator</option>
                </select>
                <input type="month" className="form-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} title="Filter bulan" style={{ maxWidth: '170px' }} />
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Lift</th>
                            <th>Tipe</th>
                            <th>Cabang</th>
                            <th>Teknisi</th>
                            <th>Tanggal</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.filter(r => {
                            if (search) {
                                const q = search.toLowerCase();
                                if (!(r.lift_name || '').toLowerCase().includes(q) && !(r.technician_name || '').toLowerCase().includes(q) && !(r.cabang || '').toLowerCase().includes(q)) return false;
                            }
                            if (dateFilter && r.completed_at) {
                                const d = new Date(r.completed_at).toISOString().slice(0, 7);
                                if (d !== dateFilter) return false;
                            }
                            return true;
                        }).map(r => (
                            <tr key={r.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{r.id}</td>
                                <td>{r.lift_name}</td>
                                <td>
                                    <span className={`badge ${r.type === 'cargo' ? 'badge-blue' : 'badge-purple'}`}>
                                        {r.type === 'cargo' ? <><Package size={12} /> Cargo</> : <><UsersIcon size={12} /> Elevator</>}
                                    </span>
                                </td>
                                <td>{r.cabang || '-'}</td>
                                <td>{r.technician_name}</td>
                                <td>{new Date(r.completed_at).toLocaleDateString('id-ID')}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <button className="btn btn-sm btn-ghost" onClick={() => viewDetail(r.id)}><Eye size={14} /> Detail</button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => downloadPDF(r.id)}><Download size={14} /> PDF</button>
                                        <button className="btn btn-sm btn-primary" onClick={() => openSignModal(r.id)}><PenTool size={14} /> TTD & PDF</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                {loading ? 'Memuat...' : 'Belum ada laporan'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {viewReport && (
                <div className="modal-overlay" onClick={() => setViewReport(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detail Laporan #{viewReport.id}</h2>
                            <button className="modal-close" onClick={() => setViewReport(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row" style={{ marginBottom: '16px' }}>
                                <div><strong>Lift:</strong> {viewReport.lift_name}</div>
                                <div><strong>Tipe:</strong> {viewReport.type === 'cargo' ? 'Cargo Lift' : 'Elevator'}</div>
                                <div><strong>Teknisi:</strong> {viewReport.technician_name}</div>
                                <div><strong>Tanggal:</strong> {new Date(viewReport.completed_at).toLocaleDateString('id-ID')}</div>
                            </div>
                            {viewReport.checklist_data?.sections?.map(section => (
                                <div key={section.id || section.code} style={{ marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-primary)' }}>
                                        {section.num || section.code}. {section.name}
                                    </h4>
                                    <table className="data-table" style={{ fontSize: '13px' }}>
                                        <thead><tr><th>Item</th><th style={{ width: '80px' }}>Kondisi</th><th>Keterangan</th></tr></thead>
                                        <tbody>
                                            {section.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.name}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.condition || '-'}</td>
                                                    <td>{item.note || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                            {viewReport.remarks && (
                                <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginTop: '12px' }}>
                                    <strong>Catatan:</strong> {viewReport.remarks}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => { openSignModal(viewReport.id); setViewReport(null); }}><PenTool size={14} /> TTD & Download PDF</button>
                            <button className="btn btn-ghost" onClick={() => downloadPDF(viewReport.id)}><Download size={14} /> PDF Tanpa TTD</button>
                            <button className="btn btn-ghost" onClick={() => setViewReport(null)}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Modal - 2 Steps */}
            {signReport && (
                <div className="modal-overlay" onClick={() => setSignReport(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
                        <div className="modal-header">
                            <h2>Tanda Tangan Digital</h2>
                            <button className="modal-close" onClick={() => setSignReport(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                                <strong>Laporan #{signReport.id}</strong> — {signReport.lift_name} ({signReport.type === 'cargo' ? 'Cargo' : 'Elevator'})
                            </div>

                            {/* Step indicator */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <div style={{
                                    flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13px', fontWeight: 600,
                                    background: signStep === 1 ? 'var(--primary-600)' : 'var(--success-50)',
                                    color: signStep === 1 ? 'white' : 'var(--success-700)',
                                    border: signStep === 1 ? 'none' : '1px solid var(--success-200)',
                                }}>
                                    {signStep > 1 ? '✓ ' : '1. '}Teknisi
                                </div>
                                <div style={{
                                    flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13px', fontWeight: 600,
                                    background: signStep === 2 ? 'var(--primary-600)' : 'var(--gray-50)',
                                    color: signStep === 2 ? 'white' : 'var(--gray-400)',
                                    border: signStep === 2 ? 'none' : '1px solid var(--gray-200)',
                                }}>
                                    2. Penerima
                                </div>
                            </div>

                            {signStep === 1 && (
                                <>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <label className="form-label">Nama Teknisi</label>
                                        <input className="form-input" value={teknisiName} onChange={e => setTeknisiName(e.target.value)} placeholder="Nama lengkap teknisi" />
                                    </div>
                                    <SignaturePad
                                        height={160}
                                        onSave={handleTeknisiSign}
                                        onCancel={() => setSignReport(null)}
                                    />
                                </>
                            )}

                            {signStep === 2 && (
                                <>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <label className="form-label">Nama Penerima / Manager Cabang</label>
                                        <input className="form-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nama lengkap penerima" />
                                    </div>
                                    <SignaturePad
                                        width={490}
                                        height={160}
                                        onSave={handleClientSign}
                                        onCancel={() => { setSignStep(1); setTeknisiSig(null); }}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
