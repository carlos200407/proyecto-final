/* =====================================================================
   SISTEMA DE MATRÍCULA, ASISTENCIA Y EVALUACIÓN ACADÉMICA (SIMAE)
   Script de creación de base de datos - SQL Server 2022
   ===================================================================== */

-- Crear la base de datos
CREATE DATABASE SIMAE;
GO

USE SIMAE;
GO

/* =====================================================================
   1. USUARIO
   Cuentas del sistema: Director, Secretario, Docente y Padre.
   - activo: permite desactivar cuentas sin borrarlas (auditoría)
   - primer_ingreso: fuerza cambio de contraseña temporal
   ===================================================================== */
CREATE TABLE USUARIO (
    id_usu          INT IDENTITY(1,1) PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    apellido        VARCHAR(100)    NOT NULL,
    correo          VARCHAR(150)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    rol             VARCHAR(20)     NOT NULL,
    activo          BIT             NOT NULL DEFAULT 1,
    primer_ingreso  BIT             NOT NULL DEFAULT 1,
    CONSTRAINT CK_usuario_rol CHECK (rol IN ('Director', 'Secretario', 'Docente', 'Padre'))
);
GO

/* =====================================================================
   2. PADRE
   Datos personales del apoderado. Vinculado 1 a 1 con su cuenta USUARIO.
   El dni + correo se usan para validar el acceso a las notas del hijo.
   ===================================================================== */
CREATE TABLE PADRE (
    id_pad      INT IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    apellido    VARCHAR(100)    NOT NULL,
    dni         VARCHAR(15)     NOT NULL UNIQUE,
    correo      VARCHAR(150)    NOT NULL,
    id_usu      INT             NOT NULL UNIQUE,
    CONSTRAINT FK_padre_usuario FOREIGN KEY (id_usu) REFERENCES USUARIO(id_usu)
);
GO

/* =====================================================================
   3. ALUMNO
   Cada alumno pertenece a un padre/apoderado.
   ===================================================================== */
CREATE TABLE ALUMNO (
    id_alu      INT IDENTITY(1,1) PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    apellido    VARCHAR(100)    NOT NULL,
    dni         VARCHAR(15)     NOT NULL UNIQUE,
    id_pad      INT             NOT NULL,
    CONSTRAINT FK_alumno_padre FOREIGN KEY (id_pad) REFERENCES PADRE(id_pad)
);
GO

/* =====================================================================
   4. SECCION
   Un salón: grado + letra (ej: 3° "B").
   ===================================================================== */
CREATE TABLE SECCION (
    id_sec  INT IDENTITY(1,1) PRIMARY KEY,
    grado   VARCHAR(20)     NOT NULL,
    letra   VARCHAR(5)      NOT NULL,
    CONSTRAINT UQ_seccion_grado_letra UNIQUE (grado, letra)
);
GO

/* =====================================================================
   5. CURSO
   Materias configuradas por el director, asociadas a un grado.
   ===================================================================== */
CREATE TABLE CURSO (
    id_cur  INT IDENTITY(1,1) PRIMARY KEY,
    nombre  VARCHAR(100)    NOT NULL,
    grado   VARCHAR(20)     NOT NULL
);
GO

/* =====================================================================
   6. SECCION_CURSO
   Resuelve la relación muchos a muchos entre SECCION y CURSO,
   e indica qué docente dicta ese curso en esa sección.
   - Primaria: todas las filas de una sección apuntan al mismo docente
   - Secundaria: cada fila puede tener un docente distinto
   ===================================================================== */
CREATE TABLE SECCION_CURSO (
    id_seccur   INT IDENTITY(1,1) PRIMARY KEY,
    id_sec      INT NOT NULL,
    id_cur      INT NOT NULL,
    docente_id  INT NOT NULL,
    CONSTRAINT FK_seccur_seccion FOREIGN KEY (id_sec)     REFERENCES SECCION(id_sec),
    CONSTRAINT FK_seccur_curso   FOREIGN KEY (id_cur)     REFERENCES CURSO(id_cur),
    CONSTRAINT FK_seccur_docente FOREIGN KEY (docente_id) REFERENCES USUARIO(id_usu),
    CONSTRAINT UQ_seccur_seccion_curso UNIQUE (id_sec, id_cur)
);
GO

/* =====================================================================
   7. CRITERIO_EVALUACION
   Criterios que el director define por curso (Examen, Práctica, Tarea).
   Sin pesos: el promedio se calcula con media aritmética simple.
   ===================================================================== */
CREATE TABLE CRITERIO_EVALUACION (
    id_crit INT IDENTITY(1,1) PRIMARY KEY,
    id_cur  INT             NOT NULL,
    nombre  VARCHAR(100)    NOT NULL,
    CONSTRAINT FK_criterio_curso FOREIGN KEY (id_cur) REFERENCES CURSO(id_cur),
    CONSTRAINT UQ_criterio_curso_nombre UNIQUE (id_cur, nombre)
);
GO

/* =====================================================================
   8. MATRICULA
   Vincula un alumno con una sección en un año académico.
   Guarda quién la registró (secretario) para trazabilidad.
   ===================================================================== */
CREATE TABLE MATRICULA (
    id_mat          INT IDENTITY(1,1) PRIMARY KEY,
    id_alu          INT         NOT NULL,
    id_sec          INT         NOT NULL,
    anio            INT         NOT NULL,
    fecha_matricula DATE        NOT NULL DEFAULT GETDATE(),
    estado          VARCHAR(20) NOT NULL DEFAULT 'Activa',
    registrado_por  INT         NOT NULL,
    CONSTRAINT FK_matricula_alumno  FOREIGN KEY (id_alu)         REFERENCES ALUMNO(id_alu),
    CONSTRAINT FK_matricula_seccion FOREIGN KEY (id_sec)         REFERENCES SECCION(id_sec),
    CONSTRAINT FK_matricula_usuario FOREIGN KEY (registrado_por) REFERENCES USUARIO(id_usu),
    CONSTRAINT UQ_matricula_alumno_anio UNIQUE (id_alu, anio),
    CONSTRAINT CK_matricula_estado CHECK (estado IN ('Activa', 'Retirada', 'Trasladada'))
);
GO

/* =====================================================================
   9. ASISTENCIA
   Un registro por alumno por día (garantizado por el UNIQUE).
   ===================================================================== */
CREATE TABLE ASISTENCIA (
    id_asi  INT IDENTITY(1,1) PRIMARY KEY,
    id_mat  INT         NOT NULL,
    fecha   DATE        NOT NULL,
    estado  VARCHAR(20) NOT NULL,
    CONSTRAINT FK_asistencia_matricula FOREIGN KEY (id_mat) REFERENCES MATRICULA(id_mat),
    CONSTRAINT UQ_asistencia_matricula_fecha UNIQUE (id_mat, fecha),
    CONSTRAINT CK_asistencia_estado CHECK (estado IN ('Presente', 'Falta', 'Tardanza', 'Justificada'))
);
GO

/* =====================================================================
   10. NOTA
   Una nota por criterio de evaluación (garantizado por el UNIQUE).
   El curso se obtiene vía CRITERIO_EVALUACION -> CURSO (sin redundancia).
   ===================================================================== */
CREATE TABLE NOTA (
    id_not  INT IDENTITY(1,1) PRIMARY KEY,
    id_mat  INT             NOT NULL,
    id_crit INT             NOT NULL,
    valor   DECIMAL(4,2)    NOT NULL,
    CONSTRAINT FK_nota_matricula FOREIGN KEY (id_mat)  REFERENCES MATRICULA(id_mat),
    CONSTRAINT FK_nota_criterio  FOREIGN KEY (id_crit) REFERENCES CRITERIO_EVALUACION(id_crit),
    CONSTRAINT UQ_nota_matricula_criterio UNIQUE (id_mat, id_crit),
    CONSTRAINT CK_nota_valor CHECK (valor >= 0 AND valor <= 20)
);
GO

/* =====================================================================
   11. NOTIFICACION
   Amonestaciones y citaciones enviadas por Administración,
   referidas a un alumno.
   ===================================================================== */
CREATE TABLE NOTIFICACION (
    id_notif    INT IDENTITY(1,1) PRIMARY KEY,
    id_alu      INT             NOT NULL,
    tipo        VARCHAR(30)     NOT NULL,
    mensaje     VARCHAR(1000)   NOT NULL,
    fecha_envio DATETIME        NOT NULL DEFAULT GETDATE(),
    enviado_por INT             NOT NULL,
    CONSTRAINT FK_notif_alumno  FOREIGN KEY (id_alu)      REFERENCES ALUMNO(id_alu),
    CONSTRAINT FK_notif_usuario FOREIGN KEY (enviado_por) REFERENCES USUARIO(id_usu),
    CONSTRAINT CK_notif_tipo CHECK (tipo IN ('Amonestacion', 'Citacion', 'Informativa'))
);
GO

/* =====================================================================
   CONSULTA DE EJEMPLO: promedio por curso (media aritmética simple)
   ===================================================================== */
/*
SELECT
    a.nombre + ' ' + a.apellido AS alumno,
    c.nombre                    AS curso,
    AVG(n.valor)                AS promedio
FROM NOTA n
INNER JOIN MATRICULA m           ON n.id_mat  = m.id_mat
INNER JOIN ALUMNO a              ON m.id_alu  = a.id_alu
INNER JOIN CRITERIO_EVALUACION ce ON n.id_crit = ce.id_crit
INNER JOIN CURSO c               ON ce.id_cur = c.id_cur
WHERE m.anio = 2026
GROUP BY a.nombre, a.apellido, c.nombre
ORDER BY alumno, curso;
*/
