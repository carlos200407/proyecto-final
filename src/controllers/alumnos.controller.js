const { conectarDB, sql } = require('../config/db');

// GET /api/alumnos - trae todos los alumnos
async function obtenerAlumnos(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM ALUMNO');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// GET /api/alumnos/:id - trae un alumno específico
async function obtenerAlumnoPorId(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM ALUMNO WHERE id_alu = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
        res.json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/alumnos - crea un alumno nuevo
async function crearAlumno(req, res) {
    try {
        const { nombre, apellido, dni, id_pad } = req.body;

        if (!nombre || !apellido || !dni || !id_pad) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, apellido, dni, id_pad' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('dni', sql.VarChar, dni)
            .input('id_pad', sql.Int, id_pad)
            .query(`INSERT INTO ALUMNO (nombre, apellido, dni, id_pad)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @apellido, @dni, @id_pad)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerAlumnos, obtenerAlumnoPorId, crearAlumno };