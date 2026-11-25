const { conectarDB, sql } = require('../config/db');
const { ANIO_ACADEMICO } = require('../config/anio');

// Promedios por sección para el dashboard del director.
// Promedio del curso = media aritmética de sus criterios; promedio del alumno = media de sus cursos.
// Aprobado = promedio del alumno >= 11 (escala 0-20).
async function calificaciones(req, res) {
    try {
        const pool = await conectarDB();
        const r = await pool.request()
            .input('anio', sql.Int, ANIO_ACADEMICO)
            .query(`WITH prom_curso AS (
                        SELECT n.id_mat, ce.id_cur, AVG(n.valor) AS prom
                        FROM NOTA n
                        INNER JOIN CRITERIO_EVALUACION ce ON n.id_crit = ce.id_crit
                        GROUP BY n.id_mat, ce.id_cur
                    ),
                    prom_alumno AS (
                        SELECT id_mat, AVG(prom) AS prom FROM prom_curso GROUP BY id_mat
                    )
                    SELECT s.id_sec, s.nivel, s.grado, s.letra,
                           COUNT(pa.id_mat) AS alumnos,
                           CAST(AVG(pa.prom) AS DECIMAL(5,2)) AS promedio,
                           SUM(CASE WHEN pa.prom >= 11 THEN 1 ELSE 0 END) AS aprobados
                    FROM SECCION s
                    INNER JOIN MATRICULA m ON m.id_sec = s.id_sec AND m.anio = @anio AND m.estado = 'Activa'
                    INNER JOIN prom_alumno pa ON pa.id_mat = m.id_mat
                    GROUP BY s.id_sec, s.nivel, s.grado, s.letra
                    ORDER BY CASE s.nivel WHEN 'Primaria' THEN 1 ELSE 2 END, s.grado, s.letra`);
        res.json({ anio: ANIO_ACADEMICO, secciones: r.recordset });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { calificaciones };
