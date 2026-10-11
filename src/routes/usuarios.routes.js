const express = require('express');
const router = express.Router();
const { obtenerUsuarios, obtenerUsuarioPorId, crearUsuario, desactivarUsuario } = require('../controllers/usuarios.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/', verificarToken, obtenerUsuarios);
router.get('/:id', verificarToken, obtenerUsuarioPorId);
router.post('/', crearUsuario);
router.patch('/:id/desactivar', verificarToken, verificarRol('Director'), desactivarUsuario);

module.exports = router;
