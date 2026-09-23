const { conectarDB, sql } = require('../config/db');

// GET /api/cursos
async function obtenerCursos(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM CURSO');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/cursos - el director crea un curso
async function crearCurso(req, res) {
    try {
        const { nombre, grado } = req.body;

        if (!nombre || !grado) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, grado' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('grado', sql.VarChar, grado)
            .query(`INSERT INTO CURSO (nombre, grado)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @grado)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/cursos/asignar - el director asigna un curso a una sección con su docente (SECCION_CURSO)
async function asignarCursoASeccion(req, res) {
    try {
        const { id_sec, id_cur, docente_id } = req.body;

        if (!id_sec || !id_cur || !docente_id) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: id_sec, id_cur, docente_id' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_sec', sql.Int, id_sec)
            .input('id_cur', sql.Int, id_cur)
            .input('docente_id', sql.Int, docente_id)
            .query(`INSERT INTO SECCION_CURSO (id_sec, id_cur, docente_id)
                    OUTPUT INSERTED.*
                    VALUES (@id_sec, @id_cur, @docente_id)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UQ_seccur_seccion_curso')) {
            return res.status(409).json({ error: 'Ese curso ya está asignado a esa sección' });
        }
        res.status(500).json({ error: error.message });
    }
}

// GET /api/cursos/seccion/:id_sec - qué cursos y docentes tiene una sección
async function obtenerCursosDeSeccion(req, res) {
    try {
        const { id_sec } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_sec', sql.Int, id_sec)
            .query(`SELECT sc.id_seccur, c.id_cur, c.nombre AS curso, u.id_usu AS id_docente,
                           u.nombre AS nombre_docente, u.apellido AS apellido_docente
                    FROM SECCION_CURSO sc
                    INNER JOIN CURSO c ON sc.id_cur = c.id_cur
                    INNER JOIN USUARIO u ON sc.docente_id = u.id_usu
                    WHERE sc.id_sec = @id_sec`);
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerCursos, crearCurso, asignarCursoASeccion, obtenerCursosDeSeccion };
