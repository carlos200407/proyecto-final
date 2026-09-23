const express = require('express');
const router = express.Router();
const { obtenerAlumnos, obtenerAlumnoPorId, crearAlumno } = require('../controllers/alumnos.controller');

router.get('/', obtenerAlumnos);
router.get('/:id', obtenerAlumnoPorId);
router.post('/', crearAlumno);

module.exports = router;