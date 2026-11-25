/* =====================================================================
   BORRAR LOS DATOS FICTICIOS (los que crea datos_demo.sql)
   Identifica lo demo por el correo: cuentas @demo.pe y los alumnos de esos padres.
   Todo en una transacción: si algo falla, no se borra nada.
   NO toca usuarios, alumnos ni notas que no sean demo.
   ===================================================================== */
USE SIMAE;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Quiénes son "demo"
SELECT id_usu INTO #u FROM USUARIO WHERE correo LIKE N'%@demo.pe';

SELECT a.id_alu INTO #a
FROM ALUMNO a
INNER JOIN PADRE p ON a.id_pad = p.id_pad
WHERE p.id_usu IN (SELECT id_usu FROM #u);

SELECT id_mat INTO #m
FROM MATRICULA
WHERE id_alu IN (SELECT id_alu FROM #a) OR registrado_por IN (SELECT id_usu FROM #u);

-- Cursos que usan los docentes demo
SELECT DISTINCT id_cur INTO #c FROM SECCION_CURSO WHERE docente_id IN (SELECT id_usu FROM #u);

-- De lo más dependiente a lo menos
DELETE FROM NOTIFICACION WHERE id_alu IN (SELECT id_alu FROM #a) OR enviado_por IN (SELECT id_usu FROM #u);
DELETE FROM NOTA        WHERE id_mat IN (SELECT id_mat FROM #m);
DELETE FROM ASISTENCIA  WHERE id_mat IN (SELECT id_mat FROM #m);
DELETE FROM MATRICULA   WHERE id_mat IN (SELECT id_mat FROM #m);
DELETE FROM ALUMNO      WHERE id_alu IN (SELECT id_alu FROM #a);
DELETE FROM PADRE       WHERE id_usu IN (SELECT id_usu FROM #u);
DELETE FROM SECCION_CURSO WHERE docente_id IN (SELECT id_usu FROM #u);

-- Criterios y cursos demo (solo si ya nadie los usa)
DELETE FROM CRITERIO_EVALUACION
WHERE id_cur IN (SELECT id_cur FROM #c)
  AND NOT EXISTS (SELECT 1 FROM NOTA n WHERE n.id_crit = CRITERIO_EVALUACION.id_crit);
DELETE FROM CURSO
WHERE id_cur IN (SELECT id_cur FROM #c)
  AND NOT EXISTS (SELECT 1 FROM CRITERIO_EVALUACION ce WHERE ce.id_cur = CURSO.id_cur)
  AND NOT EXISTS (SELECT 1 FROM SECCION_CURSO sc WHERE sc.id_cur = CURSO.id_cur);

-- Las 12 secciones demo, solo si quedaron vacías (sin matrículas ni cursos)
DELETE FROM SECCION
WHERE ((nivel = N'Primaria'   AND letra = N'A' AND grado IN (N'1°', N'2°', N'3°', N'4°', N'5°', N'6°'))
    OR (nivel = N'Secundaria' AND letra = N'A' AND grado IN (N'1°', N'2°', N'3°', N'4°', N'5°'))
    OR (nivel = N'Secundaria' AND letra = N'B' AND grado = N'3°'))
  AND NOT EXISTS (SELECT 1 FROM MATRICULA m WHERE m.id_sec = SECCION.id_sec)
  AND NOT EXISTS (SELECT 1 FROM SECCION_CURSO sc WHERE sc.id_sec = SECCION.id_sec);

DELETE FROM USUARIO WHERE id_usu IN (SELECT id_usu FROM #u);

COMMIT TRANSACTION;

SELECT 'Usuarios que quedan' AS tabla, COUNT(*) AS filas FROM USUARIO
UNION ALL SELECT 'Alumnos', COUNT(*) FROM ALUMNO
UNION ALL SELECT 'Secciones', COUNT(*) FROM SECCION;

DROP TABLE #u, #a, #m, #c;
GO
