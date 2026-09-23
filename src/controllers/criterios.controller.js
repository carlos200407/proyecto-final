const { conectarDB, sql } = require('../config/db');

// GET /api/criterios/curso/:id_cur - los criterios configurados para un curso
async function obtenerCriteriosDeCurso(req, res) {
    try {
        const { id_cur } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_cur', sql.Int, id_cur)
            .query('SELECT * FROM CRITERIO_EVALUACION WHERE id_cur = @id_cur');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/criterios - el director configura un criterio nuevo (Examen, Práctica, Tarea...)
async function crearCriterio(req, res) {
    try {
        const { id_cur, nombre } = req.body;

        if (!id_cur || !nombre) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: id_cur, nombre' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_cur', sql.Int, id_cur)
            .input('nombre', sql.VarChar, nombre)
            .query(`INSERT INTO CRITERIO_EVALUACION (id_cur, nombre)
                    OUTPUT INSERTED.*
                    VALUES (@id_cur, @nombre)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UQ_criterio_curso_nombre')) {
            return res.status(409).json({ error: 'Ese curso ya tiene un criterio con ese nombre' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerCriteriosDeCurso, crearCriterio };
