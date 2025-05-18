const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Siswa',
      version: '1.0.0',
      description: 'Dokumentasi REST API Tambah Siswa',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Akan membaca semua file di dalam folder routes
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
