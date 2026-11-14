import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CabMovil } from '../Estructura';

const GRADOS = {
  Primaria: ['1° grado', '2° grado', '3° grado', '4° grado', '5° grado', '6° grado'],
  Secundaria: ['1° año', '2° año', '3° año', '4° año', '5° año'],
};

export default function Matricula() {
  const navigate = useNavigate();
  const [nivel, setNivel] = useState('Secundaria');
  const [grado, setGrado] = useState(GRADOS.Secundaria[2]);
  const [alumno, setAlumno] = useState({ nombre: 'Mateo', apellido: 'Quispe', dni: '78912345' });
  const [apoderado, setApoderado] = useState({ nombre: 'Luis', apellido: 'Quispe', dni: '45678912', correo: 'lquispe@gmail.com' });

  useEffect(() => { document.title = 'Matrícula en línea – El Técnico 3052'; }, []);

  const elegirNivel = (n) => { setNivel(n); setGrado(GRADOS[n][0]); };
  const cambia = (set, datos, k) => (e) => set({ ...datos, [k]: e.target.value });

  const continuar = (e) => {
    e.preventDefault();
    navigate('/padre/confirmar', { state: { nivel, grado, alumno, apoderado } });
  };

  return (
    <div className="panel">
      <CabMovil titulo="Matrícula en línea" volverA="/" volverTxt="Inicio" />
      <div className="movil-cuerpo">
        <div className="franja">
          <p className="suave" style={{ margin: 0, fontWeight: 600 }}>Paso 1 de 2</p>
          <h1>Datos del alumno</h1>
          <div className="pasos"><span className="ok" /><span /></div>
          <p className="suave" style={{ margin: '12px 0 0' }}>[Texto de ayuda: qué documentos tener a la mano.]</p>
        </div>
        <form className="seccion" onSubmit={continuar}>
          <h2>Nivel y grado</h2>
          <div className="fila-doble">
            {Object.keys(GRADOS).map((n) => (
              <button key={n} type="button" aria-pressed={n === nivel} className={`pbtn ${n === nivel ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => elegirNivel(n)}>{n}</button>
            ))}
          </div>
          <label className="campo"><span>Grado</span>
            <select value={grado} onChange={(e) => setGrado(e.target.value)}>
              {GRADOS[nivel].map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <p className="suave" style={{ margin: '-6px 0 20px', fontSize: 14 }}>Vacantes disponibles: <b>[00]</b></p>

          <h2>Alumno</h2>
          <label className="campo"><span>Nombres</span><input required value={alumno.nombre} onChange={cambia(setAlumno, alumno, 'nombre')} /></label>
          <label className="campo"><span>Apellidos</span><input required value={alumno.apellido} onChange={cambia(setAlumno, alumno, 'apellido')} /></label>
          <label className="campo"><span>DNI</span><input required inputMode="numeric" pattern="[0-9]{8}" title="8 dígitos" value={alumno.dni} onChange={cambia(setAlumno, alumno, 'dni')} /></label>

          <h2 style={{ marginTop: 20 }}>Apoderado</h2>
          <label className="campo"><span>Nombres</span><input required value={apoderado.nombre} onChange={cambia(setApoderado, apoderado, 'nombre')} /></label>
          <label className="campo"><span>Apellidos</span><input required value={apoderado.apellido} onChange={cambia(setApoderado, apoderado, 'apellido')} /></label>
          <label className="campo"><span>DNI</span><input required inputMode="numeric" pattern="[0-9]{8}" title="8 dígitos" value={apoderado.dni} onChange={cambia(setApoderado, apoderado, 'dni')} /></label>
          <label className="campo"><span>Correo</span><input required type="email" value={apoderado.correo} onChange={cambia(setApoderado, apoderado, 'correo')} /></label>

          <button type="submit" className="pbtn pbtn-p pbtn-ancho" style={{ marginTop: 8 }}>Continuar</button>
        </form>
      </div>
    </div>
  );
}
