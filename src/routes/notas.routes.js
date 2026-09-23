const express = require('express');
const router = express.Router();
const {
    obtenerNotasDeMatricula,
    obtenerPromediosDeMatricula,
    crearNota,
    actualizarNota
} = require('../controllers/notas.controller');

router.get('/matricula/:id_mat', obtenerNotasDeMatricula);
router.get('/matricula/:id_mat/promedios', obtenerPromediosDeMatricula);
router.post('/', crearNota);
router.put('/:id', actualizarNota);

module.exports = router;
