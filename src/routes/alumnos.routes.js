const express = require('express');
const router = express.Router();
const { obtenerAlumnos, obtenerAlumnoPorId, crearAlumno } = require('../controllers/alumnos.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/', verificarToken, obtenerAlumnos);
router.get('/:id', verificarToken, obtenerAlumnoPorId);
router.post('/', verificarToken, verificarRol('Secretario', 'Director'), crearAlumno);

module.exports = router;
