const express = require('express');
const router = express.Router();
const {
    obtenerCursos,
    asignarCursoASeccion,
    obtenerCursosDeSeccion
} = require('../controllers/cursos.controller');
const { crearCurso } = require('../controllers/director.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/', verificarToken, obtenerCursos);
router.get('/seccion/:id_sec', verificarToken, obtenerCursosDeSeccion);
router.post('/', verificarToken, verificarRol('Director'), crearCurso);
router.post('/asignar', verificarToken, verificarRol('Director'), asignarCursoASeccion);

module.exports = router;
