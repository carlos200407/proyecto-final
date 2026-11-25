const express = require('express');
const router = express.Router();
const { obtenerNotificacionesDeAlumno, crearNotificacion } = require('../controllers/notificaciones.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');
const { alumnoDelPadre } = require('../middleware/acceso.middleware');

router.get('/alumno/:id_alu', verificarToken, alumnoDelPadre, obtenerNotificacionesDeAlumno);
router.post('/', verificarToken, verificarRol('Secretario'), crearNotificacion);

module.exports = router;
