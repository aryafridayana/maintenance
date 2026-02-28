import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download, Package, Users as UsersIcon, ClipboardList, PenTool } from 'lucide-react';
import { generateCargoLiftPDF } from '../utils/pdfCargoLift';
import { generateElevatorPDF } from '../utils/pdfElevator';
import { useToast } from '../context/ToastContext';
import SignaturePad from '../components/SignaturePad';

export default function TechHistory() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [signReport, setSignReport] = useState(null);
    const [signStep, setSignStep] = useState(1);
    const [teknisiSig, setTeknisiSig] = useState(null);
    const [teknisiName, setTeknisiName] = useState('');
    const [clientName, setClientName] = useState('');
    const toast = useToast();

    useEffect(() => {
        api.get('/reports')
            .then(res => setReports(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const downloadPDF = async (id) => {
        try {
            const res = await api.get(`/reports/${id}`);
            const report = res.data;
            const doc = report.type === 'cargo' ? generateCargoLiftPDF(report) : generateElevatorPDF(report);
            doc.save(`laporan-${report.type}-${report.id}.pdf`);
        } catch (err) {
            toast.error('Gagal generate PDF');
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

    const handleTeknisiSign = (sigDataURL) => {
        setTeknisiSig(sigDataURL);
        setSignStep(2);
    };

    const handleClientSign = (sigDataURL) => {
        if (!signReport) return;
        const signatures = {
            teknisi: { image: teknisiSig, name: teknisiName },
            client: { image: sigDataURL, name: clientName },
        };
        try {
            const doc = signReport.type === 'cargo'
                ? generateCargoLiftPDF(signReport, signatures)
                : generateElevatorPDF(signReport, signatures);
            doc.save(`laporan-${signReport.type}-${signReport.id}-signed.pdf`);
            toast.success('PDF dengan tanda tangan berhasil diunduh!');
        } catch (err) {
            toast.error('Gagal generate PDF');
        }
        setSignReport(null);
    };

    return (
        <div className="page-content fade-in">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Riwayat Maintenance</h2>

            {reports.length > 0 ? reports.map(r => (
                <div key={r.id} className="tech-schedule-card" style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{r.lift_name}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                                {new Date(r.completed_at).toLocaleDateString('id-ID')} &bull;
                                <span className={`badge ${r.type === 'cargo' ? 'badge-blue' : 'badge-purple'}`} style={{ marginLeft: '6px' }}>
                                    {r.type === 'cargo' ? <><Package size={10} /> Cargo</> : <><UsersIcon size={10} /> Elevator</>}
                                </span>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button className="btn btn-sm btn-primary" onClick={() => openSignModal(r.id)}>
                                <PenTool size={14} /> TTD
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => downloadPDF(r.id)}>
                                <Download size={14} /> PDF
                            </button>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="card"><div className="empty-state"><ClipboardList size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} /><h3>{loading ? 'Memuat...' : 'Belum ada riwayat'}</h3></div></div>
            )}

            {/* Signature Modal */}
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
