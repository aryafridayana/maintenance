const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');

// Load .env from project root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ========== SECURITY MIDDLEWARE ==========
// Trust proxy (for deployment behind nginx/cloudflare)
if (isProduction) {
    app.set('trust proxy', 1);
}

// CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN || (isProduction ? false : 'http://localhost:5173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (isProduction) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Simple rate limiter (in-memory)
const rateLimit = {};
app.use('/api/auth/login', (req, res, next) => {
    if (req.method !== 'POST') return next();
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    if (!rateLimit[ip]) rateLimit[ip] = [];
    rateLimit[ip] = rateLimit[ip].filter(t => now - t < 60000); // 1 minute window
    if (rateLimit[ip].length >= 10) {
        return res.status(429).json({ error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' });
    }
    rateLimit[ip].push(now);
    next();
});

// ========== DATABASE ==========
initializeDatabase();

// ========== API ROUTES ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/lifts', require('./routes/lifts'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()) + 's'
    });
});

// ========== SERVE FRONTEND (Production) ==========
if (isProduction) {
    const clientDist = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDist, {
        maxAge: '7d',
        etag: true,
    }));

    // SPA fallback - serve index.html for client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    if (!isProduction) console.error(err.stack);
    res.status(500).json({ error: isProduction ? 'Internal Server Error' : err.message });
});

// ========== START ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LiftCare API running on port ${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});
