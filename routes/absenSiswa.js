const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// GET /api/absen/siswa
/**
 * @swagger
 * /api/absen/siswa:
 *   get:
 *     summary: Ambil daftar siswa aktif
 *     tags:
 *       - Absensi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kelas
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter berdasarkan kelas
 *     responses:
 *       200:
 *         description: Daftar siswa aktif berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nis:
 *                         type: string
 *                         example: "12345"
 *                       nama:
 *                         type: string
 *                         example: "Budi Santoso"
 *                       kelas:
 *                         type: string
 *                         example: "10A"
 *                       status:
 *                         type: string
 *                         example: "Aktif"
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/siswa', verifyToken, (req, res) => {
  const { kelas } = req.query;

  // query mengambil semua siswa aktif
  let query = `SELECT 
    nis, 
    nama_lengkap AS nama,
    kelas,
    status
   FROM tambah_siswa 
   WHERE status = 'Aktif'`;
  
  let params = [];

  // Jika kelas disediakan, tambahkan filter kelas
  if (kelas) {
    query += ' AND kelas = ?';
    params.push(kelas);
  }

  db.query(query, params, (err, rows) => {
    if (err) {
      console.error('ERROR:', err);
      return res.status(500).json({
        success: false,
        error: 'Terjadi kesalahan server',
        detail: err.message
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

// POST /api/absen/tambah 
/**
 * @swagger
 * /api/absen/tambah:
 *   post:
 *     summary: Tambah data absensi siswa
 *     tags:
 *       - Absensi
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tanggal
 *               - absensi
 *             properties:
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-17"
 *               absensi:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - nis
 *                     - nama
 *                     - kelas
 *                     - status
 *                   properties:
 *                     nis:
 *                       type: string
 *                       example: "12345"
 *                     nama:
 *                       type: string
 *                       example: "Siti Aminah"
 *                     kelas:
 *                       type: string
 *                       example: "10B"
 *                     status:
 *                       type: string
 *                       enum: [hadir, izin, sakit, alpha]
 *                     keterangan:
 *                       type: string
 *                       example: "Terlambat masuk"
 *     responses:
 *       200:
 *         description: Data absensi berhasil disimpan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "20 data tersimpan"
 *       400:
 *         description: Data yang dikirim tidak valid
 *       500:
 *         description: Terjadi kesalahan server saat menyimpan data
 */
router.post('/tambah', verifyToken, (req, res) => {
  console.log('Received attendance data:', JSON.stringify(req.body, null, 2));
  
  const { tanggal, absensi } = req.body;

  if (!tanggal) {
    console.error('Tanggal is empty or invalid:', tanggal);
    return res.status(400).json({
      success: false,
      error: 'Tanggal tidak valid'
    });
  }

  if (!absensi || !Array.isArray(absensi) || absensi.length === 0) {
    console.error('Absensi is empty or invalid:', absensi);
    return res.status(400).json({
      success: false,
      error: 'Data absensi tidak lengkap'
    });
  }

  // Validasi format tanggal
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(tanggal)) {
    console.error('Invalid date format:', tanggal);
    return res.status(400).json({
      success: false,
      error: 'Format tanggal harus YYYY-MM-DD'
    });
  }

  // Periksa struktur data absensi
  const validStatuses = ['hadir', 'izin', 'sakit', 'alpha'];
  for (let i = 0; i < absensi.length; i++) {
    const a = absensi[i];
    if (!a.nis || !a.nama || !a.kelas || !validStatuses.includes(a.status)) {
      console.error('Invalid attendance data at index', i, ':', a);
      return res.status(400).json({
        success: false,
        error: `Data absensi tidak valid pada baris ${i+1}`
      });
    }
  }

  // Mulai transaksi menggunakan koneksi langsung
  db.beginTransaction(err => {
    if (err) {
      console.error('Begin transaction error:', err);
      return res.status(500).json({
        success: false,
        error: 'Gagal memulai transaksi',
        detail: err.message
      });
    }
    
    // Verifikasi tabel absen_siswa ada atau tidak
    db.query('SHOW TABLES LIKE "absen_siswa"', (err, tables) => {
      if (err) {
        return db.rollback(() => {
          console.error('Table check error:', err);
          res.status(500).json({
            success: false,
            error: 'Gagal memeriksa tabel',
            detail: err.message
          });
        });
      }

      //ini kalau jika tabel tidak ada, buat tabel
      if (tables.length === 0) {
        const createTable = `
          CREATE TABLE absen_siswa (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nis VARCHAR(20) NOT NULL,
            nama VARCHAR(100) NOT NULL,
            kelas VARCHAR(10) NOT NULL,
            status_kehadiran ENUM('hadir', 'izin', 'sakit', 'alpha') NOT NULL,
            keterangan TEXT,
            tanggal DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(tanggal),
            INDEX(nis)
          )
        `;
        
        db.query(createTable, (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Create table error:', err);
              res.status(500).json({
                success: false,
                error: 'Gagal membuat tabel absen_siswa',
                detail: err.message
              });
            });
          }          
          processAttendance();
        });
      } else {
        // Tabel sudah ada, langsung proses
        processAttendance();
      }
    });

    function processAttendance() {
      // Hapus data lama untuk kelas dan tanggal tersebut
      db.query(
        'DELETE FROM absen_siswa WHERE tanggal = ? AND kelas = ?',
        [tanggal, absensi[0].kelas],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Delete old data error:', err);
              res.status(500).json({
                success: false,
                error: 'Gagal menghapus data lama',
                detail: err.message
              });
            });
          }

          // Siapkan values untuk insert
          const values = absensi.map(siswa => [
            siswa.nis,
            siswa.nama,
            siswa.kelas,
            siswa.status,
            siswa.keterangan || null,
            tanggal
          ]);
          
          console.log('Inserting values:', values);

          let successCount = 0;
          let errors = [];

          function insertNextRow(index) {
            if (index >= values.length) {
              // Semua baris selesai diproses
              if (errors.length > 0) {
                return db.rollback(() => {
                  console.error('Errors during insertion:', errors);
                  res.status(500).json({
                    success: false,
                    error: `Gagal menyimpan beberapa data absensi: ${errors.join(', ')}`,
                    detail: errors[0]
                  });
                });
              } else {
                // Commit transaksi jika semua berhasil
                db.commit(err => {
                  if (err) {
                    return db.rollback(() => {
                      console.error('Commit error:', err);
                      res.status(500).json({
                        success: false,
                        error: 'Gagal commit transaksi',
                        detail: err.message
                      });
                    });
                  }

                  console.log(`Absensi saved successfully: ${successCount} records`);
                  res.json({
                    success: true,
                    message: `${successCount} data tersimpan`
                  });
                });
              }
              return;
            }

            const row = values[index];
            db.query(
              `INSERT INTO absen_siswa 
               (nis, nama, kelas, status_kehadiran, keterangan, tanggal) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              row,
              (err) => {
                if (err) {
                  console.error(`Error inserting row ${index}:`, err);
                  errors.push(`Baris ${index+1}: ${err.message}`);
                } else {
                  successCount++;
                }
                
                // Proses baris berikutnya
                insertNextRow(index + 1);
              }
            );
          }
          insertNextRow(0);
        }
      );
    }
  });
});

module.exports = router; // ->  mengekspor objek router agar dapat digunakan (diimpor) 