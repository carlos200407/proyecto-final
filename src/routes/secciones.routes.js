const express = require('express');
const router = express.Router();
const { obtenerSecciones, crearSeccion, obtenerVacantes, actualizarCapacidad } = require('../controllers/secciones.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/vacantes', obtenerVacantes); // pública: la usa la página principal
router.get('/', verificarToken, obtenerSecciones);
router.post('/', verificarToken, verificarRol('Director'), crearSeccion);
router.patch('/:id', verificarToken, verificarRol('Director'), actualizarCapacidad);

module.exports = router;
