import './inicio.css';

const NOMBRE_ROL = {
  Director: 'Director',
  Secretario: 'Secretaría',
  Docente: 'Docente',
  Padre: 'Padre de familia',
};

const PROXIMAMENTE = {
  Director: [
    'Ver gráficos de asistencia y notas por salón',
    'Crear y desactivar cuentas del personal',
    'Configurar cursos, secciones y criterios de evaluación',
  ],
  Secretario: [
    'Matricular alumnos, a mano o por voz',
    'Registrar los datos del alumno y su apoderado',
    'Enviar amonestaciones y citaciones',
  ],
  Docente: [
    'Registrar notas por criterio de evaluación',
    'Marcar la asistencia diaria de tus secciones',
  ],
  Padre: [
    'Matricular a tu hijo o hija',
    'Ver sus notas y su asistencia',
    'Recibir citaciones y avisos del colegio',
  ],
};

export default function Inicio({ usuario, onSalir }) {
  const rol = NOMBRE_ROL[usuario.rol] ?? usuario.rol;
  const lista = PROXIMAMENTE[usuario.rol] ?? [];

  return (
    <div className="inicio">
      <header className="inicio-barra">
        <p className="inicio-logo">SIMAE</p>
        <div className="inicio-sesion">
          <span>
            {usuario.nombre} {usuario.apellido} ({rol})
          </span>
          <button className="boton-contorno" type="button" onClick={onSalir}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="inicio-contenido">
        <h1>Hola, {usuario.nombre}</h1>
        <p className="inicio-texto">
          Entraste como {rol}. Tu panel todavía está en construcción.
        </p>

        <h2>Esto es lo que vas a poder hacer</h2>
        <ul>
          {lista.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}
