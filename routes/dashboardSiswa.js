const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// Ambil data dari tabel tambah_siswa untuk dashboard
/**
 * @swagger
 * /api/dashboard-siswa:
 *   get:
 *     summary: Get data siswa untuk dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nis:
 *                         type: string
 *                       nama:
 *                         type: string
 *                       kelas:
 *                         type: string
 *                       jenis_kelamin:
 *                         type: string
 *                       status:
 *                         type: string
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id; // dari token
  db.query('SELECT * FROM tambah_siswa', [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Gagal mengambil data siswa' });
    res.status(200).json({ success: true, data: results });
  });
});

/**
 * @swagger
 * /api/dashboard-siswa/{nis}:
 *   put:
 *     summary: Update data siswa berdasarkan NIS
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nis
 *         required: true
 *         schema:
 *           type: string
 *         description: NIS siswa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_lengkap:
 *                 type: string
 *               kelas:
 *                 type: string
 *               jenis_kelamin:
 *                 type: string
 *               alamat:
 *                 type: string
 *               no_telepon:
 *                 type: string
 *               tempat_lahir:
 *                 type: string
 *               tanggal_lahir:
 *                 type: string
 *               nama_orangtua:
 *                 type: string
 *               no_telepon_orangtua:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Update berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 affectedRows:
 *                   type: number
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.put('/:nis', verifyToken, (req, res) => {
    const nis = req.params.nis;
    const data = req.body;

    const updateQuery = `
        UPDATE tambah_siswa SET 
            nama_lengkap = ?, kelas = ?, jenis_kelamin = ?, alamat = ?, 
            no_telepon = ?, tempat_lahir = ?, tanggal_lahir = ?, 
            nama_orangtua = ?, no_telepon_orangtua = ?, status = ? 
        WHERE nis = ?
    `;

    const values = [
        data.nama_lengkap, data.kelas, data.jenis_kelamin, data.alamat,
        data.no_telepon, data.tempat_lahir, data.tanggal_lahir,
        data.nama_orangtua, data.no_telepon_orangtua, data.status,
        nis
    ];

    db.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error('Error saat update:', err);
            return res.status(500).json({ message: 'Gagal update', detail: err.message });
        }

        res.json({ message: 'Update berhasil', affectedRows: result.affectedRows });
    });
});

/**
 * @swagger
 * /api/dashboard-siswa/{nis}:
 *   delete:
 *     summary: Hapus data siswa berdasarkan NIS
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nis
 *         required: true
 *         schema:
 *           type: string
 *         description: NIS siswa
 *     responses:
 *       200:
 *         description: Siswa berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Siswa tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */

router.delete('/:nis', verifyToken, (req, res) => {
  const { nis } = req.params;
  const query = 'DELETE FROM tambah_siswa WHERE nis = ?';
  
  db.query(query, [nis], (err, results) => {
      if (err) {
          console.error('Error saat menghapus siswa:', err);
          return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
      }
      
      if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'Siswa tidak ditemukan' });
      }
      
      res.status(200).json({ message: 'Siswa berhasil dihapus' });
  });
});

module.exports = router; // ->  mengekspor objek router agar dapat digunakan (diimpor) 
