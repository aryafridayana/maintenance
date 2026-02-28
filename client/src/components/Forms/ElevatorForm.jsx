import { useState, useEffect } from 'react';
import { Building2, Save, Info } from 'lucide-react';

const ELEVATOR_CHECKLIST = [
    {
        id: 'machine_room', name: 'MACHINE ROOM', code: 'A',
        items: ['M. Room Environment', 'Main Panel', 'Motor/Traction Machine', 'Brake Shoe', 'Magnetik Brake/Silinoit Brake', 'Sheave Drive', 'Controller', 'Governoor', 'Deflextor Sheave', 'A.R.D.', 'Fan / Air Condition']
    },
    {
        id: 'car_top', name: 'CAR TOP', code: 'B',
        items: ['Car Top Environment', 'Car Frame', 'Car Sheave', 'Operator / Door Operator', 'Hoist & Goov. ropes, hitches', 'Safety Switches', 'Safety Breake SW', 'Roller / Sliding Guide Car', 'Standing Car', 'Car Hanger Roller']
    },
    {
        id: 'entrance', name: 'ENTRANCE', code: 'C',
        items: ['Indicators', 'Hall Buttons', 'Sill & Entraces', 'Hall Door', 'Hall Lanten', 'Hall Hanger Roller']
    },
    {
        id: 'hoistway', name: 'HOISTWAY', code: 'D',
        items: ['Hoistway Environment', 'Hoist Rope', 'Governoor Rope', 'Compensating Rope', 'Traveling Cable', 'Limit Switches', 'Sliding Roller Guides CWT', 'Counterweight & Sheave', 'Brakets & Rail', 'Separator Beams/Bracket', 'Induktor Van']
    },
    {
        id: 'car_cage', name: 'CAR CAGE', code: 'E',
        items: ['Condition of Interior', 'Car Operation Panel', 'Indicators / PC / Arrow', 'Car Light & Fan', 'Car Door Safety', 'Riding Comfort', 'Leveling', 'Interphone / Emergency Bell', 'Car Sill / Car Door', 'Emergency Light']
    },
    {
        id: 'pit', name: 'PIT', code: 'F',
        items: ['Pit Environment', 'Safety Switches', 'Safety Device', 'Load Weighing Switches', 'Tension Sheave Governoor', 'Compensating Sheave', 'Buffers Car / CWT', 'CWT Buffer Run by']
    }
];

const CONDITIONS = [
    { key: '✓', label: '✓', title: 'Normal' },
    { key: '△', label: '△', title: 'To be Adjusted, replaced, Lubricated, cleaned' },
    { key: '✕', label: '✕', title: 'To be Repaired or Overhauled' },
    { key: '○', label: '○', title: 'Serviced, Replaced, Lubricated & Cleaned' },
    { key: '/', label: '/', title: 'Not Applicable' },
];

function getInitialChecklist() {
    const initial = {};
    ELEVATOR_CHECKLIST.forEach(section => {
        section.items.forEach(item => {
            initial[`${section.id}_${item}`] = { condition: '', note: '' };
        });
    });
    return initial;
}

function getSaved(storageKey, field, fallback) {
    if (!storageKey) return fallback;
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed[field] !== undefined) return parsed[field];
        }
    } catch (e) { /* ignore */ }
    return fallback;
}

export default function ElevatorForm({ liftData, scheduleId, onSubmit, storageKey }) {
    const [checklist, setChecklist] = useState(() => getSaved(storageKey, 'checklist', getInitialChecklist()));
    const [building, setBuilding] = useState(() => getSaved(storageKey, 'building', liftData?.location || ''));
    const [elevatorNo, setElevatorNo] = useState(() => getSaved(storageKey, 'elevatorNo', liftData?.name || ''));
    const [temperature, setTemperature] = useState(() => getSaved(storageKey, 'temperature', ''));
    const [voltage, setVoltage] = useState(() => getSaved(storageKey, 'voltage', ''));
    const [remarks, setRemarks] = useState(() => getSaved(storageKey, 'remarks', ''));
    const [mechanics, setMechanics] = useState(() => getSaved(storageKey, 'mechanics', ['', '', '', '']));
    const [checkedBy, setCheckedBy] = useState(() => getSaved(storageKey, 'checkedBy', ''));

    // Auto-save to localStorage on every change
    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify({
                checklist, building, elevatorNo, temperature, voltage, remarks, mechanics, checkedBy
            }));
        }
    }, [checklist, building, elevatorNo, temperature, voltage, remarks, mechanics, checkedBy, storageKey]);

    const updateItem = (key, field, value) => {
        setChecklist(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    };

    const handleSubmit = () => {
        const data = {
            schedule_id: scheduleId,
            lift_id: liftData?.id,
            type: 'passenger',
            checklist_data: {
                sections: ELEVATOR_CHECKLIST.map(s => ({
                    ...s,
                    items: s.items.map(item => ({
                        name: item,
                        ...checklist[`${s.id}_${item}`]
                    }))
                })),
                building,
                elevatorNo,
                mechanics: mechanics.filter(m => m),
                checkedBy,
            },
            remarks,
            temperature,
            voltage,
        };
        onSubmit(data);
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-purple)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                    <Building2 size={20} style={{ verticalAlign: '-3px', marginRight: '8px' }} />Maintenance Service Report - Elevators
                </h3>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Name of Building</label>
                        <input className="form-input" value={building} onChange={e => setBuilding(e.target.value)} placeholder="Nama Gedung" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Elevator No.</label>
                        <input className="form-input" value={elevatorNo} onChange={e => setElevatorNo(e.target.value)} placeholder="EV-001" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date Service</label>
                        <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} readOnly />
                    </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <strong>Working Remarks:</strong>&nbsp;
                    ✓ Normal &nbsp;|&nbsp; △ Adjust/Replace/Lubricated &nbsp;|&nbsp; ✕ Repair/Overhaul &nbsp;|&nbsp; ○ Serviced/Replaced &nbsp;|&nbsp; / Not Applicable
                </div>
            </div>

            <div className="grid-2" style={{ gap: '16px' }}>
                {ELEVATOR_CHECKLIST.map(section => (
                    <div key={section.id} className="checklist-section card" style={{ marginBottom: 0 }}>
                        <div className="checklist-section-title" style={{ background: 'rgba(139,92,246,0.08)' }}>
                            <span className="num" style={{ background: 'var(--purple-600)' }}>{section.code}</span>
                            {section.name}
                        </div>
                        <table className="checklist-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', width: '10%' }}>#</th>
                                    <th style={{ textAlign: 'left', width: '50%' }}>Item</th>
                                    <th style={{ width: '40%' }}>Kondisi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {section.items.map((item, idx) => {
                                    const key = `${section.id}_${item}`;
                                    return (
                                        <tr key={key}>
                                            <td>{idx + 1}</td>
                                            <td style={{ fontSize: '13px' }}>{item}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {CONDITIONS.map(c => (
                                                        <label key={c.key} title={c.title} style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer',
                                                            fontSize: '14px', fontWeight: 600,
                                                            background: checklist[key]?.condition === c.key ? 'var(--accent-purple)' : 'var(--bg-glass)',
                                                            color: checklist[key]?.condition === c.key ? 'white' : 'var(--text-muted)',
                                                            border: `1px solid ${checklist[key]?.condition === c.key ? 'var(--accent-purple)' : 'var(--border-color)'}`,
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
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
                <h3 className="card-title" style={{ marginBottom: '16px' }}><Info size={16} style={{ verticalAlign: '-2px', marginRight: '6px' }} />Informasi Tambahan</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Temperature (°C)</label>
                        <input className="form-input" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="25" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Power Line Voltage (V)</label>
                        <input className="form-input" value={voltage} onChange={e => setVoltage(e.target.value)} placeholder="220" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea className="form-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Catatan tambahan..." />
                </div>
                <div>
                    <label className="form-label" style={{ marginBottom: '12px' }}>Mechanic</label>
                    <div className="form-row">
                        {mechanics.map((m, i) => (
                            <div className="form-group" key={i}>
                                <input className="form-input" value={m} onChange={e => { const newM = [...mechanics]; newM[i] = e.target.value; setMechanics(newM); }} placeholder={`Mechanic ${i + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Checked By</label>
                    <input className="form-input" value={checkedBy} onChange={e => setCheckedBy(e.target.value)} placeholder="Nama pemeriksa / supervisor" />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', marginBottom: '40px' }}>
                <button className="btn btn-success" onClick={handleSubmit} style={{ padding: '12px 32px', fontSize: '15px' }}>
                    <Save size={16} /> Simpan & Submit Laporan
                </button>
            </div>
        </div>
    );
}
