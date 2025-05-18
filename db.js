const mysql = require('mysql2');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = isProduction
  ? {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

    dbConfig.connectTimeout = 60000; // 60 detik

const pool = mysql.createPool(dbConfig);

// Coba koneksi awal
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Gagal koneksi ke database:', err.message);
    return;
  }

  console.log('✅ Koneksi pool berhasil dibuat, ID koneksi:', connection.threadId);

  connection.query('SELECT DATABASE() AS db_name', (err, results) => {
    if (err) {
      console.error('❌ Gagal mengambil nama database:', err.message);
    } else {
      console.log('📌 Terhubung ke database:', results[0].db_name);
    }
    connection.release(); // Penting! Kembalikan koneksi ke pool
  });
});

module.exports = pool;
