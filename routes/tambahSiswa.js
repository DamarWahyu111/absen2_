const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

/**
 * @swagger
 * /api/siswa/tambah:
 *   post:
 *     summary: Tambahkan data siswa
 *     tags: [Siswa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nis
 *               - nama_lengkap
 *               - kelas
 *               - jenis_kelamin
 *               - tanggal_lahir
 *             properties:
 *               nis:
 *                 type: string
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
 *                 format: date
 *               nama_orangtua:
 *                 type: string
 *               no_telepon_orangtua:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Siswa berhasil ditambahkan
 *       400:
 *         description: Validasi gagal
 *       500:
 *         description: Kesalahan server
 */

router.post('/tambah', verifyToken, (req, res) => {
  const data = req.body;

  // validasi check tanggal lahir -> hanya 2005-2010
  const tanggalLahir = new Date(data.tanggal_lahir);
  const tahunLahir = tanggalLahir.getFullYear();
  
  if (tahunLahir < 2005 || tahunLahir > 2010) {
    return res.status(400).json({ 
      error: 'Validasi gagal', 
      message: 'Tahun kelahiran harus antara 2005-2010' 
    });
  }
  const sql = `INSERT INTO tambah_siswa 
  (nis, nama_lengkap, kelas, jenis_kelamin, alamat, no_telepon, tempat_lahir, tanggal_lahir, nama_orangtua, no_telepon_orangtua, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    data.nis,
    data.nama_lengkap,
    data.kelas,
    data.jenis_kelamin,
    data.alamat,
    data.no_telepon,
    data.tempat_lahir,
    data.tanggal_lahir,
    data.nama_orangtua,
    data.no_telepon_orangtua,
    data.status
  ];
  
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Mengirimkan response dengan data siswa yang baru disimpan
    res.status(201).json({
      message: 'Siswa berhasil ditambahkan!',
      siswa: {
        id: result.insertId,
        nis: data.nis,
        nama: data.nama_lengkap,
        kelas: data.kelas,
        jenis_kelamin: data.jenis_kelamin,
        status: data.status
      }
    });
  });
});

// buat di postman api/siswa
/**
 * @swagger
 * /api/siswa:
 *   get:
 *     summary: Ambil semua data siswa
 *     tags: [Siswa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data siswa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nis:
 *                     type: string
 *                   nama_lengkap:
 *                     type: string
 *                   kelas:
 *                     type: string
 *                   jenis_kelamin:
 *                     type: string
 *                   alamat:
 *                     type: string
 *                   tanggal_lahir:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *       500:
 *         description: Kesalahan server
 */

router.get('/', verifyToken, (req, res) => {
    // Query untuk mengambil seluruh data siswa dari tabel tambah_siswa
    const query = 'SELECT * FROM tambah_siswa';

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
        }
        const formattedResults = results.map(siswa => {
            if (siswa.tanggal_lahir) {
                siswa.tanggal_lahir = new Date(siswa.tanggal_lahir).toISOString().split('T')[0];
            }
            return siswa;
        });

        // Kirimkan hasil query sebagai respons JSON
        res.json(results);
    });
});

console.log("📦 Server running");

router.get('/:nis', (req, res) => {
    console.log('✅ Route /:nis terpanggil!');
    const nis = req.params.nis;
    console.log('🔍 NIS:', nis);

    const query = 'SELECT * FROM tambah_siswa WHERE nis = ?';
    db.query(query, [nis], (err, results) => {
        if (err) {
            console.error('❌ Query error:', err);
            return res.status(500).json({ error: 'Database error', detail: err });
        }

        if (results.length === 0) {
            console.log('⚠️ Data siswa tidak ditemukan');
            return res.status(404).json({ message: 'Data siswa tidak ditemukan' });
        }
        results[0].tanggal_lahir = new Date(results[0].tanggal_lahir).toISOString().split('T')[0];

        console.log('✅ Data ditemukan:', results[0]);
        res.json(results[0]);
    });
});

module.exports = router; // ->  mengekspor objek router agar dapat digunakan (diimpor) 
