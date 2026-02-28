const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — List all users
router.get('/', authenticateToken, requireRole('superadmin', 'admin'), (req, res) => {
    try {
        const { role, active } = req.query;
        let query = 'SELECT id, name, email, role, phone, active, created_at FROM users WHERE 1=1';
        const params = [];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }
        if (active !== undefined) {
            query += ' AND active = ?';
            params.push(parseInt(active));
        }

        query += ' ORDER BY created_at DESC';
        const users = db.prepare(query).all(...params);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, phone, active, created_at FROM users WHERE id = ?').get(req.params.id);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users — Create user
router.post('/', authenticateToken, requireRole('superadmin'), (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email sudah terdaftar' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = db.prepare(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)'
        ).run(name, email, hashedPassword, role, phone || null);

        res.status(201).json({ id: result.lastInsertRowid, name, email, role, phone });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id — Update user
router.put('/:id', authenticateToken, requireRole('superadmin'), (req, res) => {
    try {
        const { name, email, password, role, phone, active } = req.body;
        const userId = req.params.id;

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

        let query = 'UPDATE users SET name = ?, email = ?, role = ?, phone = ?, active = ?';
        const params = [
            name || user.name,
            email || user.email,
            role || user.role,
            phone !== undefined ? phone : user.phone,
            active !== undefined ? active : user.active
        ];

        if (password) {
            query += ', password = ?';
            params.push(bcrypt.hashSync(password, 10));
        }

        query += ' WHERE id = ?';
        params.push(userId);

        db.prepare(query).run(...params);
        res.json({ message: 'User berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', authenticateToken, requireRole('superadmin'), (req, res) => {
    try {
        const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ message: 'User berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
