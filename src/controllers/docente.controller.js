const { conectarDB, sql } = require('../config/db');
const { ANIO_ACADEMICO } = require('../config/anio');

// Secciones y cursos que dicta el docente que inició sesión.
async function misCursos(req, res) {
    try {
        const pool = await conectarDB();
        const r = await pool.request()
            .input('id_usu', sql.Int, req.usuario.id_usu)
            .query(`SELECT sc.id_sec, sc.id_cur, s.nivel, s.grado, s.letra, c.nombre AS curso
                    FROM SECCION_CURSO sc
                    INNER JOIN SECCION s ON sc.id_sec = s.id_sec
                    INNER JOIN CURSO c ON sc.id_cur = c.id_cur
                    WHERE sc.docente_id = @id_usu
                    ORDER BY s.nivel, s.grado, s.letra, c.nombre`);
        res.json(r.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function dictaCurso(pool, id_usu, id_sec, id_cur) {
    const r = await pool.request()
        .input('id_usu', sql.Int, id_usu)
        .input('id_sec', sql.Int, id_sec)
        .input('id_cur', sql.Int, id_cur)
        .query('SELECT 1 AS ok FROM SECCION_CURSO WHERE docente_id = @id_usu AND id_sec = @id_sec AND id_cur = @id_cur');
    return r.recordset.length > 0;
}

// Planilla de notas: alumnos matriculados (activos) de la sección + criterios del curso + notas ya puestas.
async function obtenerPlanilla(req, res) {
    try {
        const { id_sec, id_cur } = req.params;
        const pool = await conectarDB();

        if (!(await dictaCurso(pool, req.usuario.id_usu, id_sec, id_cur))) {
            return res.status(403).json({ error: 'No dictas este curso en esta sección' });
        }

        const info = await pool.request()
            .input('id_sec', sql.Int, id_sec)
            .input('id_cur', sql.Int, id_cur)
            .query(`SELECT s.nivel, s.grado, s.letra, c.nombre AS curso
                    FROM SECCION s, CURSO c WHERE s.id_sec = @id_sec AND c.id_cur = @id_cur`);

        const criterios = await pool.request()
            .input('id_cur', sql.Int, id_cur)
            .query('SELECT id_crit, nombre FROM CRITERIO_EVALUACION WHERE id_cur = @id_cur ORDER BY id_crit');

        const alumnos = await pool.request()
            .input('id_sec', sql.Int, id_sec)
            .input('anio', sql.Int, ANIO_ACADEMICO)
            .query(`SELECT m.id_mat, a.nombre, a.apellido
                    FROM MATRICULA m
                    INNER JOIN ALUMNO a ON m.id_alu = a.id_alu
                    WHERE m.id_sec = @id_sec AND m.anio = @anio AND m.estado = 'Activa'
                    ORDER BY a.apellido, a.nombre`);

        const notas = await pool.request()
            .input('id_sec', sql.Int, id_sec)
            .input('id_cur', sql.Int, id_cur)
            .input('anio', sql.Int, ANIO_ACADEMICO)
            .query(`SELECT n.id_mat, n.id_crit, n.valor
                    FROM NOTA n
                    INNER JOIN MATRICULA m ON n.id_mat = m.id_mat
                    INNER JOIN CRITERIO_EVALUACION ce ON n.id_crit = ce.id_crit
                    WHERE m.id_sec = @id_sec AND m.anio = @anio AND ce.id_cur = @id_cur`);

        res.json({
            anio: ANIO_ACADEMICO,
            seccion: info.recordset[0],
            criterios: criterios.recordset,
            alumnos: alumnos.recordset.map((a) => ({
                ...a,
                notas: Object.fromEntries(
                    notas.recordset.filter((n) => n.id_mat === a.id_mat).map((n) => [n.id_crit, n.valor])
                )
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Guarda en bloque: body { notas: [{ id_mat, id_crit, valor }] }. Crea o actualiza cada nota.
// Las celdas vacías (valor null o '') se ignoran. Todo o nada: si una falla, no se guarda ninguna.
async function guardarPlanilla(req, res) {
    const { id_sec, id_cur } = req.params;
    const { notas } = req.body;

    if (!Array.isArray(notas)) {
        return res.status(400).json({ error: 'Falta la lista notas' });
    }
    const aGuardar = notas.filter((n) => n.valor !== null && n.valor !== '' && n.valor !== undefined);
    for (const n of aGuardar) {
        const v = Number(n.valor);
        if (!Number.isInteger(n.id_mat) || !Number.isInteger(n.id_crit) || Number.isNaN(v) || v < 0 || v > 20) {
            return res.status(400).json({ error: 'Cada nota debe tener id_mat, id_crit y un valor entre 0 y 20' });
        }
        n.valor = v;
    }

    let tx;
    try {
        const pool = await conectarDB();
        if (!(await dictaCurso(pool, req.usuario.id_usu, id_sec, id_cur))) {
            return res.status(403).json({ error: 'No dictas este curso en esta sección' });
        }

        tx = new sql.Transaction(pool);
        await tx.begin();

        for (const n of aGuardar) {
            // El SELECT de origen solo devuelve fila si la matrícula es de ESTA sección
            // y el criterio es de ESTE curso: así no se pueden escribir notas ajenas.
            const r = await new sql.Request(tx)
                .input('id_mat', sql.Int, n.id_mat)
                .input('id_crit', sql.Int, n.id_crit)
                .input('id_sec', sql.Int, id_sec)
                .input('id_cur', sql.Int, id_cur)
                .input('valor', sql.Decimal(4, 2), n.valor)
                .query(`MERGE NOTA AS t
                        USING (SELECT m.id_mat, ce.id_crit, @valor AS valor
                               FROM MATRICULA m, CRITERIO_EVALUACION ce
                               WHERE m.id_mat = @id_mat AND m.id_sec = @id_sec
                                 AND ce.id_crit = @id_crit AND ce.id_cur = @id_cur) AS s
                        ON t.id_mat = s.id_mat AND t.id_crit = s.id_crit
                        WHEN MATCHED THEN UPDATE SET valor = s.valor
                        WHEN NOT MATCHED THEN INSERT (id_mat, id_crit, valor) VALUES (s.id_mat, s.id_crit, s.valor);`);
            if (!r.rowsAffected[0]) {
                await tx.rollback();
                return res.status(400).json({ error: 'Una de las notas no corresponde a esta sección o curso' });
            }
        }

        await tx.commit();
        res.json({ mensaje: 'Notas guardadas', guardadas: aGuardar.length });
    } catch (error) {
        if (tx) { try { await tx.rollback(); } catch { /* ya cerrada */ } }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { misCursos, obtenerPlanilla, guardarPlanilla };
