/* =====================================================================
   DATOS DE PRUEBA - SIMAE
   Ejecutar en orden (respeta las llaves foráneas)
   ===================================================================== */

USE SIMAE;
GO

-- 1. USUARIO (director, secretario, docente, y el usuario del padre)
INSERT INTO USUARIO (nombre, apellido, correo, password_hash, rol) VALUES
('Roberto', 'Fernández', 'director@colegio.pe', 'hash_temporal_1', 'Director'),
('Carla', 'Mendoza', 'secretaria@colegio.pe', 'hash_temporal_2', 'Secretario'),
('Juan', 'Ramírez', 'docente1@colegio.pe', 'hash_temporal_3', 'Docente'),
('Ana', 'Torres', 'docente2@colegio.pe', 'hash_temporal_4', 'Docente'),
('Luis', 'Quispe', 'lquispe@gmail.com', 'hash_temporal_5', 'Padre');
GO

-- 2. PADRE (vinculado al usuario con rol Padre, id_usu = 5)
INSERT INTO PADRE (nombre, apellido, dni, correo, id_usu) VALUES
('Luis', 'Quispe', '45678912', 'lquispe@gmail.com', 5);
GO

-- 3. ALUMNO (hijo de Luis Quispe, id_pad = 1)
INSERT INTO ALUMNO (nombre, apellido, dni, id_pad) VALUES
('Mateo', 'Quispe', '78912345', 1);
GO

-- 4. SECCION
INSERT INTO SECCION (grado, letra) VALUES
('3°', 'A');
GO

-- 5. CURSO
INSERT INTO CURSO (nombre, grado) VALUES
('Matemática', '3°'),
('Comunicación', '3°');
GO

-- 6. SECCION_CURSO (Juan dicta Matemática, Ana dicta Comunicación, ambos en 3°A)
INSERT INTO SECCION_CURSO (id_sec, id_cur, docente_id) VALUES
(1, 1, 3),  -- 3°A - Matemática - Juan (id_usu=3)
(1, 2, 4);  -- 3°A - Comunicación - Ana (id_usu=4)
GO

-- 7. CRITERIO_EVALUACION (para el curso de Matemática, id_cur = 1)
INSERT INTO CRITERIO_EVALUACION (id_cur, nombre) VALUES
(1, 'Examen'),
(1, 'Práctica'),
(1, 'Tarea');
GO

-- 8. MATRICULA (Mateo matriculado en 3°A, año 2026, registrado por la secretaria id_usu=2)
INSERT INTO MATRICULA (id_alu, id_sec, anio, registrado_por) VALUES
(1, 1, 2026, 2);
GO

-- 9. ASISTENCIA (un par de días)
INSERT INTO ASISTENCIA (id_mat, fecha, estado) VALUES
(1, '2026-09-15', 'Presente'),
(1, '2026-09-16', 'Falta');
GO

-- 10. NOTA (Mateo, criterios del curso Matemática)
INSERT INTO NOTA (id_mat, id_crit, valor) VALUES
(1, 1, 17.50),  -- Examen
(1, 2, 15.00),  -- Práctica
(1, 3, 18.00);  -- Tarea
GO

-- 11. NOTIFICACION (enviada por la secretaria, id_usu=2)
INSERT INTO NOTIFICACION (id_alu, tipo, mensaje, enviado_por) VALUES
(1, 'Citacion', 'Se cita al apoderado para reunión el viernes 25/09.', 2);
GO

-- Verificación rápida
SELECT * FROM ALUMNO;
SELECT * FROM NOTA;
