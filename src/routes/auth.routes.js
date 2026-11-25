const express = require('express');
const router = express.Router();
const { login, cambiarPassword, registroPadre } = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/registro-padre', registroPadre);
router.put('/cambiar-password', verificarToken, cambiarPassword);

module.exports = router;
