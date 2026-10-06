const express = require('express');
const router = express.Router();
const { login, cambiarPassword } = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.post('/login', login);
router.put('/cambiar-password', verificarToken, cambiarPassword);

module.exports = router;
