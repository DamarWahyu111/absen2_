const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const absenSiswaRoutes = require('./routes/absenSiswa');
const { router: authRoutes, verifyToken } = require('./routes/auth');
const updateSiswaRoutes = require('./routes/updateSiswa');  
const tambahSiswaRoutes = require('./routes/tambahSiswa');
const dashboardSiswaRoute = require('./routes/dashboardSiswa');
const riwayatAbsensiRoute = require('./routes/riwayatAbsensi');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.config'); // pastikan path-nya sesuai
const cookieParser = require('cookie-parser');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  'http://127.0.0.1:5500', // local frontend
  'https://project-damarq2ccos4.et.r.appspot.com', // frontend deploy 
];
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS origin:', origin);  // debug origin yg masuk
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/riwayat-absensi', riwayatAbsensiRoute);
app.use('/api/dashboard-siswa', dashboardSiswaRoute);
app.use('/api/auth', authRoutes);
app.use('/api/absen', absenSiswaRoutes);
app.use('/api/siswa', tambahSiswaRoutes);
app.use('/api/siswa', updateSiswaRoutes);  

app.use('/opening', express.static(path.join(__dirname, 'opening')));
app.use('/html', express.static(path.join(__dirname, 'html')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'opening', 'login.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// app.listen(PORT, () => {
//   console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
// });
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});


