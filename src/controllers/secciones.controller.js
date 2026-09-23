const { conectarDB, sql } = require('../config/db');

// GET /api/secciones
async function obtenerSecciones(req, res) {
    try {
        const pool = await conectarDB();
        const resultado = await pool.request().query('SELECT * FROM SECCION');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/secciones - el director crea un salón nuevo
async function crearSeccion(req, res) {
    try {
        const { grado, letra } = req.body;

        if (!grado || !letra) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: grado, letra' });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('grado', sql.VarChar, grado)
            .input('letra', sql.VarChar, letra)
            .query(`INSERT INTO SECCION (grado, letra)
                    OUTPUT INSERTED.*
                    VALUES (@grado, @letra)`);

        res.status(201).json(resultado.recordset[0]);
    } catch (error) {
        if (error.message.includes('UQ_seccion_grado_letra')) {
            return res.status(409).json({ error: 'Ya existe una sección con ese grado y letra' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerSecciones, crearSeccion };
