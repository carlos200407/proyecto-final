const { conectarDB, sql } = require('../config/db');

// GET /api/padres
async function obtenerPadres(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM PADRE');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// GET /api/padres/:id
async function obtenerPadrePorId(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM PADRE WHERE id_pad = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Padre no encontrado' });
        }
        res.json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/padres - crea el registro de padre, vinculado a un usuario ya creado (rol='Padre')
async function crearPadre(req, res) {
    try {
        const { nombre, apellido, dni, correo, id_usu } = req.body;

        if (!nombre || !apellido || !dni || !correo || !id_usu) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: nombre, apellido, dni, correo, id_usu'
            });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('dni', sql.VarChar, dni)
            .input('correo', sql.VarChar, correo)
            .input('id_usu', sql.Int, id_usu)
            .query(`INSERT INTO PADRE (nombre, apellido, dni, correo, id_usu)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @apellido, @dni, @correo, @id_usu)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
            return res.status(409).json({ error: 'Ese DNI ya está registrado, o este usuario ya tiene un padre asociado' });
        }
        res.status(500).json({ error: error.message });
    }
}

// GET /api/padres/:id/alumnos - hijos de este padre (útil para el portal del padre)
async function obtenerHijosDePadre(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM ALUMNO WHERE id_pad = @id');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerPadres, obtenerPadrePorId, crearPadre, obtenerHijosDePadre };
