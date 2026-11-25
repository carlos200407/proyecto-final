const express = require('express');
const router = express.Router();
const { obtenerAlumnos, obtenerAlumnoPorId, crearAlumno } = require('../controllers/alumnos.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

// Los listados completos son solo para el personal administrativo (un padre no debe ver a todos los alumnos).
router.get('/', verificarToken, verificarRol('Secretario', 'Director'), obtenerAlumnos);
router.get('/:id', verificarToken, verificarRol('Secretario', 'Director'), obtenerAlumnoPorId);
router.post('/', verificarToken, verificarRol('Secretario', 'Director'), crearAlumno);

module.exports = router;
