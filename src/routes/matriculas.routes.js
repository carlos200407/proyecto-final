const express = require('express');
const router = express.Router();
const {
    obtenerMatriculas, obtenerMatriculaPorId, crearMatricula, matricularEnLinea
} = require('../controllers/matriculas.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/', verificarToken, verificarRol('Secretario', 'Director'), obtenerMatriculas);
router.get('/:id', verificarToken, verificarRol('Secretario', 'Director'), obtenerMatriculaPorId);
router.post('/', verificarToken, verificarRol('Secretario', 'Director'), crearMatricula);
router.post('/en-linea', verificarToken, verificarRol('Padre'), matricularEnLinea);

module.exports = router;
