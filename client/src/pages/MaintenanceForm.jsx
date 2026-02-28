import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CargoLiftForm from '../components/Forms/CargoLiftForm';
import ElevatorForm from '../components/Forms/ElevatorForm';
import { ClipboardEdit } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function MaintenanceForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const scheduleId = searchParams.get('schedule');
    const liftId = searchParams.get('lift');
    const [liftData, setLiftData] = useState(null);
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('');
    const [lifts, setLifts] = useState([]);

    // Storage key for auto-save based on schedule or lift
    const storageKey = scheduleId ? `maintenance_form_schedule_${scheduleId}` : liftId ? `maintenance_form_lift_${liftId}` : null;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (scheduleId) {
                    const sRes = await api.get(`/schedules/${scheduleId}`);
                    setScheduleData(sRes.data);
                    const lRes = await api.get(`/lifts/${sRes.data.lift_id}`);
                    setLiftData(lRes.data);
                    setSelectedType(lRes.data.type);

                    // Auto-update schedule to in_progress when technician opens the form
                    if (sRes.data.status === 'scheduled') {
                        try {
                            await api.put(`/schedules/${scheduleId}`, { status: 'in_progress' });
                        } catch (e) {
                            console.error('Failed to update schedule status', e);
                        }
                    }
                } else if (liftId) {
                    const lRes = await api.get(`/lifts/${liftId}`);
                    setLiftData(lRes.data);
                    setSelectedType(lRes.data.type);
                } else {
                    const lRes = await api.get('/lifts');
                    setLifts(lRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [scheduleId, liftId]);

    const handleSelectLift = async (id) => {
        const lRes = await api.get(`/lifts/${id}`);
        setLiftData(lRes.data);
        setSelectedType(lRes.data.type);
    };

    const handleSubmit = async (data) => {
        try {
            await api.post('/reports', data);
            // Clear saved form data from localStorage after successful submit
            if (storageKey) {
                localStorage.removeItem(storageKey);
            }
            toast.success('Laporan berhasil disimpan!');
            navigate('/reports');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Gagal menyimpan laporan');
        }
    };

    if (loading) return <div className="page-content"><div className="empty-state"><p>Memuat...</p></div></div>;

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <div>
                    <h2><ClipboardEdit size={20} style={{ verticalAlign: '-3px', marginRight: '8px' }} />Form Maintenance</h2>
                    <p>{liftData ? `${liftData.name} - ${liftData.cabang}` : 'Pilih lift untuk mulai'}</p>
                </div>
            </div>

            {!liftData && (
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>Pilih Lift</h3>
                    <div className="form-group">
                        <select className="form-select" onChange={e => e.target.value && handleSelectLift(e.target.value)}>
                            <option value="">-- Pilih lift untuk maintenance --</option>
                            {lifts.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.name} ({l.type === 'cargo' ? 'Cargo Lift' : 'Elevator'}) - {l.cabang}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {liftData && selectedType === 'cargo' && (
                <CargoLiftForm liftData={liftData} scheduleId={scheduleId} onSubmit={handleSubmit} storageKey={storageKey} />
            )}
            {liftData && selectedType === 'passenger' && (
                <ElevatorForm liftData={liftData} scheduleId={scheduleId} onSubmit={handleSubmit} storageKey={storageKey} />
            )}
        </div>
    );
}

