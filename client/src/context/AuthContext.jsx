import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && user) {
            api.get('/auth/profile')
                .then(res => {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                })
                .catch(() => {
                    logout();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isRole = (...roles) => user && roles.includes(user.role);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be within AuthProvider');
    return ctx;
}
