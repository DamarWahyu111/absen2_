// const express = require('express');
// const router = express.Router();
// const dbConfig = require('../db'); // config koneksi db
// const verifyToken = require('../middleware/verifyToken');

// /**
//  * @swagger
//  * /api/absen_siswa/{nis}:
//  *   get:
//  *     summary: Mendapatkan data absensi siswa berdasarkan NIS
//  *     tags:
//  *       - Absen Siswa
//  *     parameters:
//  *       - in: path
//  *         name: nis
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: NIS siswa yang ingin diambil datanya
//  *     responses:
//  *       200:
//  *         description: Daftar data absensi siswa
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   tanggal:
//  *                     type: string
//  *                     example: "2025-05-18"
//  *                   nis:
//  *                     type: string
//  *                     example: "20012012111"
//  *                   nama:
//  *                     type: string
//  *                     example: "Budi Santoso"
//  *                   kelas:
//  *                     type: string
//  *                     example: "12 IPA 1"
//  *                   status:
//  *                     type: string
//  *                     example: "Hadir"
//  *                   keterangan:
//  *                     type: string
//  *                     example: "Tepat waktu"
//  *       500:
//  *         description: Server error saat mengambil data absen
//  */

// router.get('/:nis', verifyToken, (req, res) => {
//   const nis = req.params.nis;

//   connection.query(
//     'SELECT tanggal, nis, nama, kelas, status_kehadiran, keterangan FROM absen_siswa WHERE nis = ? ORDER BY tanggal DESC',
//     [nis],
//     (error, results) => {
//       if (error) {
//         console.error('Error saat mengambil data absen:', error);
//         return res.status(500).json({ message: 'Server error saat mengambil data absen' });
//       }
//       res.json(results);
//     }
//   );
// });

// module.exports = router;