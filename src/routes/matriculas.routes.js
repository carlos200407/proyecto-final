const express = require('express');
const router = express.Router();
const { obtenerMatriculas, obtenerMatriculaPorId, crearMatricula } = require('../controllers/matriculas.controller');

router.get('/', obtenerMatriculas);
router.get('/:id', obtenerMatriculaPorId);
router.post('/', crearMatricula);

module.exports = router;