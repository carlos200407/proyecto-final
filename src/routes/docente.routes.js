const express = require('express');
const router = express.Router();
const { misCursos, obtenerPlanilla, guardarPlanilla } = require('../controllers/docente.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.use(verificarToken, verificarRol('Docente'));

router.get('/cursos', misCursos);
router.get('/planilla/:id_sec/:id_cur', obtenerPlanilla);
router.put('/planilla/:id_sec/:id_cur', guardarPlanilla);

module.exports = router;
