const { conectarDB, sql } = require('../config/db');
const { ANIO_ACADEMICO, ANIO_MATRICULA } = require('../config/anio');

async function obtenerPadres(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM PADRE');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function obtenerPadrePorId(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM PADRE WHERE id_pad = @id');

        if (resultado.recordset.length === 0) {
            return res.status(404).json({ error: 'Padre no encontrado' });
        }
        res.json(resultado.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function crearPadre(req, res) {
    try {
        const { nombre, apellido, dni, correo, id_usu } = req.body;

        if (!nombre || !apellido || !dni || !correo || !id_usu) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: nombre, apellido, dni, correo, id_usu'
            });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido', sql.VarChar, apellido)
            .input('dni', sql.VarChar, dni)
            .input('correo', sql.VarChar, correo)
            .input('id_usu', sql.Int, id_usu)
            .query(`INSERT INTO PADRE (nombre, apellido, dni, correo, id_usu)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @apellido, @dni, @correo, @id_usu)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
            return res.status(409).json({ error: 'Ese DNI ya está registrado, o este usuario ya tiene un padre asociado' });
        }
        res.status(500).json({ error: error.message });
    }
}

async function obtenerHijosDePadre(req, res) {
    try {
        const { id } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM ALUMNO WHERE id_pad = @id');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Datos del padre que inició sesión + sus hijos con todas sus matrículas.
async function obtenerMiPerfil(req, res) {
    try {
        const pool = await conectarDB();
        const padre = await pool.request()
            .input('id_usu', sql.Int, req.usuario.id_usu)
            .query('SELECT id_pad, nombre, apellido, dni, correo FROM PADRE WHERE id_usu = @id_usu');

        if (padre.recordset.length === 0) {
            return res.status(404).json({ error: 'Esta cuenta no tiene datos de apoderado registrados' });
        }
        const p = padre.recordset[0];

        const filas = await pool.request()
            .input('id_pad', sql.Int, p.id_pad)
            .query(`SELECT a.id_alu, a.nombre, a.apellido, a.dni,
                           m.id_mat, m.anio, m.estado,
                           s.id_sec, s.nivel, s.grado, s.letra
                    FROM ALUMNO a
                    LEFT JOIN MATRICULA m ON m.id_alu = a.id_alu
                    LEFT JOIN SECCION s ON m.id_sec = s.id_sec
                    WHERE a.id_pad = @id_pad
                    ORDER BY a.id_alu, m.anio DESC`);

        const hijos = [];
        for (const f of filas.recordset) {
            let h = hijos.find((x) => x.id_alu === f.id_alu);
            if (!h) {
                h = { id_alu: f.id_alu, nombre: f.nombre, apellido: f.apellido, dni: f.dni, matriculas: [] };
                hijos.push(h);
            }
            if (f.id_mat) {
                h.matriculas.push({
                    id_mat: f.id_mat, anio: f.anio, estado: f.estado,
                    id_sec: f.id_sec, nivel: f.nivel, grado: f.grado, letra: f.letra
                });
            }
        }

        res.json({ padre: p, anio_academico: ANIO_ACADEMICO, anio_matricula: ANIO_MATRICULA, hijos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerPadres, obtenerPadrePorId, crearPadre, obtenerHijosDePadre, obtenerMiPerfil };
