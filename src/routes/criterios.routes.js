const express = require('express');
const router = express.Router();
const { obtenerCriteriosDeCurso, crearCriterio } = require('../controllers/criterios.controller');

router.get('/curso/:id_cur', obtenerCriteriosDeCurso);
router.post('/', crearCriterio);

module.exports = router;
