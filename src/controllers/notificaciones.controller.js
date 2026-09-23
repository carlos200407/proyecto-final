const { conectarDB, sql } = require('../config/db');

// GET /api/notificaciones/alumno/:id_alu - notificaciones de un alumno (para el portal del padre)
async function obtenerNotificacionesDeAlumno(req, res) {
    try {
        const { id_alu } = req.params;
        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_alu', sql.Int, id_alu)
            .query('SELECT * FROM NOTIFICACION WHERE id_alu = @id_alu ORDER BY fecha_envio DESC');
        res.json(resultado.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// POST /api/notificaciones - Administración envía una amonestación/citación
async function crearNotificacion(req, res) {
    try {
        const { id_alu, tipo, mensaje, enviado_por } = req.body;

        if (!id_alu || !tipo || !mensaje || !enviado_por) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_alu, tipo, mensaje, enviado_por'
            });
        }

        const tiposValidos = ['Amonestacion', 'Citacion', 'Informativa'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `tipo debe ser uno de: ${tiposValidos.join(', ')}` });
        }

        const pool = await conectarDB();
        const resultado = await pool.request()
            .input('id_alu', sql.Int, id_alu)
            .input('tipo', sql.VarChar, tipo)
            .input('mensaje', sql.VarChar, mensaje)
            .input('enviado_por', sql.Int, enviado_por)
            .query(`INSERT INTO NOTIFICACION (id_alu, tipo, mensaje, enviado_por)
                    OUTPUT INSERTED.*
                    VALUES (@id_alu, @tipo, @mensaje, @enviado_por)`);

        res.status(201).json(resultado.recordset[0]);
        // TODO: aquí más adelante conectas el envío real por correo (ej. con nodemailer)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerNotificacionesDeAlumno, crearNotificacion };
