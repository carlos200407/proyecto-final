const express = require('express');
const router = express.Router();
const { obtenerSecciones, crearSeccion } = require('../controllers/secciones.controller');

router.get('/', obtenerSecciones);
router.post('/', crearSeccion);

module.exports = router;
