const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//Untuk bagian TOKEN JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '30d';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autentikasi pengguna
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token diperlukan untuk autentikasi'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau kadaluwarsa'
    });
  }
};

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Ambil semua data pengguna
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Berhasil mengambil data pengguna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       fullname:
 *                         type: string
 *                       email:
 *                         type: string
 *                       username:
 *                         type: string
 *                       role:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Terjadi kesalahan server
 */
router.get('/users', (req, res) => {
  db.query('SELECT id, fullname, email, username, role, created_at FROM users', (err, results) => {
    if (err) {
      console.error('Error ambil data users:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengguna',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    return res.status(200).json({
      success: true,
      users: results
    });
  });
});

// Register 
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register pengguna baru
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - username
 *               - password
 *               - role
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registrasi berhasil
 *       400:
 *         description: Data tidak lengkap atau sudah digunakan
 *       500:
 *         description: Kesalahan server
 */
router.post('/register', (req, res) => {
  const { fullname, email, username, password, role } = req.body;
  // Input validation
  if (!fullname || !email || !username || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Semua field harus diisi'
    });
  }
  // Username availabilty check
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, usernameRows) => {
    if (err) {
      console.error('Registration error:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (usernameRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username sudah terdaftar'
      });
    }

    // Email availability check
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailRows) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan pada server',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      if (emailRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }
      //bagian hash password di database tabel users
      bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          console.error('Password hashing error:', hashErr);
          return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: process.env.NODE_ENV === 'development' ? hashErr.message : undefined
          });
        }

        const newUser = {
          fullname,
          email,
          username,
          password: hashedPassword,
          role,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')  // Format MySQL DATETIME friendly
        };

        // Insert new user
        db.query('INSERT INTO users SET ?', [newUser], (insertErr, result) => {
          if (insertErr) {
            console.error('Registration error:', insertErr);
            return res.status(500).json({
              success: false,
              message: 'Terjadi kesalahan pada server',
              error: process.env.NODE_ENV === 'development' ? insertErr.message : undefined
            });
          }
          
          if (!JWT_SECRET || !TOKEN_EXPIRY) {
            console.error('JWT_SECRET atau TOKEN_EXPIRY tidak terdefinisi');
            return res.status(500).json({
              success: false,
              message: 'Konfigurasi server tidak lengkap'
            });
          }
          
          // Generate token
          const token = jwt.sign(
            { id: result.insertId, username: newUser.username, role: newUser.role },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
          );
          
          const { password: _, ...userData } = newUser;
          userData.id = result.insertId;

          return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            token,
            user: userData
          });
        });
      });
    });
  });
});

// Login 
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login pengguna
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
 *       400:
 *         description: Data tidak lengkap
 *       401:
 *         description: Kredensial salah
 *       500:
 *         description: Kesalahan server
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username dan password harus diisi' 
    });
  }
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan server'
      });
    }
    
    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }
    const user = rows[0];
    
    // Verify password
    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr) {
        return res.status(500).json({ 
          success: false, 
          message: 'Terjadi kesalahan server'
        });
      }
      
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Username atau password salah' 
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      
      // Set token di cookie HttpOnly
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true prod (https)
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 
      });
      const { password: _, ...userData } = user;
      
      return res.status(200).json({
        success: true,
        message: 'Login berhasil',
        user: userData,
        token
      });
    });
  });
});

/**
 * @swagger
 * /api/auth/checkauth:
 *   get:
 *     summary: Cek validitas token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valid
 *       401:
 *         description: Token tidak valid
 */
router.get('/', (req, res) => {
    res.json({ message: 'Auth API is working' });
});

// Check token status
/**
 * @swagger
 * /api/auth:
 *   get:
 *     summary: Endpoint tes koneksi auth
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: API bekerja
 */ 
router.get('/checkauth', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token valid',
    user: req.user
  });
});


// Export router and middleware
module.exports = {
  router,
  verifyToken
}; 