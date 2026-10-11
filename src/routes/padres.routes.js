const express = require('express');
const router = express.Router();
const { obtenerPadres, obtenerPadrePorId, crearPadre, obtenerHijosDePadre } = require('../controllers/padres.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.get('/', verificarToken, obtenerPadres);
router.get('/:id', verificarToken, obtenerPadrePorId);
router.get('/:id/alumnos', verificarToken, obtenerHijosDePadre);
router.post('/', crearPadre);

module.exports = router;
