const express = require('express');
const router = express.Router();
const { calificaciones } = require('../controllers/dashboard.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/calificaciones', verificarToken, verificarRol('Director'), calificaciones);

module.exports = router;
