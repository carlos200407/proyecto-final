# Datos ficticios para probar SIMAE

## Orden en SSMS (conectado a la base SIMAE)
1. `migracion_01_nivel_capacidad.sql`  (una sola vez; agrega nivel y capacidad a SECCION)
2. `datos_demo.sql`                    (crea los datos de prueba)
3. Para quitarlos: `borrar_datos_demo.sql`  (no toca tus datos reales)

Si `datos_demo.sql` da el error *Invalid column name 'nivel'*, falta el paso 1.

## Cuentas (clave de todas: `Demo1234`)
| Rol | Correo | Qué probar |
|---|---|---|
| Director | director@demo.pe | Dashboard con 12 secciones, crear/desactivar personal |
| Secretario | secretaria@demo.pe | Entra a la pantalla Inicio (aún no tiene panel) |
| Docente (Primaria) | docente01@demo.pe ... docente06@demo.pe | Tutor de 1°A ... 6°A, dicta 4 cursos. `docente06` tiene la columna Tarea vacía |
| Docente (Secundaria) | docente07@demo.pe Matemática, 08 Comunicación, 09 Ciencia y Tecnología, 10 Inglés | Cada uno dicta su curso en 6 secciones (selector) |
| Docente (cuenta nueva) | docente11@demo.pe (Historia) | Clave `Temp-1234`: te obliga a cambiarla |
| Padre | padre01@demo.pe ... padre64@demo.pe | `padre01` a `padre32` tienen 2 hijos (selector); `padre33` a `padre35` tienen un hijo con matrícula pendiente |

## Casos que se pueden probar
- **Sin vacantes:** Primaria 1° tiene capacidad 3 y ya hay 3 solicitudes pendientes. En la matrícula sale "Vacantes disponibles: 0".
- **Secciones en riesgo:** Primaria 5°A y Secundaria 3°A tienen promedio bajo (el dashboard las marca).
- **Notas vacías:** en Primaria 6°A no hay notas de Tarea.
- **Citaciones:** algunos alumnos tienen avisos (por ejemplo el hijo de `padre01`).
