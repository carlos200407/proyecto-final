const { conectarDB, sql } = require('../config/db');

// GET /api/usuarios - trae todos los usuarios (sin exponer el password_hash)
async function obtenerUsuarios(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request()
            .query('SELECT id_usu, nombre, apellido, correo, rol, activo, primer_ingreso FROM USUARIO');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// GET /api/usuarios/:id
async function obtenerUsuarioPorId(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id_usu, nombre, apellido, correo, rol, activo, primer_ingreso FROM USUARIO WHERE id_usu = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/usuarios - crea un usuario nuevo (director crea personal, o un padre se auto-registra)
// NOTA: password_hash aquí se guarda tal cual llega. Cuando conectes el login real,
// usa bcrypt para hashear la contraseña ANTES de llamar a este endpoint (nunca guardes
// contraseñas en texto plano). Ej: const hash = await bcrypt.hash(password, 10);
async function crearUsuario(req, res) {
    try {
        const { nombre, apellido, correo, password_hash, rol } = req.body;

        if (!nombre || !apellido || !correo || !password_hash || !rol) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: nombre, apellido, correo, password_hash, rol'
            });
        }

        const rolesValidos = ['Director', 'Secretario', 'Docente', 'Padre'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ error: `rol debe ser uno de: ${rolesValidos.join(', ')}` });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('correo', sql.VarChar, correo)
            .input('password_hash', sql.VarChar, password_hash)
            .input('rol', sql.VarChar, rol)
            .query(`INSERT INTO USUARIO (nombre, apellido, correo, password_hash, rol)
                    OUTPUT INSERTED.id_usu, INSERTED.nombre, INSERTED.apellido, INSERTED.correo, INSERTED.rol, INSERTED.activo, INSERTED.primer_ingreso
                    VALUES (@nombre, @apellido, @correo, @password_hash, @rol)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
            return res.status(409).json({ error: 'Ese correo ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
}

// PATCH /api/usuarios/:id/desactivar - el director desactiva una cuenta (no la borra)
async function desactivarUsuario(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(`UPDATE USUARIO SET activo = 0
                    OUTPUT INSERTED.id_usu, INSERTED.nombre, INSERTED.apellido, INSERTED.activo
                    WHERE id_usu = @id`);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerUsuarios, obtenerUsuarioPorId, crearUsuario, desactivarUsuario };
