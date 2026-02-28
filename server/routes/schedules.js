const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/schedules
router.get('/', authenticateToken, (req, res) => {
    try {
        const { status, technician_id, date_from, date_to, lift_id } = req.query;
        let query = `
      SELECT s.*, l.name as lift_name, l.type as lift_type, l.cabang, l.merk,
             u.name as technician_name, u.phone as technician_phone,
             c.name as created_by_name
      FROM schedules s
      LEFT JOIN lifts l ON s.lift_id = l.id
      LEFT JOIN users u ON s.technician_id = u.id
      LEFT JOIN users c ON s.created_by = c.id
      WHERE 1=1
    `;
        const params = [];

        // Teknisi can only see their own schedules
        if (req.user.role === 'teknisi') {
            query += ' AND s.technician_id = ?';
            params.push(req.user.id);
        }

        if (status) { query += ' AND s.status = ?'; params.push(status); }
        if (technician_id) { query += ' AND s.technician_id = ?'; params.push(technician_id); }
        if (lift_id) { query += ' AND s.lift_id = ?'; params.push(lift_id); }
        if (date_from) { query += ' AND s.scheduled_date >= ?'; params.push(date_from); }
        if (date_to) { query += ' AND s.scheduled_date <= ?'; params.push(date_to); }

        query += ' ORDER BY s.scheduled_date DESC';
        const schedules = db.prepare(query).all(...params);
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/schedules/:id
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const schedule = db.prepare(`
      SELECT s.*, l.name as lift_name, l.type as lift_type, l.cabang, l.merk, l.model,
             u.name as technician_name, u.phone as technician_phone
      FROM schedules s
      LEFT JOIN lifts l ON s.lift_id = l.id
      LEFT JOIN users u ON s.technician_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);
        if (!schedule) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/schedules
router.post('/', authenticateToken, requireRole('superadmin', 'admin'), (req, res) => {
    try {
        const { lift_id, technician_id, scheduled_date, notes } = req.body;
        if (!lift_id || !technician_id || !scheduled_date) {
            return res.status(400).json({ error: 'Lift, teknisi, dan tanggal wajib diisi' });
        }

        const result = db.prepare(
            'INSERT INTO schedules (lift_id, technician_id, scheduled_date, notes, created_by) VALUES (?, ?, ?, ?, ?)'
        ).run(lift_id, technician_id, scheduled_date, notes || null, req.user.id);

        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/schedules/:id
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
        if (!schedule) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

        const { lift_id, technician_id, scheduled_date, status, notes } = req.body;
        db.prepare(
            'UPDATE schedules SET lift_id=?, technician_id=?, scheduled_date=?, status=?, notes=? WHERE id=?'
        ).run(
            lift_id || schedule.lift_id,
            technician_id || schedule.technician_id,
            scheduled_date || schedule.scheduled_date,
            status || schedule.status,
            notes !== undefined ? notes : schedule.notes,
            req.params.id
        );

        res.json({ message: 'Jadwal berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/schedules/:id
router.delete('/:id', authenticateToken, requireRole('superadmin', 'admin'), (req, res) => {
    try {
        const result = db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        res.json({ message: 'Jadwal berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
