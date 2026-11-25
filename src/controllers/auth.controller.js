const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { conectarDB, sql } = require('../config/db');

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

async function cambiarPassword(req, res) {
    try {
        const { password_nueva } = req.body;
        const { id_usu } = req.usuario;

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

// Registro público de un padre de familia: crea USUARIO (rol Padre) + PADRE en una sola operación.
async function registroPadre(req, res) {
    const { nombre, apellido, dni, correo, password } = req.body;

    if (!nombre || !apellido || !dni || !correo || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, apellido, dni, correo, password' });
    }
    if (!/^[0-9]{8}$/.test(dni)) {
        return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    let tx;
    try {
        const pool = await conectarDB();
        const hash = await bcrypt.hash(password, 10);

        tx = new sql.Transaction(pool);
        await tx.begin();

        // primer_ingreso = 0: el padre eligió su propia contraseña, no hay que obligarlo a cambiarla.
        const u = await new sql.Request(tx)
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('correo', sql.VarChar, correo)
            .input('hash', sql.VarChar, hash)
            .query(`INSERT INTO USUARIO (nombre, apellido, correo, password_hash, rol, primer_ingreso)
                    OUTPUT INSERTED.id_usu
                    VALUES (@nombre, @apellido, @correo, @hash, 'Padre', 0)`);

        await new sql.Request(tx)
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('dni', sql.VarChar, dni)
            .input('correo', sql.VarChar, correo)
            .input('id_usu', sql.Int, u.recordset[0].id_usu)
            .query(`INSERT INTO PADRE (nombre, apellido, dni, correo, id_usu)
                    VALUES (@nombre, @apellido, @dni, @correo, @id_usu)`);

        await tx.commit();
        res.status(201).json({ mensaje: 'Cuenta creada. Ya puedes iniciar sesión.' });
    } catch (error) {
        if (tx) { try { await tx.rollback(); } catch { /* ya cerrada */ } }
        const msg = error.message || '';
        if (msg.includes('dbo.PADRE')) {
            return res.status(409).json({ error: 'Ese DNI ya está registrado' });
        }
        if (msg.includes('UNIQUE') || msg.includes('duplicate')) {
            return res.status(409).json({ error: 'Ese correo ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { login, cambiarPassword, registroPadre };
