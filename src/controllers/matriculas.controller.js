const { conectarDB, sql } = require('../config/db');
const { ANIO_MATRICULA } = require('../config/anio');

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

async function crearMatricula(req, res) {
    try {
        const { id_alu, id_sec, anio } = req.body;
        // Quien registra sale del token, no del cuerpo (antes se podía falsificar).
        const registrado_por = req.usuario.id_usu;

        if (!id_alu || !id_sec || !anio) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_alu, id_sec, anio'
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
        if (error.message.includes('UQ_matricula_alumno_anio')) {
            return res.status(409).json({ error: 'Este alumno ya está matriculado ese año' });
        }
        res.status(500).json({ error: error.message });
    }
}

// Matrícula en línea de un padre: crea (o reutiliza) al alumno y lo deja 'Pendiente' en la
// primera sección del nivel/grado que tenga vacante. La secretaría la confirma después.
async function matricularEnLinea(req, res) {
    const { nombre, apellido, dni, nivel, grado } = req.body;

    if (!nombre || !apellido || !dni || !nivel || !grado) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, apellido, dni, nivel, grado' });
    }
    if (!/^[0-9]{8}$/.test(dni)) {
        return res.status(400).json({ error: 'El DNI del alumno debe tener 8 dígitos' });
    }
    if (!['Primaria', 'Secundaria'].includes(nivel)) {
        return res.status(400).json({ error: 'nivel debe ser Primaria o Secundaria' });
    }

    let tx;
    try {
        const pool = await conectarDB();
        tx = new sql.Transaction(pool);
        await tx.begin();

        const padre = await new sql.Request(tx)
            .input('id_usu', sql.Int, req.usuario.id_usu)
            .query('SELECT id_pad FROM PADRE WHERE id_usu = @id_usu');
        if (padre.recordset.length === 0) {
            await tx.rollback();
            return res.status(404).json({ error: 'Esta cuenta no tiene datos de apoderado registrados' });
        }
        const id_pad = padre.recordset[0].id_pad;

        // ¿El alumno ya existe (por DNI)? Solo se reutiliza si es hijo de este mismo padre.
        let id_alu;
        const existente = await new sql.Request(tx)
            .input('dni', sql.VarChar, dni)
            .query('SELECT id_alu, id_pad FROM ALUMNO WHERE dni = @dni');
        if (existente.recordset.length > 0) {
            if (existente.recordset[0].id_pad !== id_pad) {
                await tx.rollback();
                return res.status(409).json({ error: 'Ese DNI ya está registrado con otro apoderado. Acércate a secretaría.' });
            }
            id_alu = existente.recordset[0].id_alu;
        } else {
            const nuevo = await new sql.Request(tx)
                .input('nombre', sql.VarChar, nombre)
                .input('apellido', sql.VarChar, apellido)
                .input('dni', sql.VarChar, dni)
                .input('id_pad', sql.Int, id_pad)
                .query(`INSERT INTO ALUMNO (nombre, apellido, dni, id_pad)
                        OUTPUT INSERTED.id_alu
                        VALUES (@nombre, @apellido, @dni, @id_pad)`);
            id_alu = nuevo.recordset[0].id_alu;
        }

        // Primera sección con vacante en ese nivel y grado.
        const seccion = await new sql.Request(tx)
            .input('nivel', sql.VarChar, nivel)
            .input('grado', sql.VarChar, grado)
            .input('anio', sql.Int, ANIO_MATRICULA)
            .query(`SELECT TOP 1 s.id_sec, s.nivel, s.grado, s.letra
                    FROM SECCION s
                    WHERE s.nivel = @nivel AND s.grado = @grado
                      AND s.capacidad > (SELECT COUNT(*) FROM MATRICULA m
                                         WHERE m.id_sec = s.id_sec AND m.anio = @anio
                                           AND m.estado IN ('Activa', 'Pendiente'))
                    ORDER BY s.letra`);
        if (seccion.recordset.length === 0) {
            await tx.rollback();
            return res.status(409).json({ error: 'No hay vacantes disponibles en ese grado.' });
        }
        const sec = seccion.recordset[0];

        const mat = await new sql.Request(tx)
            .input('id_alu', sql.Int, id_alu)
            .input('id_sec', sql.Int, sec.id_sec)
            .input('anio', sql.Int, ANIO_MATRICULA)
            .input('registrado_por', sql.Int, req.usuario.id_usu)
            .query(`INSERT INTO MATRICULA (id_alu, id_sec, anio, estado, registrado_por)
                    OUTPUT INSERTED.id_mat, INSERTED.anio, INSERTED.estado
                    VALUES (@id_alu, @id_sec, @anio, 'Pendiente', @registrado_por)`);

        await tx.commit();
        res.status(201).json({ ...mat.recordset[0], id_alu, seccion: sec });
    } catch (error) {
        if (tx) { try { await tx.rollback(); } catch { /* ya cerrada */ } }
        if ((error.message || '').includes('UQ_matricula_alumno_anio')) {
            return res.status(409).json({ error: 'Este alumno ya tiene una matrícula para ese año.' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerMatriculas, obtenerMatriculaPorId, crearMatricula, matricularEnLinea };
