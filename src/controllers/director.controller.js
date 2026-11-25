const { conectarDB, sql } = require('../config/db');
const { Falla, responderError, enTransaccion } = require('../config/transaccion');

const NIVELES = ['Primaria', 'Secundaria'];
const CRITERIOS_ESTANDAR = ['Examen', 'Práctica', 'Tarea'];
const limpio = (v) => String(v ?? '').trim();

// Agrega a toda sección de ese nivel/grado el curso, sin docente. Devuelve cuántas secciones lo recibieron.
async function copiarCursoASecciones(tx, id_cur, nivel, grado) {
    const r = await new sql.Request(tx)
        .input('id_cur', sql.Int, id_cur)
        .input('nivel', sql.VarChar, nivel)
        .input('grado', sql.VarChar, grado)
        .query(`INSERT INTO SECCION_CURSO (id_sec, id_cur, docente_id)
                SELECT s.id_sec, @id_cur, NULL
                FROM SECCION s
                WHERE s.nivel = @nivel AND s.grado = @grado
                  AND NOT EXISTS (SELECT 1 FROM SECCION_CURSO x WHERE x.id_sec = s.id_sec AND x.id_cur = @id_cur)`);
    return r.rowsAffected[0];
}

// GET /api/director/cursos?nivel=Primaria&grado=1° — cursos del grado con sus criterios.
async function listarCursos(req, res) {
    try {
        const nivel = limpio(req.query.nivel);
        const grado = limpio(req.query.grado);
        if (!NIVELES.includes(nivel) || !grado) return res.status(400).json({ error: 'Indica nivel y grado' });

        const pool = await conectarDB();
        const cursos = await pool.request()
            .input('nivel', sql.VarChar, nivel).input('grado', sql.VarChar, grado)
            .query(`SELECT c.id_cur, c.nombre,
                           (SELECT COUNT(*) FROM SECCION_CURSO sc WHERE sc.id_cur = c.id_cur) AS secciones,
                           (SELECT COUNT(*) FROM SECCION_CURSO sc WHERE sc.id_cur = c.id_cur AND sc.docente_id IS NULL) AS sin_docente
                    FROM CURSO c WHERE c.nivel = @nivel AND c.grado = @grado
                    ORDER BY c.nombre`);
        const criterios = await pool.request()
            .input('nivel', sql.VarChar, nivel).input('grado', sql.VarChar, grado)
            .query(`SELECT ce.id_crit, ce.id_cur, ce.nombre,
                           (SELECT COUNT(*) FROM NOTA n WHERE n.id_crit = ce.id_crit) AS notas
                    FROM CRITERIO_EVALUACION ce
                    INNER JOIN CURSO c ON c.id_cur = ce.id_cur
                    WHERE c.nivel = @nivel AND c.grado = @grado
                    ORDER BY ce.id_crit`);
        const secciones = await pool.request()
            .input('nivel', sql.VarChar, nivel).input('grado', sql.VarChar, grado)
            .query('SELECT COUNT(*) AS n FROM SECCION WHERE nivel = @nivel AND grado = @grado');

        res.json({
            nivel, grado, secciones_del_grado: secciones.recordset[0].n,
            cursos: cursos.recordset.map((c) => ({
                ...c,
                criterios: criterios.recordset.filter((k) => k.id_cur === c.id_cur),
            })),
        });
    } catch (error) {
        responderError(res, error);
    }
}

// POST /api/director/cursos { nivel, grado, nombre, criterios_estandar? }
// Crea el curso del grado y lo agrega a todas las secciones de ese nivel y grado.
async function crearCurso(req, res) {
    try {
        const nivel = limpio(req.body.nivel), grado = limpio(req.body.grado), nombre = limpio(req.body.nombre);
        const estandar = req.body.criterios_estandar !== false;
        if (!NIVELES.includes(nivel) || !grado || !nombre) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: nivel, grado, nombre' });
        }
        if (nombre.length > 100) return res.status(400).json({ error: 'El nombre del curso es demasiado largo' });

        const resultado = await enTransaccion(async (tx) => {
            const dup = await new sql.Request(tx)
                .input('nivel', sql.VarChar, nivel).input('grado', sql.VarChar, grado).input('nombre', sql.VarChar, nombre)
                .query(`SELECT 1 AS x FROM CURSO WITH (UPDLOCK, HOLDLOCK)
                        WHERE nivel = @nivel AND grado = @grado AND nombre = @nombre`);
            if (dup.recordset.length > 0) throw new Falla(409, 'Ese curso ya existe en este grado');

            const c = await new sql.Request(tx)
                .input('nivel', sql.VarChar, nivel).input('grado', sql.VarChar, grado).input('nombre', sql.VarChar, nombre)
                .query(`INSERT INTO CURSO (nombre, grado, nivel) OUTPUT INSERTED.id_cur
                        VALUES (@nombre, @grado, @nivel)`);
            const id_cur = c.recordset[0].id_cur;

            if (estandar) {
                for (const k of CRITERIOS_ESTANDAR) {
                    await new sql.Request(tx)
                        .input('id_cur', sql.Int, id_cur).input('nombre', sql.VarChar, k)
                        .query('INSERT INTO CRITERIO_EVALUACION (id_cur, nombre) VALUES (@id_cur, @nombre)');
                }
            }
            const secciones = await copiarCursoASecciones(tx, id_cur, nivel, grado);
            return { id_cur, nombre, secciones };
        });
        res.status(201).json(resultado);
    } catch (error) {
        responderError(res, error);
    }
}

// DELETE /api/director/cursos/:id — solo si ninguna nota usa sus criterios.
async function quitarCurso(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Datos inválidos' });

        await enTransaccion(async (tx) => {
            const c = await new sql.Request(tx).input('id', sql.Int, id)
                .query('SELECT id_cur FROM CURSO WITH (UPDLOCK, HOLDLOCK) WHERE id_cur = @id');
            if (c.recordset.length === 0) throw new Falla(404, 'Curso no encontrado');
            const n = await new sql.Request(tx).input('id', sql.Int, id)
                .query(`SELECT COUNT(*) AS n FROM NOTA nt
                        INNER JOIN CRITERIO_EVALUACION ce ON ce.id_crit = nt.id_crit WHERE ce.id_cur = @id`);
            if (n.recordset[0].n > 0) throw new Falla(409, 'Este curso ya tiene notas registradas; no se puede quitar');
            await new sql.Request(tx).input('id', sql.Int, id).query('DELETE FROM SECCION_CURSO WHERE id_cur = @id');
            await new sql.Request(tx).input('id', sql.Int, id).query('DELETE FROM CRITERIO_EVALUACION WHERE id_cur = @id');
            await new sql.Request(tx).input('id', sql.Int, id).query('DELETE FROM CURSO WHERE id_cur = @id');
        });
        res.json({ id_cur: id, quitado: true });
    } catch (error) {
        responderError(res, error);
    }
}

// POST /api/director/cursos/:id/criterios { nombre }
async function agregarCriterio(req, res) {
    try {
        const id = parseInt(req.params.id), nombre = limpio(req.body.nombre);
        if (Number.isNaN(id) || !nombre) return res.status(400).json({ error: 'Escribe el nombre del criterio' });
        if (nombre.length > 100) return res.status(400).json({ error: 'El nombre del criterio es demasiado largo' });

        const pool = await conectarDB();
        const r = await pool.request().input('id', sql.Int, id).input('nombre', sql.VarChar, nombre)
            .query(`INSERT INTO CRITERIO_EVALUACION (id_cur, nombre)
                    OUTPUT INSERTED.id_crit, INSERTED.id_cur, INSERTED.nombre
                    VALUES (@id, @nombre)`);
        res.status(201).json({ ...r.recordset[0], notas: 0 });
    } catch (error) {
        const msg = error.message || '';
        if (msg.includes('UQ_criterio_curso_nombre')) return res.status(409).json({ error: 'Ese curso ya tiene un criterio con ese nombre' });
        if (msg.includes('FK_criterio_curso')) return res.status(404).json({ error: 'Curso no encontrado' });
        responderError(res, error);
    }
}

// DELETE /api/director/criterios/:id — solo si no tiene notas.
async function quitarCriterio(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Datos inválidos' });
        await enTransaccion(async (tx) => {
            const n = await new sql.Request(tx).input('id', sql.Int, id)
                .query('SELECT COUNT(*) AS n FROM NOTA WHERE id_crit = @id');
            if (n.recordset[0].n > 0) throw new Falla(409, 'Este criterio ya tiene notas registradas; no se puede quitar');
            const r = await new sql.Request(tx).input('id', sql.Int, id)
                .query('DELETE FROM CRITERIO_EVALUACION WHERE id_crit = @id');
            if (r.rowsAffected[0] === 0) throw new Falla(404, 'Criterio no encontrado');
        });
        res.json({ id_crit: id, quitado: true });
    } catch (error) {
        responderError(res, error);
    }
}

// POST /api/director/sincronizar — agrega a cada sección los cursos de su nivel y grado que le falten.
async function sincronizar(req, res) {
    try {
        const agregados = await enTransaccion(async (tx) => {
            const r = await new sql.Request(tx).query(`
                INSERT INTO SECCION_CURSO (id_sec, id_cur, docente_id)
                SELECT s.id_sec, c.id_cur, NULL
                FROM SECCION s
                INNER JOIN CURSO c ON c.nivel = s.nivel AND c.grado = s.grado
                WHERE NOT EXISTS (SELECT 1 FROM SECCION_CURSO x WHERE x.id_sec = s.id_sec AND x.id_cur = c.id_cur)`);
            return r.rowsAffected[0];
        });
        res.json({ agregados });
    } catch (error) {
        responderError(res, error);
    }
}

// GET /api/director/asignaciones/:id_sec — cursos de una sección, su docente y los docentes disponibles.
async function verAsignaciones(req, res) {
    try {
        const id_sec = parseInt(req.params.id_sec);
        if (Number.isNaN(id_sec)) return res.status(400).json({ error: 'Datos inválidos' });
        const pool = await conectarDB();

        const sec = await pool.request().input('id', sql.Int, id_sec)
            .query('SELECT id_sec, nivel, grado, letra FROM SECCION WHERE id_sec = @id');
        if (sec.recordset.length === 0) return res.status(404).json({ error: 'Sección no encontrada' });

        const cursos = await pool.request().input('id', sql.Int, id_sec)
            .query(`SELECT sc.id_seccur, c.id_cur, c.nombre AS curso, sc.docente_id AS id_docente
                    FROM SECCION_CURSO sc INNER JOIN CURSO c ON c.id_cur = sc.id_cur
                    WHERE sc.id_sec = @id ORDER BY c.nombre`);
        const docentes = await pool.request()
            .query(`SELECT id_usu, nombre, apellido FROM USUARIO
                    WHERE rol = 'Docente' AND activo = 1 ORDER BY apellido, nombre`);
        res.json({ seccion: sec.recordset[0], cursos: cursos.recordset, docentes: docentes.recordset });
    } catch (error) {
        responderError(res, error);
    }
}

// PUT /api/director/asignaciones/:id_seccur { id_docente | null, todas_las_secciones? }
// Asigna (o quita) el docente de un curso en una sección; con todas_las_secciones, en todas las del grado.
async function asignarDocente(req, res) {
    try {
        const id_seccur = parseInt(req.params.id_seccur);
        const id_docente = req.body.id_docente === null || req.body.id_docente === '' || req.body.id_docente === undefined
            ? null : parseInt(req.body.id_docente);
        const todas = req.body.todas_las_secciones === true;
        if (Number.isNaN(id_seccur) || Number.isNaN(id_docente)) return res.status(400).json({ error: 'Datos inválidos' });

        const resultado = await enTransaccion(async (tx) => {
            const fila = await new sql.Request(tx).input('id', sql.Int, id_seccur)
                .query('SELECT id_seccur, id_cur FROM SECCION_CURSO WHERE id_seccur = @id');
            if (fila.recordset.length === 0) throw new Falla(404, 'Asignación no encontrada');

            if (id_docente !== null) {
                const d = await new sql.Request(tx).input('id', sql.Int, id_docente)
                    .query("SELECT 1 AS x FROM USUARIO WHERE id_usu = @id AND rol = 'Docente' AND activo = 1");
                if (d.recordset.length === 0) throw new Falla(400, 'Ese usuario no es un docente activo');
            }

            const r = await new sql.Request(tx)
                .input('doc', sql.Int, id_docente)
                .input('id', sql.Int, id_seccur)
                .input('id_cur', sql.Int, fila.recordset[0].id_cur)
                .query(todas
                    ? 'UPDATE SECCION_CURSO SET docente_id = @doc WHERE id_cur = @id_cur'
                    : 'UPDATE SECCION_CURSO SET docente_id = @doc WHERE id_seccur = @id');
            return { actualizadas: r.rowsAffected[0] };
        });
        res.json({ id_seccur, id_docente, ...resultado });
    } catch (error) {
        responderError(res, error);
    }
}

module.exports = {
    listarCursos, crearCurso, quitarCurso, agregarCriterio, quitarCriterio,
    sincronizar, verAsignaciones, asignarDocente, copiarCursoASecciones,
};
