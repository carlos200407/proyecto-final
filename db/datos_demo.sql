/* =====================================================================
   DATOS FICTICIOS PARA PROBAR SIMAE
   ---------------------------------------------------------------------
   ANTES: ejecutar db/migracion_01_nivel_capacidad.sql (una sola vez).
   Este script va TODO en un solo bloque y dentro de una transacción:
   si algo falla, no se guarda nada. Si lo corres dos veces te avisa.
   Para quitar estos datos: db/borrar_datos_demo.sql

   Qué crea (todos los correos terminan en @demo.pe):
     - 1 Director, 1 Secretaria, 11 docentes
     - 12 secciones (Primaria 1°A a 6°A, Secundaria 1°A a 5°A y 3°B)
     - cursos, criterios (Examen/Práctica/Tarea) y asignación de docentes
     - 64 padres con cuenta, 96 alumnos matriculados (año actual, 'Activa')
     - 3 alumnos nuevos con matrícula del año siguiente 'Pendiente'
       (dejan SIN vacantes a Primaria 1° para probar ese caso)
     - notas, asistencia y algunas notificaciones

   CLAVES:  todos los usuarios usan  Demo1234
            excepto docente11@demo.pe  ->  Temp-1234 (obliga a cambiarla)
   ===================================================================== */
USE SIMAE;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF COL_LENGTH('dbo.SECCION', 'nivel') IS NULL
BEGIN
    PRINT 'ERROR: primero ejecuta db/migracion_01_nivel_capacidad.sql';
    RETURN;
END

IF EXISTS (SELECT 1 FROM USUARIO WHERE correo = N'director@demo.pe')
BEGIN
    PRINT 'Los datos demo ya existen. Ejecuta antes db/borrar_datos_demo.sql si quieres volver a crearlos.';
    RETURN;
END

BEGIN TRANSACTION;

DECLARE @hash_demo VARCHAR(255) = '$2b$10$c1GSzVWp9aUIBT.Y4Zlv4OL.CsN8RMnoqn1UjrzeHQoMm.vQW3xzi';
DECLARE @hash_temp VARCHAR(255) = '$2b$10$z72BwPvi5gWwshPk9QIrz.B6kFM.UkEqnC7GBLypTgScqnERNJsXu';
DECLARE @anio INT = YEAR(GETDATE());   -- el servidor usa este mismo año por defecto

/* ---------- 1. USUARIOS DEL PERSONAL ---------- */
INSERT INTO USUARIO (nombre, apellido, correo, password_hash, rol, activo, primer_ingreso) VALUES
(N'Marta',   N'Salazar',  N'director@demo.pe',   @hash_demo, 'Director',   1, 0),
(N'Carla',   N'Mendoza',  N'secretaria@demo.pe', @hash_demo, 'Secretario', 1, 0),
-- Primaria: un tutor por sección
(N'Rosa',    N'Vargas',   N'docente01@demo.pe',  @hash_demo, 'Docente', 1, 0),
(N'Luis',    N'Campos',   N'docente02@demo.pe',  @hash_demo, 'Docente', 1, 0),
(N'Elena',   N'Ríos',     N'docente03@demo.pe',  @hash_demo, 'Docente', 1, 0),
(N'Jorge',   N'Paredes',  N'docente04@demo.pe',  @hash_demo, 'Docente', 1, 0),
(N'Silvia',  N'Torres',   N'docente05@demo.pe',  @hash_demo, 'Docente', 1, 0),
(N'Hugo',    N'Medina',   N'docente06@demo.pe',  @hash_demo, 'Docente', 1, 0),
-- Secundaria: un docente por curso
(N'Pedro',   N'Rojas',    N'docente07@demo.pe',  @hash_demo, 'Docente', 1, 0),  -- Matemática
(N'Ana',     N'Delgado',  N'docente08@demo.pe',  @hash_demo, 'Docente', 1, 0),  -- Comunicación
(N'Raúl',    N'Cáceres',  N'docente09@demo.pe',  @hash_demo, 'Docente', 1, 0),  -- Ciencia y Tecnología
(N'Patricia',N'Soto',     N'docente10@demo.pe',  @hash_demo, 'Docente', 1, 0);  -- Inglés
INSERT INTO USUARIO (nombre, apellido, correo, password_hash, rol, activo, primer_ingreso) VALUES
(N'Daniel',  N'Quiroz',   N'docente11@demo.pe',  @hash_temp, 'Docente', 1, 1);  -- Historia (cuenta nueva)

DECLARE @id_secretaria INT = (SELECT id_usu FROM USUARIO WHERE correo = N'secretaria@demo.pe');

/* ---------- 2. TABLAS AUXILIARES (temporales) ---------- */
CREATE TABLE #n (n INT PRIMARY KEY);
INSERT INTO #n (n)
SELECT x.n
FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
      FROM sys.all_objects a CROSS JOIN sys.all_objects b) x
WHERE x.n <= 100;

CREATE TABLE #nombres (i INT, txt VARCHAR(50) COLLATE DATABASE_DEFAULT);
INSERT INTO #nombres (i, txt) VALUES
(0,N'Mateo'),(1,N'Lucía'),(2,N'Diego'),(3,N'Camila'),(4,N'Andrés'),(5,N'Valeria'),(6,N'Sebastián'),
(7,N'Fernanda'),(8,N'Joaquín'),(9,N'Daniela'),(10,N'Gabriel'),(11,N'Sofía'),(12,N'Adrián'),
(13,N'Mariana'),(14,N'Rodrigo'),(15,N'Alejandra'),(16,N'Bruno'),(17,N'Ximena'),(18,N'Thiago'),(19,N'Nicole');

CREATE TABLE #apellidos (i INT, txt VARCHAR(50) COLLATE DATABASE_DEFAULT);
INSERT INTO #apellidos (i, txt) VALUES
(0,N'Quispe'),(1,N'Huamán'),(2,N'Flores'),(3,N'Mamani'),(4,N'Rojas'),(5,N'Castillo'),(6,N'Vega'),
(7,N'Salas'),(8,N'Paredes'),(9,N'Gutiérrez'),(10,N'Ramos'),(11,N'Chávez'),(12,N'Mendoza'),
(13,N'Espinoza'),(14,N'Torres'),(15,N'Cruz'),(16,N'Díaz'),(17,N'Herrera'),(18,N'Silva'),(19,N'Aguilar');

/* ---------- 3. SECCIONES ---------- */
-- base = promedio aproximado de la sección (para que el dashboard tenga variedad)
CREATE TABLE #sec (
    ord INT, nivel VARCHAR(10) COLLATE DATABASE_DEFAULT, grado VARCHAR(20) COLLATE DATABASE_DEFAULT,
    letra VARCHAR(5) COLLATE DATABASE_DEFAULT, capacidad INT, base DECIMAL(4,1),
    tutor VARCHAR(150) COLLATE DATABASE_DEFAULT NULL, id_sec INT NULL
);
INSERT INTO #sec (ord, nivel, grado, letra, capacidad, base, tutor) VALUES
(1,  N'Primaria',   N'1°', N'A',  3, 15.0, N'docente01@demo.pe'),   -- capacidad 3: queda llena
(2,  N'Primaria',   N'2°', N'A', 30, 14.0, N'docente02@demo.pe'),
(3,  N'Primaria',   N'3°', N'A', 30, 13.0, N'docente03@demo.pe'),
(4,  N'Primaria',   N'4°', N'A', 30, 12.5, N'docente04@demo.pe'),
(5,  N'Primaria',   N'5°', N'A', 30, 10.0, N'docente05@demo.pe'),   -- sección en riesgo
(6,  N'Primaria',   N'6°', N'A', 30, 13.5, N'docente06@demo.pe'),
(7,  N'Secundaria', N'1°', N'A', 30, 13.5, NULL),
(8,  N'Secundaria', N'2°', N'A', 30, 12.0, NULL),
(9,  N'Secundaria', N'3°', N'A', 30, 10.5, NULL),                   -- sección en riesgo
(10, N'Secundaria', N'4°', N'A', 30, 14.5, NULL),
(11, N'Secundaria', N'5°', N'A', 30, 15.5, NULL),
(12, N'Secundaria', N'3°', N'B', 30, 12.8, NULL);

-- Si alguna sección ya existe (por ejemplo tu 3°A de Secundaria de pruebas) se reutiliza.
INSERT INTO SECCION (nivel, grado, letra, capacidad)
SELECT s.nivel, s.grado, s.letra, s.capacidad
FROM #sec s
WHERE NOT EXISTS (SELECT 1 FROM SECCION x WHERE x.nivel = s.nivel AND x.grado = s.grado AND x.letra = s.letra);

UPDATE s SET id_sec = x.id_sec
FROM #sec s
INNER JOIN SECCION x ON x.nivel = s.nivel AND x.grado = s.grado AND x.letra = s.letra;

/* ---------- 4. CURSOS, CRITERIOS Y DOCENTES ---------- */
DECLARE @c0 INT = ISNULL((SELECT MAX(id_cur) FROM CURSO), 0);

INSERT INTO CURSO (nombre, grado)
SELECT c.nombre, g.grado
FROM (VALUES (N'Matemática'), (N'Comunicación'), (N'Personal Social'), (N'Ciencia y Tecnología')) c(nombre)
CROSS JOIN (VALUES (N'1°'), (N'2°'), (N'3°'), (N'4°'), (N'5°'), (N'6°')) g(grado);

DECLARE @c1 INT = (SELECT MAX(id_cur) FROM CURSO);   -- ids (@c0, @c1] = cursos de Primaria

INSERT INTO CURSO (nombre, grado)
SELECT c.nombre, g.grado
FROM (VALUES (N'Matemática'), (N'Comunicación'), (N'Ciencia y Tecnología'), (N'Inglés'), (N'Historia')) c(nombre)
CROSS JOIN (VALUES (N'1°'), (N'2°'), (N'3°'), (N'4°'), (N'5°')) g(grado);
                                                     -- ids > @c1 = cursos de Secundaria

INSERT INTO CRITERIO_EVALUACION (id_cur, nombre)
SELECT c.id_cur, k.nombre
FROM CURSO c
CROSS JOIN (VALUES (N'Examen'), (N'Práctica'), (N'Tarea')) k(nombre)
WHERE c.id_cur > @c0;

CREATE TABLE #doc_curso (curso VARCHAR(100) COLLATE DATABASE_DEFAULT, correo VARCHAR(150) COLLATE DATABASE_DEFAULT);
INSERT INTO #doc_curso (curso, correo) VALUES
(N'Matemática',           N'docente07@demo.pe'),
(N'Comunicación',         N'docente08@demo.pe'),
(N'Ciencia y Tecnología', N'docente09@demo.pe'),
(N'Inglés',               N'docente10@demo.pe'),
(N'Historia',             N'docente11@demo.pe');

-- Primaria: el tutor dicta todos los cursos de su sección
INSERT INTO SECCION_CURSO (id_sec, id_cur, docente_id)
SELECT s.id_sec, c.id_cur, u.id_usu
FROM #sec s
INNER JOIN CURSO c ON c.id_cur > @c0 AND c.id_cur <= @c1 AND c.grado = s.grado
INNER JOIN USUARIO u ON u.correo = s.tutor
WHERE s.nivel = N'Primaria'
  AND NOT EXISTS (SELECT 1 FROM SECCION_CURSO sc WHERE sc.id_sec = s.id_sec);

-- Secundaria: un docente por curso
INSERT INTO SECCION_CURSO (id_sec, id_cur, docente_id)
SELECT s.id_sec, c.id_cur, u.id_usu
FROM #sec s
INNER JOIN CURSO c ON c.id_cur > @c1 AND c.grado = s.grado
INNER JOIN #doc_curso d ON d.curso = c.nombre
INNER JOIN USUARIO u ON u.correo = d.correo
WHERE s.nivel = N'Secundaria'
  AND NOT EXISTS (SELECT 1 FROM SECCION_CURSO sc WHERE sc.id_sec = s.id_sec);

/* ---------- 5. PADRES (64 con cuenta) ---------- */
INSERT INTO USUARIO (nombre, apellido, correo, password_hash, rol, activo, primer_ingreso)
SELECT
    (SELECT txt FROM #nombres WHERE i = (n.n * 3) % 20),
    (SELECT txt FROM #apellidos WHERE i = (n.n * 3) % 20) + N' ' + (SELECT txt FROM #apellidos WHERE i = (n.n * 5 + 7) % 20),
    N'padre' + RIGHT('0' + CAST(n.n AS VARCHAR(2)), 2) + N'@demo.pe',
    @hash_demo, 'Padre', 1, 0
FROM #n n WHERE n.n <= 64;

INSERT INTO PADRE (nombre, apellido, dni, correo, id_usu)
SELECT u.nombre, u.apellido, N'30' + RIGHT('000000' + CAST(n.n AS VARCHAR(6)), 6), u.correo, u.id_usu
FROM #n n
INNER JOIN USUARIO u ON u.correo = N'padre' + RIGHT('0' + CAST(n.n AS VARCHAR(2)), 2) + N'@demo.pe'
WHERE n.n <= 64;

/* ---------- 6. ALUMNOS (96 matriculados + 3 nuevos) ---------- */
-- n 1..96: 8 alumnos por sección. Los padres 1..32 tienen 2 hijos (n y n+64, en secciones distintas).
-- n 97..99: ingresantes que se matriculan para el año siguiente (padres 33, 34 y 35).
CREATE TABLE #alu (
    n INT PRIMARY KEY, pnum INT, sec_ord INT NULL,
    nombre VARCHAR(100) COLLATE DATABASE_DEFAULT, apellido VARCHAR(100) COLLATE DATABASE_DEFAULT,
    dni VARCHAR(15) COLLATE DATABASE_DEFAULT, id_alu INT NULL
);
INSERT INTO #alu (n, pnum, sec_ord, nombre, apellido, dni)
SELECT n.n,
       CASE WHEN n.n <= 64 THEN n.n ELSE n.n - 64 END,
       CASE WHEN n.n <= 96 THEN (n.n - 1) / 8 + 1 ELSE NULL END,
       (SELECT txt FROM #nombres WHERE i = (n.n * 7) % 20),
       N'', N'60' + RIGHT('000000' + CAST(n.n AS VARCHAR(6)), 6)
FROM #n n WHERE n.n <= 99;

INSERT INTO ALUMNO (nombre, apellido, dni, id_pad)
SELECT a.nombre,
       p.apellido,
       a.dni,
       p.id_pad
FROM #alu a
INNER JOIN PADRE p ON p.dni = N'30' + RIGHT('000000' + CAST(a.pnum AS VARCHAR(6)), 6);

UPDATE a SET id_alu = x.id_alu
FROM #alu a INNER JOIN ALUMNO x ON x.dni = a.dni;

/* ---------- 7. MATRÍCULAS ---------- */
INSERT INTO MATRICULA (id_alu, id_sec, anio, estado, registrado_por)
SELECT a.id_alu, s.id_sec, @anio, 'Activa', @id_secretaria
FROM #alu a INNER JOIN #sec s ON s.ord = a.sec_ord
WHERE a.n <= 96;

-- Ingresantes: solicitud en línea del año siguiente, quedan pendientes en Primaria 1°
INSERT INTO MATRICULA (id_alu, id_sec, anio, estado, registrado_por)
SELECT a.id_alu, s.id_sec, @anio + 1, 'Pendiente', pu.id_usu
FROM #alu a
INNER JOIN ALUMNO al ON al.id_alu = a.id_alu
INNER JOIN PADRE pa ON pa.id_pad = al.id_pad
INNER JOIN USUARIO pu ON pu.id_usu = pa.id_usu
INNER JOIN #sec s ON s.ord = 1
WHERE a.n > 96;

/* ---------- 8. NOTAS ---------- */
-- Se calcula primero en una tabla temporal (así el ruido aleatorio se evalúa una sola vez por nota).
SELECT m.id_mat, ce.id_crit,
       CAST(s.base + ((a.n * 37) % 9 - 4) * 0.9 + (CHECKSUM(NEWID()) % 41) / 20.0 AS DECIMAL(6,2)) AS crudo
INTO #nota_tmp
FROM MATRICULA m
INNER JOIN #alu a ON a.id_alu = m.id_alu AND a.n <= 96
INNER JOIN #sec s ON s.id_sec = m.id_sec
INNER JOIN SECCION_CURSO sc ON sc.id_sec = m.id_sec
INNER JOIN CRITERIO_EVALUACION ce ON ce.id_cur = sc.id_cur
WHERE m.anio = @anio AND m.estado = 'Activa'
  AND NOT (s.nivel = N'Primaria' AND s.grado = N'6°' AND ce.nombre = N'Tarea');   -- Tarea sin notas en 6°A: celdas vacías

INSERT INTO NOTA (id_mat, id_crit, valor)
SELECT id_mat, id_crit,
       CAST(ROUND(CASE WHEN crudo < 0 THEN 0 WHEN crudo > 20 THEN 20 ELSE crudo END * 2, 0) / 2.0 AS DECIMAL(4,2))
FROM #nota_tmp;

/* ---------- 9. ASISTENCIA (días hábiles de octubre) ---------- */
CREATE TABLE #dias (fecha DATE);
INSERT INTO #dias (fecha)
SELECT DATEADD(DAY, n.n - 1, DATEFROMPARTS(@anio, 10, 1))
FROM #n n
WHERE n.n <= 31
  AND DATEDIFF(DAY, '19000101', DATEADD(DAY, n.n - 1, DATEFROMPARTS(@anio, 10, 1))) % 7 < 5;  -- lunes a viernes

SELECT m.id_mat, d.fecha, ((CHECKSUM(NEWID()) % 100) + 100) % 100 AS r
INTO #asi_tmp
FROM MATRICULA m
INNER JOIN #alu a ON a.id_alu = m.id_alu AND a.n <= 96
CROSS JOIN #dias d
WHERE m.anio = @anio AND m.estado = 'Activa';

INSERT INTO ASISTENCIA (id_mat, fecha, estado)
SELECT id_mat, fecha,
       CASE WHEN r < 85 THEN 'Presente' WHEN r < 91 THEN 'Tardanza' WHEN r < 97 THEN 'Falta' ELSE 'Justificada' END
FROM #asi_tmp;

/* ---------- 10. NOTIFICACIONES ---------- */
INSERT INTO NOTIFICACION (id_alu, tipo, mensaje, enviado_por)
SELECT a.id_alu, v.tipo, v.mensaje, @id_secretaria
FROM (VALUES
    (1,  'Citacion',      N'Se cita al apoderado para una reunión el viernes a las 4:00 p.m.'),
    (3,  'Amonestacion',  N'Llegadas tarde reiteradas durante esta semana.'),
    (10, 'Informativa',   N'Recordatorio: entrega de libretas el último viernes del mes.'),
    (17, 'Citacion',      N'Se cita al apoderado para conversar sobre el rendimiento en Matemática.'),
    (25, 'Amonestacion',  N'Conversación en clase que interrumpe el desarrollo de la sesión.'),
    (40, 'Informativa',   N'Paseo educativo el próximo jueves. Traer autorización firmada.'),
    (57, 'Citacion',      N'Se cita al apoderado para coordinar el refuerzo académico.'),
    (70, 'Informativa',   N'Felicitaciones por su participación en la feria de ciencias.')
) v(n, tipo, mensaje)
INNER JOIN #alu a ON a.n = v.n;

COMMIT TRANSACTION;

/* ---------- RESUMEN ---------- */
SELECT 'Usuarios demo' AS tabla, COUNT(*) AS filas FROM USUARIO WHERE correo LIKE N'%@demo.pe'
UNION ALL SELECT 'Secciones',  COUNT(*) FROM #sec
UNION ALL SELECT 'Alumnos',    COUNT(*) FROM #alu
UNION ALL SELECT 'Notas',      COUNT(*) FROM NOTA
UNION ALL SELECT 'Asistencias', COUNT(*) FROM ASISTENCIA
UNION ALL SELECT 'Notificaciones', COUNT(*) FROM NOTIFICACION;

DROP TABLE #n, #nombres, #apellidos, #sec, #doc_curso, #alu, #nota_tmp, #dias, #asi_tmp;
GO
