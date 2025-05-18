const express = require('express');
const router = express.Router();
const connection = require('../db'); 
const verifyToken = require('../middleware/verifyToken');

// Endpoint untuk ambil semua data absensi atau berdasarkan filter
/**
 * @swagger
 * /api/riwayat-absensi:
 *   get:
 *     summary: Ambil riwayat absensi siswa berdasarkan filter opsional
 *     tags:
 *       - Absensi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nis
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter berdasarkan NIS siswa
 *       - in: query
 *         name: nama_lengkap
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter berdasarkan nama lengkap siswa
 *       - in: query
 *         name: kelas
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter berdasarkan kelas siswa
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [hadir, izin, sakit, alpha]
 *         required: false
 *         description: Filter berdasarkan status kehadiran
 *       - in: query
 *         name: tanggal
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter berdasarkan tanggal absensi (format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data absensi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   nis:
 *                     type: string
 *                     example: "123456"
 *                   nama:
 *                     type: string
 *                     example: "Rina Setiawan"
 *                   kelas:
 *                     type: string
 *                     example: "XII IPA 1"
 *                   status_kehadiran:
 *                     type: string
 *                     example: "hadir"
 *                   keterangan:
 *                     type: string
 *                     example: "Tepat waktu"
 *                   tanggal:
 *                     type: string
 *                     format: date
 *                     example: "2024-05-16"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-05-16T07:00:00.000Z"
 *       500:
 *         description: Gagal mengambil data dari server
 */
router.get('/', verifyToken, (req, res) => {
    const { nis, nama_lengkap, kelas, status, tanggal } = req.query;

    let query = 'SELECT * FROM absen_siswa WHERE 1=1';
    const params = [];

    if (nis) {
        query += ' AND nis = ?';
        params.push(nis);
    }
    if (nama_lengkap) {
        query += ' AND nama = ?';
        params.push(nama_lengkap);
    }
    if (kelas) {
        query += ' AND kelas = ?';
        params.push(kelas);
    }

    if (status) {
        query += ' AND status_kehadiran = ?';
        params.push(status);
    }

    if (tanggal) {
        query += ' AND tanggal = ?';
        params.push(tanggal);
    }

    connection.query(query, params, (error, results) => {
        if (error) {
            console.error('Gagal mengambil data:', error);
            return res.status(500).json({ error: 'Gagal mengambil data' });
        }

        res.json(results);
    });
});

module.exports = router; // ->  mengekspor objek router agar dapat digunakan (diimpor) 
