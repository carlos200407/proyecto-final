const { conectarDB, sql } = require('../config/db');

// Un padre solo puede ver datos de SUS hijos. El resto de roles pasa.
// (Sin esto, cualquier padre con sesión podía pedir /api/notas/matricula/<cualquier id>.)

async function matriculaDelPadre(req, res, next) {
    if (req.usuario.rol !== 'Padre') return next();
    try {
        const pool = await conectarDB();
        const r = await pool.request()
            .input('id_mat', sql.Int, req.params.id_mat)
            .input('id_usu', sql.Int, req.usuario.id_usu)
            .query(`SELECT 1 AS ok
                    FROM MATRICULA m
                    INNER JOIN ALUMNO a ON m.id_alu = a.id_alu
                    INNER JOIN PADRE p ON a.id_pad = p.id_pad
                    WHERE m.id_mat = @id_mat AND p.id_usu = @id_usu`);
        if (r.recordset.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para ver esta información' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function alumnoDelPadre(req, res, next) {
    if (req.usuario.rol !== 'Padre') return next();
    try {
        const pool = await conectarDB();
        const r = await pool.request()
            .input('id_alu', sql.Int, req.params.id_alu)
            .input('id_usu', sql.Int, req.usuario.id_usu)
            .query(`SELECT 1 AS ok
                    FROM ALUMNO a
                    INNER JOIN PADRE p ON a.id_pad = p.id_pad
                    WHERE a.id_alu = @id_alu AND p.id_usu = @id_usu`);
        if (r.recordset.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para ver esta información' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { matriculaDelPadre, alumnoDelPadre };
