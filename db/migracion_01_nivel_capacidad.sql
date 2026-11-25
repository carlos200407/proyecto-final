/* =====================================================================
   MIGRACIÓN 01 - SIMAE
   Agrega a SECCION el nivel (Primaria/Secundaria) y la capacidad (vacantes),
   y permite el estado 'Pendiente' en MATRICULA (matrícula en línea).
   Ejecutar UNA sola vez en SSMS. Cada bloque va separado por GO.
   ===================================================================== */
USE SIMAE;
GO

-- Las secciones que ya existen quedan como Secundaria con 30 vacantes
-- (cámbialo después con UPDATE si alguna es de Primaria).
ALTER TABLE SECCION ADD nivel VARCHAR(10) NOT NULL
    CONSTRAINT DF_seccion_nivel DEFAULT 'Secundaria';
GO
ALTER TABLE SECCION ADD capacidad INT NOT NULL
    CONSTRAINT DF_seccion_capacidad DEFAULT 30;
GO
ALTER TABLE SECCION ADD CONSTRAINT CK_seccion_nivel CHECK (nivel IN ('Primaria', 'Secundaria'));
GO
ALTER TABLE SECCION ADD CONSTRAINT CK_seccion_capacidad CHECK (capacidad > 0);
GO

-- 3°A de Primaria y 3°A de Secundaria son salones distintos: la unicidad ahora incluye el nivel.
ALTER TABLE SECCION DROP CONSTRAINT UQ_seccion_grado_letra;
GO
ALTER TABLE SECCION ADD CONSTRAINT UQ_seccion_nivel_grado_letra UNIQUE (nivel, grado, letra);
GO

-- Matrícula en línea: la solicitud queda 'Pendiente' hasta que la secretaría la confirme.
ALTER TABLE MATRICULA DROP CONSTRAINT CK_matricula_estado;
GO
ALTER TABLE MATRICULA ADD CONSTRAINT CK_matricula_estado
    CHECK (estado IN ('Activa', 'Pendiente', 'Retirada', 'Trasladada'));
GO

SELECT * FROM SECCION;
GO
