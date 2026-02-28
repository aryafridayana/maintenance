const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/lifts
router.get('/', authenticateToken, (req, res) => {
    try {
        const { type, cabang, status } = req.query;
        let query = 'SELECT * FROM lifts WHERE 1=1';
        const params = [];

        if (type) { query += ' AND type = ?'; params.push(type); }
        if (cabang) { query += ' AND cabang LIKE ?'; params.push(`%${cabang}%`); }
        if (status) { query += ' AND status = ?'; params.push(status); }

        query += ' ORDER BY created_at DESC';
        const lifts = db.prepare(query).all(...params);
        res.json(lifts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/lifts/:id
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const lift = db.prepare('SELECT * FROM lifts WHERE id = ?').get(req.params.id);
        if (!lift) return res.status(404).json({ error: 'Lift tidak ditemukan' });
        res.json(lift);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/lifts
router.post('/', authenticateToken, requireRole('superadmin', 'admin'), (req, res) => {
    try {
        const { name, type, merk, model, cabang, location, floors } = req.body;
        if (!name || !type) {
            return res.status(400).json({ error: 'Nama dan tipe lift wajib diisi' });
        }

        const result = db.prepare(
            'INSERT INTO lifts (name, type, merk, model, cabang, location, floors) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(name, type, merk || null, model || null, cabang || null, location || null, floors || null);

        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/lifts/:id
router.put('/:id', authenticateToken, requireRole('superadmin', 'admin'), (req, res) => {
    try {
        const lift = db.prepare('SELECT * FROM lifts WHERE id = ?').get(req.params.id);
        if (!lift) return res.status(404).json({ error: 'Lift tidak ditemukan' });

        const { name, type, merk, model, cabang, location, floors, status } = req.body;
        db.prepare(
            'UPDATE lifts SET name=?, type=?, merk=?, model=?, cabang=?, location=?, floors=?, status=? WHERE id=?'
        ).run(
            name || lift.name, type || lift.type, merk !== undefined ? merk : lift.merk,
            model !== undefined ? model : lift.model, cabang !== undefined ? cabang : lift.cabang,
            location !== undefined ? location : lift.location, floors || lift.floors,
            status || lift.status, req.params.id
        );

        res.json({ message: 'Lift berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/lifts/:id
router.delete('/:id', authenticateToken, requireRole('superadmin', 'admin'), (req, res) => {
    try {
        const result = db.prepare('DELETE FROM lifts WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Lift tidak ditemukan' });
        res.json({ message: 'Lift berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
