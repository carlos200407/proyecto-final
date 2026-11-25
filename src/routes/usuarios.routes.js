const express = require('express');
const router = express.Router();
const {
    obtenerUsuarios, obtenerUsuarioPorId, crearUsuario, desactivarUsuario, activarUsuario
} = require('../controllers/usuarios.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

// Antes POST / era abierto y aceptaba rol "Director": cualquiera podía crearse un director.
// Ahora solo el Director crea cuentas. Los padres se registran con POST /api/auth/registro-padre.
router.get('/', verificarToken, verificarRol('Director', 'Secretario'), obtenerUsuarios);
router.get('/:id', verificarToken, verificarRol('Director', 'Secretario'), obtenerUsuarioPorId);
router.post('/', verificarToken, verificarRol('Director'), crearUsuario);
router.patch('/:id/desactivar', verificarToken, verificarRol('Director'), desactivarUsuario);
router.patch('/:id/activar', verificarToken, verificarRol('Director'), activarUsuario);

module.exports = router;
