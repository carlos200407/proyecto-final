const express = require('express');
const router = express.Router();
const { obtenerSecciones, crearSeccion } = require('../controllers/secciones.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/', verificarToken, obtenerSecciones);
router.post('/', verificarToken, verificarRol('Director'), crearSeccion);

module.exports = router;
