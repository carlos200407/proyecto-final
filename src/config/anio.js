// Año de trabajo (notas, asistencia, dashboard) y año al que apunta la matrícula en línea.
// Se pueden fijar en el .env; si no, se usa el año actual y el siguiente.
const ANIO_ACADEMICO = parseInt(process.env.ANIO_ACADEMICO) || new Date().getFullYear();
const ANIO_MATRICULA = parseInt(process.env.ANIO_MATRICULA) || ANIO_ACADEMICO + 1;

module.exports = { ANIO_ACADEMICO, ANIO_MATRICULA };
