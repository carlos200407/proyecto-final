const { conectarDB, sql } = require('../config/db');

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

async function crearNotificacion(req, res) {
    try {
        const { id_alu, tipo, mensaje } = req.body;
        // Quien envía sale del token, no del cuerpo (antes se podía falsificar).
        const enviado_por = req.usuario.id_usu;

        if (!id_alu || !tipo || !mensaje) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios: id_alu, tipo, mensaje'
            });
        }

        const tiposValidos = ['Amonestacion', 'Citacion', 'Informativa'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `tipo debe ser uno de: ${tiposValidos.join(', ')}` });
        }

        if (String(mensaje).length > 1000) {
            return res.status(400).json({ error: 'El mensaje no puede pasar de 1000 caracteres' });
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
    } catch (error) {
        if ((error.message || '').includes('FK_notif_alumno')) {
            return res.status(404).json({ error: 'El alumno no existe' });
        }
        res.status(500).json({ error: error.message });
    }
}

module.exports = { obtenerNotificacionesDeAlumno, crearNotificacion };
