const express = require('express');
const router = express.Router();
const { obtenerSecciones, crearSeccion, obtenerVacantes } = require('../controllers/secciones.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/vacantes', obtenerVacantes); // pública: la usa la página principal
router.get('/', verificarToken, obtenerSecciones);
router.post('/', verificarToken, verificarRol('Director'), crearSeccion);

module.exports = router;
