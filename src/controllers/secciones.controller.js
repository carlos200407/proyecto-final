const { conectarDB, sql } = require('../config/db');
const { ANIO_MATRICULA } = require('../config/anio');

async function obtenerSecciones(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM SECCION');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function crearSeccion(req, res) {
    try {
        const { grado, letra, nivel } = req.body;
        const capacidad = req.body.capacidad === undefined ? 30 : Number(req.body.capacidad);

        if (!grado || !letra || !nivel) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: nivel, grado, letra' });
        }
        if (!['Primaria', 'Secundaria'].includes(nivel)) {
            return res.status(400).json({ error: 'nivel debe ser Primaria o Secundaria' });
        }
        if (!Number.isInteger(capacidad) || capacidad < 1) {
            return res.status(400).json({ error: 'capacidad debe ser un entero mayor que 0' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('grado', sql.VarChar, grado)
            .input('letra', sql.VarChar, letra)
            .input('nivel', sql.VarChar, nivel)
            .input('capacidad', sql.Int, capacidad)
            .query(`INSERT INTO SECCION (nivel, grado, letra, capacidad)
                    OUTPUT INSERTED.*
                    VALUES (@nivel, @grado, @letra, @capacidad)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UQ_seccion_nivel_grado_letra')) {
            return res.status(409).json({ error: 'Ya existe una sección con ese grado y letra' });
        }
        res.status(500).json({ error: error.message });
    }
}

// Vacantes por sección para el año de matrícula (pública: la usa la página principal y la matrícula).
async function obtenerVacantes(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('anio', sql.Int, ANIO_MATRICULA)
            .query(`SELECT s.id_sec, s.nivel, s.grado, s.letra, s.capacidad,
                           COUNT(m.id_mat) AS ocupadas,
                           s.capacidad - COUNT(m.id_mat) AS disponibles
                    FROM SECCION s
                    LEFT JOIN MATRICULA m ON m.id_sec = s.id_sec AND m.anio = @anio
                                         AND m.estado IN ('Activa', 'Pendiente')
                    GROUP BY s.id_sec, s.nivel, s.grado, s.letra, s.capacidad
                    ORDER BY CASE s.nivel WHEN 'Primaria' THEN 1 ELSE 2 END, s.grado, s.letra`);
        res.json({ anio: ANIO_MATRICULA, secciones: resultado.recordset });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerSecciones, crearSeccion, obtenerVacantes };
