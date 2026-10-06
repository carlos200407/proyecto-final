const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { conectarDB, sql } = require('../config/db');

// POST /api/auth/login
async function login(req, res) {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: correo, password' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM USUARIO WHERE correo = @correo');

        const usuario = resultado.recordset[0];

        // Mensaje genérico a propósito: no reveles si fue el correo o la contraseña
        // lo que falló, por seguridad (evita que alguien "adivine" correos válidos).
        if (!usuario) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        if (!usuario.activo) {
            return res.status(403).json({ error: 'Esta cuenta está desactivada' });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id_usu: usuario.id_usu, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: {
                id_usu: usuario.id_usu,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.rol,
                primer_ingreso: usuario.primer_ingreso
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// PUT /api/auth/cambiar-password (requiere estar logueado - usa el middleware verificarToken)
async function cambiarPassword(req, res) {
    try {
        const { password_nueva } = req.body;
        const { id_usu } = req.usuario; // esto lo pone el middleware verificarToken

        if (!password_nueva || password_nueva.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        const hash = await bcrypt.hash(password_nueva, 10);

        const pool = await conectarDB();
        await pool.request()
            .input('id_usu', sql.Int, id_usu)
            .input('hash', sql.VarChar, hash)
            .query(`UPDATE USUARIO SET password_hash = @hash, primer_ingreso = 0 WHERE id_usu = @id_usu`);

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { login, cambiarPassword };
