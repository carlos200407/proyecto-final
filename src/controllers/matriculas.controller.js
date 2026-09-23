const { conectarDB, sql } = require('../config/db');

// GET /api/matriculas - trae todas las matrículas con datos del alumno y sección
async function obtenerMatriculas(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query(`
            SELECT
                m.id_mat, m.anio, m.fecha_matricula, m.estado,
                a.id_alu, a.nombre AS nombre_alumno, a.apellido AS apellido_alumno,
                s.id_sec, s.grado, s.letra
            FROM MATRICULA m
            INNER JOIN ALUMNO a ON m.id_alu = a.id_alu
            INNER JOIN SECCION s ON m.id_sec = s.id_sec
        `);
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// GET /api/matriculas/:id
async function obtenerMatriculaPorId(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM MATRICULA WHERE id_mat = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Matrícula no encontrada' });
        }
        res.json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/matriculas - crea una matrícula nueva
async function crearMatricula(req, res) {
    try {
        const { id_alu, id_sec, anio, registrado_por } = req.body;

        if (!id_alu || !id_sec || !anio || !registrado_por) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_alu, id_sec, anio, registrado_por'
            });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_alu', sql.Int, id_alu)
            .input('id_sec', sql.Int, id_sec)
            .input('anio', sql.Int, anio)
            .input('registrado_por', sql.Int, registrado_por)
            .query(`INSERT INTO MATRICULA (id_alu, id_sec, anio, registrado_por)
                    OUTPUT INSERTED.*
                    VALUES (@id_alu, @id_sec, @anio, @registrado_por)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        // Si viola el UNIQUE(id_alu, anio), SQL Server manda un mensaje específico
        if (error.message.includes('UQ_matricula_alumno_anio')) {
            return res.status(409).json({ error: 'Este alumno ya está matriculado ese año' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerMatriculas, obtenerMatriculaPorId, crearMatricula };