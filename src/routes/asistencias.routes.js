const express = require('express');
const router = express.Router();
const { obtenerAsistenciasDeMatricula, crearAsistencia } = require('../controllers/asistencias.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/matricula/:id_mat', verificarToken, obtenerAsistenciasDeMatricula);
router.post('/', verificarToken, verificarRol('Docente'), crearAsistencia);

module.exports = router;
