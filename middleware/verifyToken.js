    const jwt = require('jsonwebtoken');
    require('dotenv').config();

    function verifyToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        let token = authHeader && authHeader.split(' ')[1]; // coba dari heade

        if (!token && req.cookies) {
            token = req.cookies.token; // coba dari cookie jika header ga ada
        }
        
        if (!token) {
            return res.status(401).json({ message: 'Token tidak ditemukan' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token tidak valid' });
            }
            req.user = user; // Simpan payload token ke req.user
            next(); // Lanjut ke route
        });
    }

module.exports = verifyToken;