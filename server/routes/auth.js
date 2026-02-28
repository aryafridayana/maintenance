const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password harus diisi' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
