const { conectarDB, sql } = require('../config/db');

// GET /api/asistencias/matricula/:id_mat - historial de asistencia de un alumno
async function obtenerAsistenciasDeMatricula(req, res) {
    try {
        const { id_mat } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_mat', sql.Int, id_mat)
            .query('SELECT * FROM ASISTENCIA WHERE id_mat = @id_mat ORDER BY fecha DESC');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/asistencias - el docente marca la asistencia del día
async function crearAsistencia(req, res) {
    try {
        const { id_mat, fecha, estado } = req.body;

        if (!id_mat || !fecha || !estado) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: id_mat, fecha, estado' });
        }

        const estadosValidos = ['Presente', 'Falta', 'Tardanza', 'Justificada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: `estado debe ser uno de: ${estadosValidos.join(', ')}` });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_mat', sql.Int, id_mat)
            .input('fecha', sql.Date, fecha)
            .input('estado', sql.VarChar, estado)
            .query(`INSERT INTO ASISTENCIA (id_mat, fecha, estado)
                    OUTPUT INSERTED.*
                    VALUES (@id_mat, @fecha, @estado)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UQ_asistencia_matricula_fecha')) {
            return res.status(409).json({ error: 'Ya se registró la asistencia de este alumno ese día' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerAsistenciasDeMatricula, crearAsistencia };
