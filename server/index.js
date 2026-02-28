// Load .env FIRST (before any other config)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ========== SECURITY MIDDLEWARE ==========
// Trust proxy (for deployment behind nginx/cloudflare)
if (isProduction) {
    app.set('trust proxy', 1);
}

// CORS — handle wildcard + credentials conflict
const allowedOrigin = process.env.CORS_ORIGIN || (isProduction ? false : 'http://localhost:5173');
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigin === '*' || allowedOrigin === origin) {
            return callback(null, true);
        }
        // Support comma-separated origins
        if (typeof allowedOrigin === 'string' && allowedOrigin.includes(',')) {
            const origins = allowedOrigin.split(',').map(o => o.trim());
            if (origins.includes(origin)) {
                return callback(null, true);
            }
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: allowedOrigin !== '*',
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
try {
    initializeDatabase();
    console.log('✅ Database connected successfully');
} catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
}

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

// API 404 handler — must be BEFORE SPA fallback
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
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
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LiftCare API running on port ${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
    console.log(`   CORS Origin: ${allowedOrigin}`);
    console.log(`   Credentials: ${allowedOrigin !== '*'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('🛑 Server closed.');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});
