const express = require('express');
const router = express.Router();
const {
    listarCursos, crearCurso, quitarCurso, agregarCriterio, quitarCriterio,
    sincronizar, verAsignaciones, asignarDocente
} = require('../controllers/director.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.use(verificarToken, verificarRol('Director'));

router.get('/cursos', listarCursos);
router.post('/cursos', crearCurso);
router.delete('/cursos/:id', quitarCurso);
router.post('/cursos/:id/criterios', agregarCriterio);
router.delete('/criterios/:id', quitarCriterio);
router.post('/sincronizar', sincronizar);
router.get('/asignaciones/:id_sec', verAsignaciones);
router.put('/asignaciones/:id_seccur', asignarDocente);

module.exports = router;
