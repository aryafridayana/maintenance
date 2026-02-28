const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticateToken, requireRole, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/qr/generate — Generate QR token for a lift (admin only)
router.post('/generate', authenticateToken, requireRole('superadmin', 'admin'), (req, res) => {
    try {
        const { lift_id } = req.body;
        if (!lift_id) {
            return res.status(400).json({ error: 'lift_id wajib diisi' });
        }

        const lift = db.prepare('SELECT * FROM lifts WHERE id = ?').get(lift_id);
        if (!lift) {
            return res.status(404).json({ error: 'Lift tidak ditemukan' });
        }

        // Check if active token already exists for this lift
        const existing = db.prepare('SELECT * FROM qr_tokens WHERE lift_id = ? AND active = 1').get(lift_id);
        if (existing) {
            return res.json({ token: existing.token, lift });
        }

        // Generate new token
        const token = crypto.randomBytes(16).toString('hex');
        db.prepare(
            'INSERT INTO qr_tokens (lift_id, token, created_by) VALUES (?, ?, ?)'
        ).run(lift_id, token, req.user.id);

        res.status(201).json({ token, lift });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/qr/validate/:token — Validate QR token (PUBLIC, no auth needed)
router.get('/validate/:token', (req, res) => {
    try {
        const { token } = req.params;

        const qrToken = db.prepare(`
            SELECT qt.*, l.name as lift_name, l.type as lift_type, l.merk, l.model,
                   l.cabang, l.location, l.floors
            FROM qr_tokens qt
            JOIN lifts l ON qt.lift_id = l.id
            WHERE qt.token = ? AND qt.active = 1
        `).get(token);

        if (!qrToken) {
            return res.status(404).json({ error: 'QR code tidak valid atau sudah tidak aktif' });
        }

        // Check expiry if set
        if (qrToken.expires_at && new Date(qrToken.expires_at) < new Date()) {
            return res.status(410).json({ error: 'QR code sudah kedaluwarsa' });
        }

        // Generate a temporary JWT for this session (limited permissions)
        const tempToken = jwt.sign(
            {
                id: 0,
                email: 'qr-access@liftcare.com',
                role: 'teknisi',
                name: 'QR Access',
                qr_access: true,
                lift_id: qrToken.lift_id
            },
            JWT_SECRET,
            { expiresIn: '4h' }
        );

        res.json({
            token: tempToken,
            lift: {
                id: qrToken.lift_id,
                name: qrToken.lift_name,
                type: qrToken.lift_type,
                merk: qrToken.merk,
                model: qrToken.model,
                cabang: qrToken.cabang,
                location: qrToken.location,
                floors: qrToken.floors
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
