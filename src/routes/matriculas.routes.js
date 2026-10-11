const express = require('express');
const router = express.Router();
const { obtenerMatriculas, obtenerMatriculaPorId, crearMatricula } = require('../controllers/matriculas.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/', verificarToken, obtenerMatriculas);
router.get('/:id', verificarToken, obtenerMatriculaPorId);
router.post('/', verificarToken, verificarRol('Secretario', 'Padre', 'Director'), crearMatricula);

module.exports = router;
