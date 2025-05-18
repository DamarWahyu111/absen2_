const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

/**
 * @swagger
 * /api/update/{nis}:
 *   put:
 *     summary: Update data siswa berdasarkan NIS
 *     tags:
 *       - Siswa
 *     parameters:
 *       - in: path
 *         name: nis
 *         required: true
 *         schema:
 *           type: string
 *         description: Nomor Induk Siswa (NIS)
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
 *                 format: date
 *               nama_orangtua:
 *                 type: string
 *               no_telepon_orangtua:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data siswa berhasil diperbarui
 *       404:
 *         description: Data siswa tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.put('/:nis', verifyToken, (req, res) => {
    const nis = req.params.nis;
    const updatedData = req.body;

    console.log(`Permintaan update data siswa untuk NIS: ${nis}`);
    console.log('Data yang akan diupdate:', updatedData);

    // Cek apakah data siswa ada di tambah_siswa
    const checkQuery = `SELECT * FROM tambah_siswa WHERE nis = ?`;

    db.query(checkQuery, [nis], (err, results) => {
        if (err) return res.status(500).json({ error: 'DB error saat cek tambah_siswa', detail: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Data siswa tidak ditemukan' });

        // Cek apakah sudah ada di update_siswa
        const checkUpdate = `SELECT * FROM update_siswa WHERE nis = ?`;

        db.query(checkUpdate, [nis], (checkErr, checkResults) => {
            if (checkErr) return res.status(500).json({ error: 'DB error saat cek update_siswa', detail: checkErr.message });

            let queryUpdateSiswa, params;
            if (checkResults.length > 0) {
                // Update existing record di update_siswa
                queryUpdateSiswa = `
                    UPDATE update_siswa SET 
                        nama_lengkap = ?, kelas = ?, jenis_kelamin = ?, alamat = ?,
                        no_telepon = ?, tempat_lahir = ?, tanggal_lahir = ?,
                        nama_orangtua = ?, no_telepon_orangtua = ?, status = ?
                    WHERE nis = ?
                `;
                params = [
                    updatedData.nama_lengkap, updatedData.kelas, updatedData.jenis_kelamin, updatedData.alamat,
                    updatedData.no_telepon, updatedData.tempat_lahir, updatedData.tanggal_lahir,
                    updatedData.nama_orangtua, updatedData.no_telepon_orangtua, updatedData.status, nis
                ];
            } else {
                // Insert baru ke update_siswa
                queryUpdateSiswa = `
                    INSERT INTO update_siswa (
                        nis, nama_lengkap, kelas, jenis_kelamin, alamat,
                        no_telepon, tempat_lahir, tanggal_lahir,
                        nama_orangtua, no_telepon_orangtua, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                params = [
                    nis, updatedData.nama_lengkap, updatedData.kelas, updatedData.jenis_kelamin, updatedData.alamat,
                    updatedData.no_telepon, updatedData.tempat_lahir, updatedData.tanggal_lahir,
                    updatedData.nama_orangtua, updatedData.no_telepon_orangtua, updatedData.status
                ];
            }

            // Jalankan query update_siswa dulu
            db.query(queryUpdateSiswa, params, (updateErr, updateResult) => {
                if (updateErr) return res.status(500).json({ error: 'Gagal update update_siswa', detail: updateErr.message });

                // Setelah sukses, update juga ke tabel tambah_siswa
                const updateTambahQuery = `
                    UPDATE tambah_siswa SET 
                        nama_lengkap = ?, kelas = ?, jenis_kelamin = ?, alamat = ?,
                        no_telepon = ?, tempat_lahir = ?, tanggal_lahir = ?,
                        nama_orangtua = ?, no_telepon_orangtua = ?, status = ?
                    WHERE nis = ?
                `;
                const tambahParams = [
                    updatedData.nama_lengkap, updatedData.kelas, updatedData.jenis_kelamin, updatedData.alamat,
                    updatedData.no_telepon, updatedData.tempat_lahir, updatedData.tanggal_lahir,
                    updatedData.nama_orangtua, updatedData.no_telepon_orangtua, updatedData.status, nis
                ];

                db.query(updateTambahQuery, tambahParams, (tambahErr, tambahResult) => {
                    if (tambahErr) return res.status(500).json({ error: 'Gagal update tambah_siswa', detail: tambahErr.message });

                    res.json({
                        message: 'Data siswa berhasil diupdate ke kedua tabel',
                        updatedNis: nis,
                        updateSiswaAffected: updateResult.affectedRows,
                        tambahSiswaAffected: tambahResult.affectedRows
                    });
                });
            });
        });
    });
});

module.exports = router; // ->  mengekspor objek router agar dapat digunakan (diimpor) 
