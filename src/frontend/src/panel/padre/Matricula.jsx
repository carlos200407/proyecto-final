import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pedir, pedirAuth } from '../../api';
import { CabMovil } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import useDatos from '../useDatos';

export default function Matricula() {
  useEffect(() => { document.title = 'Matrícula en línea – El Técnico 3052'; }, []);

  // Datos del apoderado (de su cuenta) + vacantes por sección (públicas).
  const carga = useDatos(() =>
    Promise.all([pedirAuth('/padres/yo'), pedir('/secciones/vacantes')]).then(([perfil, vac]) => ({ perfil, vac })),
  );

  return (
    <div className="panel">
      <CabMovil titulo="Matrícula en línea" volverA="/padre/notas" volverTxt="Mi cuenta" />
      <div className="movil-cuerpo">
        <div className="franja">
          <p className="suave" style={{ margin: 0, fontWeight: 600 }}>Paso 1 de 2</p>
          <h1>Datos del alumno</h1>
          <div className="pasos"><span className="ok" /><span /></div>
          <p className="suave" style={{ margin: '12px 0 0' }}>[Texto de ayuda: qué documentos tener a la mano.]</p>
        </div>
        {carga.cargando && <Cargando />}
        {carga.error && <ErrorCaja texto={carga.error} />}
        {carga.datos && <Formulario perfil={carga.datos.perfil} vac={carga.datos.vac} />}
      </div>
    </div>
  );
}

function Formulario({ perfil, vac }) {
  const navigate = useNavigate();
  const secciones = vac.secciones;
  const niveles = ['Primaria', 'Secundaria'].filter((n) => secciones.some((s) => s.nivel === n));

  const [nivel, setNivel] = useState(niveles[0] ?? '');
  const gradosDe = (n) => {
    const mapa = new Map();
    secciones.filter((s) => s.nivel === n).forEach((s) => mapa.set(s.grado, (mapa.get(s.grado) ?? 0) + Math.max(0, s.disponibles)));
    return [...mapa.entries()].map(([grado, disponibles]) => ({ grado, disponibles }));
  };
  const [grado, setGrado] = useState(gradosDe(niveles[0] ?? '')[0]?.grado ?? '');
  const [alumno, setAlumno] = useState({ nombre: '', apellido: '', dni: '' });

  const elegirNivel = (n) => { setNivel(n); setGrado(gradosDe(n)[0]?.grado ?? ''); };
  const grados = gradosDe(nivel);
  const actual = grados.find((g) => g.grado === grado);
  const apoderado = perfil.padre;

  const continuar = (e) => {
    e.preventDefault();
    navigate('/padre/confirmar', { state: { nivel, grado, alumno, apoderado, anio: vac.anio } });
  };

  if (niveles.length === 0) {
    return <div className="seccion"><p className="suave">El colegio todavía no tiene secciones abiertas para la matrícula {vac.anio}.</p></div>;
  }

  return (
    <form className="seccion" onSubmit={continuar}>
      <h2>Nivel y grado ({vac.anio})</h2>
      <div className="fila-doble">
        {niveles.map((n) => (
          <button key={n} type="button" aria-pressed={n === nivel} className={`pbtn ${n === nivel ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => elegirNivel(n)}>{n}</button>
        ))}
      </div>
      <label className="campo"><span>Grado</span>
        <select value={grado} onChange={(e) => setGrado(e.target.value)}>
          {grados.map((g) => <option key={g.grado} value={g.grado}>{g.grado}</option>)}
        </select>
      </label>
      <p className="suave" style={{ margin: '-6px 0 20px', fontSize: 14 }}>
        Vacantes disponibles: <b>{actual ? actual.disponibles : 0}</b>
      </p>

      <h2>Alumno</h2>
      <label className="campo"><span>Nombres</span><input required value={alumno.nombre} onChange={(e) => setAlumno({ ...alumno, nombre: e.target.value })} /></label>
      <label className="campo"><span>Apellidos</span><input required value={alumno.apellido} onChange={(e) => setAlumno({ ...alumno, apellido: e.target.value })} /></label>
      <label className="campo"><span>DNI</span><input required inputMode="numeric" pattern="[0-9]{8}" title="8 dígitos" value={alumno.dni} onChange={(e) => setAlumno({ ...alumno, dni: e.target.value })} /></label>

      <h2 style={{ marginTop: 20 }}>Apoderado</h2>
      <div className="tarjeta" style={{ marginBottom: 16 }}>
        <b>{apoderado.nombre} {apoderado.apellido}</b>
        <p className="suave" style={{ margin: '2px 0 0' }}>DNI {apoderado.dni} · {apoderado.correo}</p>
      </div>

      <button type="submit" className="pbtn pbtn-p pbtn-ancho" disabled={!actual || actual.disponibles < 1}>Continuar</button>
    </form>
  );
}
