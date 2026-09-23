const express = require('express');
const router = express.Router();
const { obtenerNotificacionesDeAlumno, crearNotificacion } = require('../controllers/notificaciones.controller');

router.get('/alumno/:id_alu', obtenerNotificacionesDeAlumno);
router.post('/', crearNotificacion);

module.exports = router;
