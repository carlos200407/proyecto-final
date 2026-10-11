const express = require('express');
const router = express.Router();
const {
    obtenerNotasDeMatricula,
    obtenerPromediosDeMatricula,
    crearNota,
    actualizarNota
} = require('../controllers/notas.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/matricula/:id_mat', verificarToken, obtenerNotasDeMatricula);
router.get('/matricula/:id_mat/promedios', verificarToken, obtenerPromediosDeMatricula);
router.post('/', verificarToken, verificarRol('Docente'), crearNota);
router.put('/:id', verificarToken, verificarRol('Docente'), actualizarNota);

module.exports = router;
