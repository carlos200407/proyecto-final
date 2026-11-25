const express = require('express');
const router = express.Router();
const {
    listarPendientes, confirmarMatricula, rechazarMatricula, moverMatricula, retirarMatricula, nominaSeccion,
    matricularPresencial, buscar, editarAlumno, editarApoderado, listarAvisos, avisoASeccion
} = require('../controllers/secretaria.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.use(verificarToken, verificarRol('Secretario', 'Director'));

router.get('/pendientes', listarPendientes);
router.get('/nomina/:id_sec', nominaSeccion);
router.patch('/matriculas/:id/confirmar', confirmarMatricula);
router.patch('/matriculas/:id/seccion', moverMatricula);
router.patch('/matriculas/:id/retirar', retirarMatricula);
router.delete('/matriculas/:id', rechazarMatricula);

router.post('/matricula-presencial', matricularPresencial);
router.get('/buscar', buscar);
router.patch('/alumnos/:id', editarAlumno);
router.patch('/apoderados/:id', editarApoderado);
router.get('/avisos', listarAvisos);
router.post('/avisos/seccion', avisoASeccion);

module.exports = router;
