const express = require('express');
const router = express.Router();
const { obtenerAsistenciasDeMatricula, crearAsistencia } = require('../controllers/asistencias.controller');

router.get('/matricula/:id_mat', obtenerAsistenciasDeMatricula);
router.post('/', crearAsistencia);

module.exports = router;
