const express = require('express');
const router = express.Router();
const { obtenerCriteriosDeCurso, crearCriterio } = require('../controllers/criterios.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/curso/:id_cur', verificarToken, obtenerCriteriosDeCurso);
router.post('/', verificarToken, verificarRol('Director'), crearCriterio);

module.exports = router;
