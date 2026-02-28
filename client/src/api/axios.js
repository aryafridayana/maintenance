import axios from 'axios';

// In production, API is served from the same origin (no CORS needed)
// In development, use Vite proxy or localhost:3001
const baseURL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
