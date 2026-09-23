const { conectarDB, sql } = require('../config/db');

// GET /api/notas/matricula/:id_mat - todas las notas de un alumno (por matrícula)
async function obtenerNotasDeMatricula(req, res) {
    try {
        const { id_mat } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_mat', sql.Int, id_mat)
            .query(`SELECT n.id_not, n.valor, ce.nombre AS criterio, c.id_cur, c.nombre AS curso
                    FROM NOTA n
                    INNER JOIN CRITERIO_EVALUACION ce ON n.id_crit = ce.id_crit
                    INNER JOIN CURSO c ON ce.id_cur = c.id_cur
                    WHERE n.id_mat = @id_mat
                    ORDER BY c.nombre, ce.nombre`);
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// GET /api/notas/matricula/:id_mat/promedios - promedio por curso (media aritmética simple)
async function obtenerPromediosDeMatricula(req, res) {
    try {
        const { id_mat } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_mat', sql.Int, id_mat)
            .query(`SELECT c.id_cur, c.nombre AS curso, AVG(n.valor) AS promedio, COUNT(n.id_not) AS cantidad_notas
                    FROM NOTA n
                    INNER JOIN CRITERIO_EVALUACION ce ON n.id_crit = ce.id_crit
                    INNER JOIN CURSO c ON ce.id_cur = c.id_cur
                    WHERE n.id_mat = @id_mat
                    GROUP BY c.id_cur, c.nombre`);
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/notas - el docente registra una nota para un criterio
async function crearNota(req, res) {
    try {
        const { id_mat, id_crit, valor } = req.body;

        if (!id_mat || !id_crit || valor === undefined) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: id_mat, id_crit, valor' });
        }

        if (valor < 0 || valor > 20) {
            return res.status(400).json({ error: 'La nota debe estar entre 0 y 20' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_mat', sql.Int, id_mat)
            .input('id_crit', sql.Int, id_crit)
            .input('valor', sql.Decimal(4, 2), valor)
            .query(`INSERT INTO NOTA (id_mat, id_crit, valor)
                    OUTPUT INSERTED.*
                    VALUES (@id_mat, @id_crit, @valor)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UQ_nota_matricula_criterio')) {
            return res.status(409).json({ error: 'Ya existe una nota para este alumno en este criterio (usa actualizar, no crear)' });
        }
        res.status(500).json({ error: error.message });
    }
}

// PUT /api/notas/:id - el docente corrige una nota ya puesta
async function actualizarNota(req, res) {
    try {
        const { id } = req.params;
        const { valor } = req.body;

        if (valor === undefined) {
            return res.status(400).json({ error: 'Falta el campo valor' });
        }
        if (valor < 0 || valor > 20) {
            return res.status(400).json({ error: 'La nota debe estar entre 0 y 20' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('valor', sql.Decimal(4, 2), valor)
            .query(`UPDATE NOTA SET valor = @valor
                    OUTPUT INSERTED.*
                    WHERE id_not = @id`);

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Nota no encontrada' });
        }
        res.json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerNotasDeMatricula, obtenerPromediosDeMatricula, crearNota, actualizarNota };
