const express = require('express');
const router = express.Router();
const { obtenerUsuarios, obtenerUsuarioPorId, crearUsuario, desactivarUsuario } = require('../controllers/usuarios.controller');

router.get('/', obtenerUsuarios);
router.get('/:id', obtenerUsuarioPorId);
router.post('/', crearUsuario);
router.patch('/:id/desactivar', desactivarUsuario);

module.exports = router;
