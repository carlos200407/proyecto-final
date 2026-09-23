const express = require('express');
const router = express.Router();
const {
    obtenerCursos,
    crearCurso,
    asignarCursoASeccion,
    obtenerCursosDeSeccion
} = require('../controllers/cursos.controller');

router.get('/', obtenerCursos);
router.post('/', crearCurso);
router.post('/asignar', asignarCursoASeccion);
router.get('/seccion/:id_sec', obtenerCursosDeSeccion);

module.exports = router;
