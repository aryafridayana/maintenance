import { useState, useEffect, useCallback } from 'react';
import { Package, Save } from 'lucide-react';

const CARGO_CHECKLIST = [
    {
        id: 'mesin', name: 'MESIN', num: '1',
        items: ['Motor Coil', 'Gear Box', 'Wire Rope', 'Chain Load', 'Contactor', 'Kampas Brake', 'Olie Mesin', 'Magnetic Brake']
    },
    {
        id: 'safety', name: 'SAFETY', num: '2',
        items: ['Limit Switch Level', 'Final Limit Switch', 'Emergency Stop', 'Spring Bufer', 'Safety Block', 'Gate Lock Switch']
    },
    {
        id: 'car', name: 'CAR', num: '3',
        items: ['Dinding Car', 'Pintu Car', 'Cam Limit Switch', 'Hook Car', 'Guide Shoe Car']
    },
    {
        id: 'hoistway', name: 'HOISTWAY', num: '4',
        items: ['Rel Car', 'Pintu Luar', 'Cable Control', 'Braket Rel']
    },
    {
        id: 'control_panel', name: 'CONTROL PANEL', num: '5',
        items: ['Power Supply', 'Relay-Relay', 'MCB', 'Trafo', 'Rectifire', 'Terminal Cable', 'Fuse']
    },
    {
        id: 'push_bottom', name: 'PUSH BOTTOM', num: '6',
        items: ['Call 1', 'Call 2', 'Call 3', 'Call 4', 'Digital Seven Segment']
    },
    {
        id: 'pelumasan', name: 'PELUMASAN', num: '7',
        items: ['Rel Car', 'Chain Load', 'Guide Shoe', 'Pintu Car', 'Pintu Luar', 'Wire Rope', 'Hook Shave']
    },
    {
        id: 'cleaning', name: 'CLEANING', num: '8',
        items: ['Dinding Car', 'Top Car', 'Bottom Car', 'Pit Car', 'Machine Room', 'Machine', 'Pintu Car']
    }
];

const CONDITIONS = [
    { key: 'X', label: 'X', title: 'Rusak' },
    { key: 'O', label: 'O', title: 'Ganti' },
    { key: '#', label: '#', title: 'Adjust/Setel' },
    { key: 'V', label: 'V', title: 'Baik' },
];

function getInitialChecklist() {
    const initial = {};
    CARGO_CHECKLIST.forEach(section => {
        section.items.forEach(item => {
            initial[`${section.id}_${item}`] = { condition: '', note: '' };
        });
    });
    return initial;
}

export default function CargoLiftForm({ liftData, scheduleId, onSubmit, storageKey }) {
    // Restore from localStorage if available
    const [checklist, setChecklist] = useState(() => {
        if (storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.checklist) return parsed.checklist;
                }
            } catch (e) { /* ignore */ }
        }
        return getInitialChecklist();
    });
    const [cabang, setCabang] = useState(() => {
        if (storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.cabang !== undefined) return parsed.cabang;
                }
            } catch (e) { /* ignore */ }
        }
        return liftData?.cabang || '';
    });
    const [remarks, setRemarks] = useState(() => {
        if (storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.remarks !== undefined) return parsed.remarks;
                }
            } catch (e) { /* ignore */ }
        }
        return '';
    });

    // Auto-save to localStorage on every change
    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify({ checklist, cabang, remarks }));
        }
    }, [checklist, cabang, remarks, storageKey]);

    const updateItem = (key, field, value) => {
        setChecklist(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    };

    const handleSubmit = () => {
        const data = {
            schedule_id: scheduleId,
            lift_id: liftData?.id,
            type: 'cargo',
            checklist_data: {
                sections: CARGO_CHECKLIST.map(s => ({
                    ...s,
                    items: s.items.map(item => ({
                        name: item,
                        ...checklist[`${s.id}_${item}`]
                    }))
                })), cabang
            },
            remarks,
        };
        onSubmit(data);
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                    <Package size={20} style={{ verticalAlign: '-3px', marginRight: '8px' }} />Laporan Service Maintenance Cargo Lift
                </h3>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Tanggal</label>
                        <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} readOnly />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Merk</label>
                        <input className="form-input" defaultValue={liftData?.merk || ''} readOnly />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <input className="form-input" defaultValue={liftData?.model || ''} readOnly />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Cabang</label>
                    <input className="form-input" value={cabang} onChange={e => setCabang(e.target.value)} placeholder="Nama Cabang" />
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <strong>Keterangan Kondisi:</strong> X = Rusak &nbsp;|&nbsp; O = Ganti &nbsp;|&nbsp; # = Adjust/Setel &nbsp;|&nbsp; V = Baik
                </div>
            </div>

            {CARGO_CHECKLIST.map(section => (
                <div key={section.id} className="checklist-section card" style={{ marginBottom: '16px' }}>
                    <div className="checklist-section-title">
                        <span className="num">{section.num}</span>
                        {section.name}
                    </div>
                    <table className="checklist-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', width: '35%' }}>Uraian Pekerjaan</th>
                                {CONDITIONS.map(c => (
                                    <th key={c.key} style={{ width: '8%' }} title={c.title}>{c.label}</th>
                                ))}
                                <th style={{ width: '30%' }}>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {section.items.map(item => {
                                const key = `${section.id}_${item}`;
                                return (
                                    <tr key={key}>
                                        <td>- {item}</td>
                                        {CONDITIONS.map(c => (
                                            <td key={c.key} className="checklist-radio">
                                                <label title={c.title} style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer',
                                                    fontSize: '13px', fontWeight: 600,
                                                    background: checklist[key]?.condition === c.key ? 'var(--accent-primary)' : 'var(--bg-input)',
                                                    color: checklist[key]?.condition === c.key ? 'white' : 'var(--text-muted)',
                                                    border: `1px solid ${checklist[key]?.condition === c.key ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                                    transition: 'all 0.15s ease'
                                                }}>
                                                    <input
                                                        type="radio"
                                                        name={key}
                                                        style={{ display: 'none' }}
                                                        onChange={() => updateItem(key, 'condition', c.key)}
                                                    />
                                                    {c.label}
                                                </label>
                                            </td>
                                        ))}
                                        <td>
                                            <input
                                                className="checklist-note"
                                                value={checklist[key]?.note || ''}
                                                onChange={e => updateItem(key, 'note', e.target.value)}
                                                placeholder="Keterangan..."
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}

            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="form-group">
                    <label className="form-label">Catatan Tambahan</label>
                    <textarea className="form-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Catatan tambahan..." />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '40px' }}>
                <button className="btn btn-success" onClick={handleSubmit} style={{ padding: '12px 32px', fontSize: '15px' }}>
                    <Save size={16} /> Simpan &amp; Submit Laporan
                </button>
            </div>
        </div>
    );
}
