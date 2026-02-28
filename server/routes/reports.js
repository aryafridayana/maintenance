const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/stats — Dashboard statistics
router.get('/stats', authenticateToken, (req, res) => {
    try {
        const totalLifts = db.prepare('SELECT COUNT(*) as count FROM lifts WHERE status = ?').get('active');
        const totalSchedules = db.prepare('SELECT COUNT(*) as count FROM schedules').get();
        const pendingSchedules = db.prepare("SELECT COUNT(*) as count FROM schedules WHERE status IN ('scheduled','in_progress')").get();
        const completedSchedules = db.prepare("SELECT COUNT(*) as count FROM schedules WHERE status = 'completed'").get();
        const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get();
        const totalTechnicians = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teknisi' AND active = 1").get();

        // Monthly stats
        const monthlyReports = db.prepare(`
      SELECT strftime('%Y-%m', completed_at) as month, COUNT(*) as count
      FROM reports
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all();

        // Recent reports
        const recentReports = db.prepare(`
      SELECT r.*, l.name as lift_name, l.type as lift_type, l.cabang,
             u.name as technician_name
      FROM reports r
      LEFT JOIN lifts l ON r.lift_id = l.id
      LEFT JOIN users u ON r.technician_id = u.id
      ORDER BY r.completed_at DESC
      LIMIT 5
    `).all();

        // Upcoming schedules
        const upcomingSchedules = db.prepare(`
      SELECT s.*, l.name as lift_name, l.type as lift_type, l.cabang,
             u.name as technician_name
      FROM schedules s
      LEFT JOIN lifts l ON s.lift_id = l.id
      LEFT JOIN users u ON s.technician_id = u.id
      WHERE s.status IN ('scheduled','in_progress')
        AND s.scheduled_date > date('now')
      ORDER BY s.scheduled_date ASC
      LIMIT 5
    `).all();

        res.json({
            totalLifts: totalLifts.count,
            totalSchedules: totalSchedules.count,
            pendingSchedules: pendingSchedules.count,
            completedSchedules: completedSchedules.count,
            totalReports: totalReports.count,
            totalTechnicians: totalTechnicians.count,
            monthlyReports,
            recentReports,
            upcomingSchedules
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports
router.get('/', authenticateToken, (req, res) => {
    try {
        const { type, technician_id, lift_id, date_from, date_to } = req.query;
        let query = `
      SELECT r.*, l.name as lift_name, l.type as lift_type, l.cabang, l.merk, l.model,
             u.name as technician_name
      FROM reports r
      LEFT JOIN lifts l ON r.lift_id = l.id
      LEFT JOIN users u ON r.technician_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (req.user.role === 'teknisi') {
            query += ' AND r.technician_id = ?';
            params.push(req.user.id);
        }

        if (type) { query += ' AND r.type = ?'; params.push(type); }
        if (technician_id) { query += ' AND r.technician_id = ?'; params.push(technician_id); }
        if (lift_id) { query += ' AND r.lift_id = ?'; params.push(lift_id); }
        if (date_from) { query += ' AND r.completed_at >= ?'; params.push(date_from); }
        if (date_to) { query += ' AND r.completed_at <= ?'; params.push(date_to); }

        query += ' ORDER BY r.completed_at DESC';
        const reports = db.prepare(query).all(...params);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/:id
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const report = db.prepare(`
      SELECT r.*, l.name as lift_name, l.type as lift_type, l.cabang, l.merk, l.model, l.location,
             u.name as technician_name, u.phone as technician_phone
      FROM reports r
      LEFT JOIN lifts l ON r.lift_id = l.id
      LEFT JOIN users u ON r.technician_id = u.id
      WHERE r.id = ?
    `).get(req.params.id);
        if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

        // Parse checklist_data from JSON string
        if (report.checklist_data) {
            report.checklist_data = JSON.parse(report.checklist_data);
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reports — Submit maintenance report
router.post('/', authenticateToken, (req, res) => {
    try {
        const { schedule_id, lift_id, type, checklist_data, remarks, temperature, voltage,
            technician_sign, manager_sign, customer_sign } = req.body;

        if (!lift_id || !type || !checklist_data) {
            return res.status(400).json({ error: 'Data lift, tipe, dan checklist wajib diisi' });
        }

        const techId = req.user.id === 0 ? null : req.user.id;
        const result = db.prepare(`
      INSERT INTO reports (schedule_id, lift_id, technician_id, type, checklist_data,
        remarks, temperature, voltage, technician_sign, manager_sign, customer_sign)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            schedule_id || null, lift_id, techId, type,
            JSON.stringify(checklist_data),
            remarks || null, temperature || null, voltage || null,
            technician_sign || null, manager_sign || null, customer_sign || null
        );

        // Update schedule status to completed if schedule_id provided
        if (schedule_id) {
            db.prepare("UPDATE schedules SET status = 'completed' WHERE id = ?").run(schedule_id);
        }

        res.status(201).json({ id: result.lastInsertRowid, message: 'Laporan berhasil disimpan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
