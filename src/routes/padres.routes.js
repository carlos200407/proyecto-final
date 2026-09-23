const express = require('express');
const router = express.Router();
const { obtenerPadres, obtenerPadrePorId, crearPadre, obtenerHijosDePadre } = require('../controllers/padres.controller');

router.get('/', obtenerPadres);
router.get('/:id', obtenerPadrePorId);
router.get('/:id/alumnos', obtenerHijosDePadre);
router.post('/', crearPadre);

module.exports = router;
