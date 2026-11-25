export const ENLACES_SECRETARIA = [
  { to: '/secretaria/matriculas', texto: 'Matrículas pendientes' },
  { to: '/secretaria/matricular', texto: 'Matricular alumno' },
  { to: '/secretaria/secciones', texto: 'Secciones y alumnos' },
  { to: '/secretaria/directorio', texto: 'Directorio' },
  { to: '/secretaria/avisos', texto: 'Avisos a padres' },
];

// Nombres cortos que se repiten en varias pantallas.
export const nombreSeccion = (s) => `${s.grado}${s.letra}`;
export const nombreNivel = (n) => (n === 'Primaria' ? 'Prim.' : 'Sec.');
export const nombreTipo = (t) => (t === 'Citacion' ? 'Citación' : t === 'Amonestacion' ? 'Amonestación' : 'Informativo');
