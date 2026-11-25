const express = require('express');
const router = express.Router();
const {
    obtenerPadres, obtenerPadrePorId, crearPadre, obtenerHijosDePadre, obtenerMiPerfil
} = require('../controllers/padres.controller');
const { verificarToken, verificarRol } = require('../middleware/auth.middleware');

router.get('/yo', verificarToken, verificarRol('Padre'), obtenerMiPerfil);
router.get('/', verificarToken, verificarRol('Secretario', 'Director'), obtenerPadres);
router.get('/:id', verificarToken, verificarRol('Secretario', 'Director'), obtenerPadrePorId);
router.get('/:id/alumnos', verificarToken, verificarRol('Secretario', 'Director'), obtenerHijosDePadre);
// Antes era abierta: cualquiera podía enlazar un "padre" a cualquier cuenta. Los padres se registran con /api/auth/registro-padre.
router.post('/', verificarToken, verificarRol('Secretario', 'Director'), crearPadre);

module.exports = router;
