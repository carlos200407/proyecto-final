const { conectarDB, sql } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ANIO_ACADEMICO, ANIO_MATRICULA } = require('../config/anio');

// Error con código HTTP para devolver mensajes claros desde dentro de una transacción.
class Falla extends Error {
    constructor(estado, mensaje) {
        super(mensaje);
        this.estado = estado;
    }
}

function responderError(res, error) {
    if (error instanceof Falla) return res.status(error.estado).json({ error: error.message });
    return res.status(500).json({ error: error.message });
}

// Ejecuta `trabajo(tx)` dentro de una transacción (commit si sale bien, rollback si falla).
async function enTransaccion(trabajo) {
    const pool = await conectarDB();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
        const resultado = await trabajo(tx);
        await tx.commit();
        return resultado;
    } catch (error) {
        try { await tx.rollback(); } catch { /* ya cerrada */ }
        throw error;
    }
}

async function cargarMatricula(tx, id_mat) {
    const r = await new sql.Request(tx)
        .input('id_mat', sql.Int, id_mat)
        .query(`SELECT m.id_mat, m.id_alu, m.id_sec, m.anio, m.estado, s.nivel, s.grado
                FROM MATRICULA m WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN SECCION s ON s.id_sec = m.id_sec
                WHERE m.id_mat = @id_mat`);
    if (r.recordset.length === 0) throw new Falla(404, 'Matrícula no encontrada');
    return r.recordset[0];
}

// Comprueba que la sección destino sea del mismo nivel y grado y que tenga vacante.
async function validarDestino(tx, mat, id_sec) {
    const s = await new sql.Request(tx)
        .input('id_sec', sql.Int, id_sec)
        .query(`SELECT id_sec, nivel, grado, letra, capacidad
                FROM SECCION WITH (UPDLOCK, HOLDLOCK) WHERE id_sec = @id_sec`);
    if (s.recordset.length === 0) throw new Falla(404, 'La sección elegida no existe');
    const destino = s.recordset[0];
    if (destino.nivel !== mat.nivel || destino.grado !== mat.grado) {
        throw new Falla(400, 'Solo se puede cambiar a otra sección del mismo nivel y grado');
    }
    const c = await new sql.Request(tx)
        .input('id_sec', sql.Int, id_sec)
        .input('anio', sql.Int, mat.anio)
        .input('id_mat', sql.Int, mat.id_mat)
        .query(`SELECT COUNT(*) AS ocupadas FROM MATRICULA
                WHERE id_sec = @id_sec AND anio = @anio AND id_mat <> @id_mat
                  AND estado IN ('Activa', 'Pendiente')`);
    if (c.recordset[0].ocupadas >= destino.capacidad) {
        throw new Falla(409, `La sección ${destino.grado}${destino.letra} ya no tiene vacantes`);
    }
}

async function asignarSeccion(tx, id_mat, id_sec) {
    await new sql.Request(tx)
        .input('id_mat', sql.Int, id_mat)
        .input('id_sec', sql.Int, id_sec)
        .query('UPDATE MATRICULA SET id_sec = @id_sec WHERE id_mat = @id_mat');
}

// GET /api/secretaria/pendientes — solicitudes de matrícula en línea por revisar.
async function listarPendientes(req, res) {
    try {
        const pool = await conectarDB();
        const r = await pool.request().query(`
            SELECT m.id_mat, m.anio, m.fecha_matricula,
                   a.id_alu, a.nombre, a.apellido, a.dni,
                   p.nombre AS ap_nombre, p.apellido AS ap_apellido, p.dni AS ap_dni, p.correo AS ap_correo,
                   s.id_sec, s.nivel, s.grado, s.letra
            FROM MATRICULA m
            INNER JOIN ALUMNO a ON a.id_alu = m.id_alu
            INNER JOIN PADRE p ON p.id_pad = a.id_pad
            INNER JOIN SECCION s ON s.id_sec = m.id_sec
            WHERE m.estado = 'Pendiente'
            ORDER BY m.fecha_matricula, m.id_mat`);
        res.json(r.recordset);
    } catch (error) {
        responderError(res, error);
    }
}

// PATCH /api/secretaria/matriculas/:id/confirmar  { id_sec? } — Pendiente -> Activa.
async function confirmarMatricula(req, res) {
    try {
        const id_mat = parseInt(req.params.id);
        const id_sec = req.body.id_sec === undefined ? null : parseInt(req.body.id_sec);
        if (Number.isNaN(id_mat) || (id_sec !== null && Number.isNaN(id_sec))) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        const resultado = await enTransaccion(async (tx) => {
            const mat = await cargarMatricula(tx, id_mat);
            if (mat.estado !== 'Pendiente') throw new Falla(409, 'Esta matrícula ya fue atendida');
            let seccion = mat.id_sec;
            if (id_sec !== null && id_sec !== mat.id_sec) {
                await validarDestino(tx, mat, id_sec);
                await asignarSeccion(tx, id_mat, id_sec);
                seccion = id_sec;
            }
            await new sql.Request(tx)
                .input('id_mat', sql.Int, id_mat)
                .query("UPDATE MATRICULA SET estado = 'Activa' WHERE id_mat = @id_mat");
            return { id_mat, estado: 'Activa', id_sec: seccion };
        });
        res.json(resultado);
    } catch (error) {
        responderError(res, error);
    }
}

// DELETE /api/secretaria/matriculas/:id — rechaza (borra) una solicitud Pendiente.
async function rechazarMatricula(req, res) {
    try {
        const id_mat = parseInt(req.params.id);
        if (Number.isNaN(id_mat)) return res.status(400).json({ error: 'Datos inválidos' });

        await enTransaccion(async (tx) => {
            const mat = await cargarMatricula(tx, id_mat);
            if (mat.estado !== 'Pendiente') throw new Falla(409, 'Solo se pueden rechazar solicitudes pendientes');
            await new sql.Request(tx)
                .input('id_mat', sql.Int, id_mat)
                .query('DELETE FROM MATRICULA WHERE id_mat = @id_mat');
        });
        res.json({ id_mat, rechazada: true });
    } catch (error) {
        responderError(res, error);
    }
}

// PATCH /api/secretaria/matriculas/:id/seccion  { id_sec } — cambia de sección (si aún no tiene notas ni asistencias).
async function moverMatricula(req, res) {
    try {
        const id_mat = parseInt(req.params.id);
        const id_sec = parseInt(req.body.id_sec);
        if (Number.isNaN(id_mat) || Number.isNaN(id_sec)) return res.status(400).json({ error: 'Datos inválidos' });

        const resultado = await enTransaccion(async (tx) => {
            const mat = await cargarMatricula(tx, id_mat);
            if (!['Activa', 'Pendiente'].includes(mat.estado)) {
                throw new Falla(409, 'Solo se puede mover una matrícula activa o pendiente');
            }
            const uso = await new sql.Request(tx)
                .input('id_mat', sql.Int, id_mat)
                .query(`SELECT (SELECT COUNT(*) FROM NOTA WHERE id_mat = @id_mat)
                      + (SELECT COUNT(*) FROM ASISTENCIA WHERE id_mat = @id_mat) AS registros`);
            if (uso.recordset[0].registros > 0) {
                throw new Falla(409, 'Este alumno ya tiene notas o asistencias en su sección; no se puede cambiar');
            }
            if (id_sec !== mat.id_sec) {
                await validarDestino(tx, mat, id_sec);
                await asignarSeccion(tx, id_mat, id_sec);
            }
            return { id_mat, id_sec };
        });
        res.json(resultado);
    } catch (error) {
        responderError(res, error);
    }
}

// PATCH /api/secretaria/matriculas/:id/retirar — Activa -> Retirada (libera la vacante).
async function retirarMatricula(req, res) {
    try {
        const id_mat = parseInt(req.params.id);
        if (Number.isNaN(id_mat)) return res.status(400).json({ error: 'Datos inválidos' });

        await enTransaccion(async (tx) => {
            const mat = await cargarMatricula(tx, id_mat);
            if (mat.estado !== 'Activa') throw new Falla(409, 'Solo se puede retirar una matrícula activa');
            await new sql.Request(tx)
                .input('id_mat', sql.Int, id_mat)
                .query("UPDATE MATRICULA SET estado = 'Retirada' WHERE id_mat = @id_mat");
        });
        res.json({ id_mat, estado: 'Retirada' });
    } catch (error) {
        responderError(res, error);
    }
}

// GET /api/secretaria/nomina/:id_sec — alumnos de una sección en el año de matrícula.
async function nominaSeccion(req, res) {
    try {
        const id_sec = parseInt(req.params.id_sec);
        if (Number.isNaN(id_sec)) return res.status(400).json({ error: 'Datos inválidos' });

        const pool = await conectarDB();
        const r = await pool.request()
            .input('id_sec', sql.Int, id_sec)
            .input('anio', sql.Int, ANIO_MATRICULA)
            .query(`SELECT m.id_mat, m.estado, a.nombre, a.apellido, a.dni,
                           CASE WHEN EXISTS (SELECT 1 FROM NOTA n WHERE n.id_mat = m.id_mat)
                                  OR EXISTS (SELECT 1 FROM ASISTENCIA x WHERE x.id_mat = m.id_mat)
                                THEN 0 ELSE 1 END AS movible
                    FROM MATRICULA m
                    INNER JOIN ALUMNO a ON a.id_alu = m.id_alu
                    WHERE m.id_sec = @id_sec AND m.anio = @anio AND m.estado IN ('Activa', 'Pendiente')
                    ORDER BY a.apellido, a.nombre`);
        res.json({ anio: ANIO_MATRICULA, alumnos: r.recordset });
    } catch (error) {
        responderError(res, error);
    }
}


// ---------------------------------------------------------------------------
// Matrícula presencial: la secretaria registra al apoderado, al alumno y deja la matrícula 'Activa'.
// ---------------------------------------------------------------------------
const soloDigitos8 = (v) => /^[0-9]{8}$/.test(String(v ?? ''));
const limpio = (v) => String(v ?? '').trim();

// POST /api/secretaria/matricula-presencial
// { apoderado: { dni, nombre, apellido, correo }, alumno: { dni, nombre, apellido }, nivel, grado, id_sec? }
async function matricularPresencial(req, res) {
    const ap = req.body.apoderado || {};
    const al = req.body.alumno || {};
    const nivel = limpio(req.body.nivel);
    const grado = limpio(req.body.grado);
    const id_sec_pedida = req.body.id_sec ? parseInt(req.body.id_sec) : null;

    if (!limpio(ap.dni) || !limpio(ap.nombre) || !limpio(ap.apellido) || !limpio(ap.correo)) {
        return res.status(400).json({ error: 'Faltan datos del apoderado (DNI, nombres, apellidos y correo)' });
    }
    if (!limpio(al.dni) || !limpio(al.nombre) || !limpio(al.apellido) || !nivel || !grado) {
        return res.status(400).json({ error: 'Faltan datos del alumno (DNI, nombres, apellidos, nivel y grado)' });
    }
    if (!soloDigitos8(ap.dni) || !soloDigitos8(al.dni)) {
        return res.status(400).json({ error: 'Los DNI deben tener 8 dígitos' });
    }
    if (!['Primaria', 'Secundaria'].includes(nivel)) {
        return res.status(400).json({ error: 'nivel debe ser Primaria o Secundaria' });
    }

    try {
        const resultado = await enTransaccion(async (tx) => {
            // 1) Apoderado: se reutiliza si ya existe por DNI; si no, se crea su cuenta con clave temporal.
            let id_pad;
            let clave_temporal = null;
            const padre = await new sql.Request(tx)
                .input('dni', sql.VarChar, limpio(ap.dni))
                .query('SELECT id_pad FROM PADRE WHERE dni = @dni');
            if (padre.recordset.length > 0) {
                id_pad = padre.recordset[0].id_pad;
            } else {
                clave_temporal = 'Temp-' + crypto.randomInt(1000, 10000);
                const hash = await bcrypt.hash(clave_temporal, 10);
                const u = await new sql.Request(tx)
                    .input('nombre', sql.VarChar, limpio(ap.nombre))
                    .input('apellido', sql.VarChar, limpio(ap.apellido))
                    .input('correo', sql.VarChar, limpio(ap.correo))
                    .input('hash', sql.VarChar, hash)
                    .query(`INSERT INTO USUARIO (nombre, apellido, correo, password_hash, rol, primer_ingreso)
                            OUTPUT INSERTED.id_usu
                            VALUES (@nombre, @apellido, @correo, @hash, 'Padre', 1)`);
                const p = await new sql.Request(tx)
                    .input('nombre', sql.VarChar, limpio(ap.nombre))
                    .input('apellido', sql.VarChar, limpio(ap.apellido))
                    .input('dni', sql.VarChar, limpio(ap.dni))
                    .input('correo', sql.VarChar, limpio(ap.correo))
                    .input('id_usu', sql.Int, u.recordset[0].id_usu)
                    .query(`INSERT INTO PADRE (nombre, apellido, dni, correo, id_usu)
                            OUTPUT INSERTED.id_pad
                            VALUES (@nombre, @apellido, @dni, @correo, @id_usu)`);
                id_pad = p.recordset[0].id_pad;
            }

            // 2) Alumno: se reutiliza solo si ya es hijo de ese mismo apoderado.
            let id_alu;
            const alumno = await new sql.Request(tx)
                .input('dni', sql.VarChar, limpio(al.dni))
                .query('SELECT id_alu, id_pad FROM ALUMNO WHERE dni = @dni');
            if (alumno.recordset.length > 0) {
                if (alumno.recordset[0].id_pad !== id_pad) {
                    throw new Falla(409, 'Ese DNI de alumno ya está registrado con otro apoderado');
                }
                id_alu = alumno.recordset[0].id_alu;
            } else {
                const a = await new sql.Request(tx)
                    .input('nombre', sql.VarChar, limpio(al.nombre))
                    .input('apellido', sql.VarChar, limpio(al.apellido))
                    .input('dni', sql.VarChar, limpio(al.dni))
                    .input('id_pad', sql.Int, id_pad)
                    .query(`INSERT INTO ALUMNO (nombre, apellido, dni, id_pad)
                            OUTPUT INSERTED.id_alu VALUES (@nombre, @apellido, @dni, @id_pad)`);
                id_alu = a.recordset[0].id_alu;
            }

            // 3) Sección: la elegida (si tiene vacante) o la primera del grado con vacante.
            const candidatas = await new sql.Request(tx)
                .input('nivel', sql.VarChar, nivel)
                .input('grado', sql.VarChar, grado)
                .input('anio', sql.Int, ANIO_MATRICULA)
                .query(`SELECT s.id_sec, s.letra, s.capacidad,
                               (SELECT COUNT(*) FROM MATRICULA m WHERE m.id_sec = s.id_sec AND m.anio = @anio
                                  AND m.estado IN ('Activa', 'Pendiente')) AS ocupadas
                        FROM SECCION s WITH (UPDLOCK, HOLDLOCK)
                        WHERE s.nivel = @nivel AND s.grado = @grado
                        ORDER BY s.letra`);
            if (candidatas.recordset.length === 0) throw new Falla(404, 'No existe ese nivel y grado');
            let sec;
            if (id_sec_pedida) {
                sec = candidatas.recordset.find((c) => c.id_sec === id_sec_pedida);
                if (!sec) throw new Falla(400, 'La sección elegida no pertenece a ese nivel y grado');
                if (sec.ocupadas >= sec.capacidad) throw new Falla(409, `La sección ${grado}${sec.letra} no tiene vacantes`);
            } else {
                sec = candidatas.recordset.find((c) => c.ocupadas < c.capacidad);
                if (!sec) throw new Falla(409, 'No hay vacantes disponibles en ese grado');
            }

            // 4) Matrícula directa (Activa), registrada por quien la hace.
            const m = await new sql.Request(tx)
                .input('id_alu', sql.Int, id_alu)
                .input('id_sec', sql.Int, sec.id_sec)
                .input('anio', sql.Int, ANIO_MATRICULA)
                .input('registrado_por', sql.Int, req.usuario.id_usu)
                .query(`INSERT INTO MATRICULA (id_alu, id_sec, anio, estado, registrado_por)
                        OUTPUT INSERTED.id_mat, INSERTED.anio, INSERTED.estado
                        VALUES (@id_alu, @id_sec, @anio, 'Activa', @registrado_por)`);

            return {
                ...m.recordset[0], id_alu, id_pad, nivel, grado, letra: sec.letra,
                apoderado_existente: clave_temporal === null,
                clave_temporal,
            };
        });
        res.status(201).json(resultado);
    } catch (error) {
        res.status(estadoPorDuplicado(error).estado).json({ error: estadoPorDuplicado(error).mensaje });
    }
}

// Traduce errores de llaves duplicadas de SQL Server a mensajes claros.
function estadoPorDuplicado(error) {
    if (error instanceof Falla) return { estado: error.estado, mensaje: error.message };
    const msg = error.message || '';
    if (msg.includes('UQ_matricula_alumno_anio')) return { estado: 409, mensaje: 'Este alumno ya tiene una matrícula para ese año' };
    if (msg.includes('dbo.USUARIO')) return { estado: 409, mensaje: 'Ese correo ya está registrado' };
    if (msg.includes('dbo.PADRE')) return { estado: 409, mensaje: 'Ese DNI de apoderado ya está registrado' };
    if (msg.includes('dbo.ALUMNO')) return { estado: 409, mensaje: 'Ese DNI de alumno ya está registrado' };
    return { estado: 500, mensaje: msg };
}

// ---------------------------------------------------------------------------
// Directorio: buscar y corregir datos de alumnos y apoderados.
// ---------------------------------------------------------------------------

// GET /api/secretaria/buscar?q=texto — por nombre, apellido o DNI (alumno o apoderado). Máx. 30.
async function buscar(req, res) {
    try {
        const q = limpio(req.query.q);
        if (q.length < 2) return res.status(400).json({ error: 'Escribe al menos 2 caracteres para buscar' });
        const patron = `%${q.replace(/[\\%_[]/g, (c) => `\\${c}`)}%`;

        const pool = await conectarDB();
        const r = await pool.request()
            .input('p', sql.VarChar, patron)
            .query(`SELECT TOP 30
                        a.id_alu, a.nombre, a.apellido, a.dni,
                        p.id_pad, p.nombre AS ap_nombre, p.apellido AS ap_apellido, p.dni AS ap_dni, p.correo AS ap_correo,
                        mt.anio, mt.estado, mt.nivel, mt.grado, mt.letra
                    FROM ALUMNO a
                    INNER JOIN PADRE p ON p.id_pad = a.id_pad
                    OUTER APPLY (SELECT TOP 1 m.anio, m.estado, s.nivel, s.grado, s.letra
                                 FROM MATRICULA m INNER JOIN SECCION s ON s.id_sec = m.id_sec
                                 WHERE m.id_alu = a.id_alu ORDER BY m.anio DESC, m.id_mat DESC) mt
                    WHERE a.nombre LIKE @p ESCAPE '\\' OR a.apellido LIKE @p ESCAPE '\\' OR a.dni LIKE @p ESCAPE '\\'
                       OR (a.nombre + ' ' + a.apellido) LIKE @p ESCAPE '\\'
                       OR p.nombre LIKE @p ESCAPE '\\' OR p.apellido LIKE @p ESCAPE '\\' OR p.dni LIKE @p ESCAPE '\\'
                    ORDER BY a.apellido, a.nombre`);
        res.json(r.recordset);
    } catch (error) {
        responderError(res, error);
    }
}

// PATCH /api/secretaria/alumnos/:id  { nombre, apellido, dni }
async function editarAlumno(req, res) {
    try {
        const id = parseInt(req.params.id);
        const nombre = limpio(req.body.nombre), apellido = limpio(req.body.apellido), dni = limpio(req.body.dni);
        if (Number.isNaN(id) || !nombre || !apellido) return res.status(400).json({ error: 'Faltan nombres o apellidos' });
        if (!soloDigitos8(dni)) return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });

        const pool = await conectarDB();
        const r = await pool.request()
            .input('id', sql.Int, id).input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido).input('dni', sql.VarChar, dni)
            .query(`UPDATE ALUMNO SET nombre = @nombre, apellido = @apellido, dni = @dni
                    OUTPUT INSERTED.id_alu, INSERTED.nombre, INSERTED.apellido, INSERTED.dni
                    WHERE id_alu = @id`);
        if (r.recordset.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
        res.json(r.recordset[0]);
    } catch (error) {
        const e = estadoPorDuplicado(error);
        res.status(e.estado).json({ error: e.mensaje });
    }
}

// PATCH /api/secretaria/apoderados/:id  { nombre, apellido, dni, correo }
// El correo es el usuario con el que ingresa, así que también se actualiza en su cuenta.
async function editarApoderado(req, res) {
    try {
        const id = parseInt(req.params.id);
        const nombre = limpio(req.body.nombre), apellido = limpio(req.body.apellido);
        const dni = limpio(req.body.dni), correo = limpio(req.body.correo);
        if (Number.isNaN(id) || !nombre || !apellido || !correo) return res.status(400).json({ error: 'Faltan nombres, apellidos o correo' });
        if (!soloDigitos8(dni)) return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
        if (!/^\S+@\S+\.\S+$/.test(correo)) return res.status(400).json({ error: 'El correo no es válido' });

        const resultado = await enTransaccion(async (tx) => {
            const p = await new sql.Request(tx)
                .input('id', sql.Int, id).input('nombre', sql.VarChar, nombre)
                .input('apellido', sql.VarChar, apellido).input('dni', sql.VarChar, dni)
                .input('correo', sql.VarChar, correo)
                .query(`UPDATE PADRE SET nombre = @nombre, apellido = @apellido, dni = @dni, correo = @correo
                        OUTPUT INSERTED.id_pad, INSERTED.id_usu, INSERTED.nombre, INSERTED.apellido, INSERTED.dni, INSERTED.correo
                        WHERE id_pad = @id`);
            if (p.recordset.length === 0) throw new Falla(404, 'Apoderado no encontrado');
            const fila = p.recordset[0];
            await new sql.Request(tx)
                .input('id_usu', sql.Int, fila.id_usu).input('nombre', sql.VarChar, nombre)
                .input('apellido', sql.VarChar, apellido).input('correo', sql.VarChar, correo)
                .query('UPDATE USUARIO SET nombre = @nombre, apellido = @apellido, correo = @correo WHERE id_usu = @id_usu');
            return { id_pad: fila.id_pad, nombre, apellido, dni, correo };
        });
        res.json(resultado);
    } catch (error) {
        const e = estadoPorDuplicado(error);
        res.status(e.estado).json({ error: e.mensaje });
    }
}

// ---------------------------------------------------------------------------
// Avisos: amonestaciones, citaciones e informativos.
// ---------------------------------------------------------------------------
const TIPOS_AVISO = ['Amonestacion', 'Citacion', 'Informativa'];

// GET /api/secretaria/avisos — los últimos 50 enviados.
async function listarAvisos(req, res) {
    try {
        const pool = await conectarDB();
        const r = await pool.request().query(`
            SELECT TOP 50 n.id_notif, n.tipo, n.mensaje, n.fecha_envio,
                   a.nombre, a.apellido, u.nombre AS env_nombre, u.apellido AS env_apellido
            FROM NOTIFICACION n
            INNER JOIN ALUMNO a ON a.id_alu = n.id_alu
            INNER JOIN USUARIO u ON u.id_usu = n.enviado_por
            ORDER BY n.fecha_envio DESC, n.id_notif DESC`);
        res.json(r.recordset);
    } catch (error) {
        responderError(res, error);
    }
}

// POST /api/secretaria/avisos/seccion  { id_sec, tipo, mensaje } — a todos los alumnos activos de una sección.
async function avisoASeccion(req, res) {
    try {
        const id_sec = parseInt(req.body.id_sec);
        const tipo = limpio(req.body.tipo);
        const mensaje = limpio(req.body.mensaje);
        if (Number.isNaN(id_sec) || !mensaje) return res.status(400).json({ error: 'Faltan la sección o el mensaje' });
        if (!TIPOS_AVISO.includes(tipo)) return res.status(400).json({ error: `tipo debe ser uno de: ${TIPOS_AVISO.join(', ')}` });
        if (mensaje.length > 1000) return res.status(400).json({ error: 'El mensaje no puede pasar de 1000 caracteres' });

        const pool = await conectarDB();
        const r = await pool.request()
            .input('id_sec', sql.Int, id_sec).input('anio', sql.Int, ANIO_ACADEMICO)
            .input('tipo', sql.VarChar, tipo).input('mensaje', sql.VarChar, mensaje)
            .input('enviado_por', sql.Int, req.usuario.id_usu)
            .query(`INSERT INTO NOTIFICACION (id_alu, tipo, mensaje, enviado_por)
                    SELECT m.id_alu, @tipo, @mensaje, @enviado_por
                    FROM MATRICULA m
                    WHERE m.id_sec = @id_sec AND m.anio = @anio AND m.estado = 'Activa'`);
        const enviados = r.rowsAffected[0];
        if (enviados === 0) return res.status(404).json({ error: `Esa sección no tiene alumnos activos en ${ANIO_ACADEMICO}` });
        res.status(201).json({ enviados });
    } catch (error) {
        responderError(res, error);
    }
}

module.exports = {
    listarPendientes, confirmarMatricula, rechazarMatricula, moverMatricula, retirarMatricula, nominaSeccion,
    matricularPresencial, buscar, editarAlumno, editarApoderado, listarAvisos, avisoASeccion,
};
