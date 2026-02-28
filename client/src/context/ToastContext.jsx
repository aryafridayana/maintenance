import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback({
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error', 5000),
        warning: (msg) => addToast(msg, 'warning', 4000),
        info: (msg) => addToast(msg, 'info'),
    }, [addToast]);

    // Fix: useCallback can't return an object, use useMemo-like pattern
    return (
        <ToastContext.Provider value={{ toast: { success: (msg) => addToast(msg, 'success'), error: (msg) => addToast(msg, 'error', 5000), warning: (msg) => addToast(msg, 'warning', 4000), info: (msg) => addToast(msg, 'info') } }}>
            {children}
            <div className="toast-container">
                {toasts.map(t => {
                    const Icon = ICONS[t.type];
                    return (
                        <div key={t.id} className={`toast toast-${t.type}`}>
                            <Icon size={18} className="toast-icon" />
                            <span className="toast-message">{t.message}</span>
                            <button className="toast-close" onClick={() => removeToast(t.id)}>
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx.toast;
}
