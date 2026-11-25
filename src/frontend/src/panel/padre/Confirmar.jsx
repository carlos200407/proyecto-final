import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { pedirAuth } from '../../api';
import { CabMovil } from '../Estructura';

export default function Confirmar() {
  const { state } = useLocation();
  const [acepta, setAcepta] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => { document.title = 'Confirmar matrícula – El Técnico 3052'; }, []);

  // Si entró directo a esta dirección, vuelve al paso 1.
  if (!state) return <Navigate to="/padre/matricula" replace />;

  const { nivel, grado, alumno, apoderado, anio } = state;
  const filas = [
    ['Alumno', `${alumno.nombre} ${alumno.apellido}`],
    ['DNI alumno', alumno.dni],
    ['Nivel y grado', `${nivel} · ${grado}`],
    ['Año lectivo', String(anio)],
    ['Apoderado', `${apoderado.nombre} ${apoderado.apellido}`],
  ];

  async function confirmar() {
    setError('');
    setEnviando(true);
    try {
      const r = await pedirAuth('/matriculas/en-linea', {
        metodo: 'POST',
        cuerpo: { nombre: alumno.nombre, apellido: alumno.apellido, dni: alumno.dni, nivel, grado },
      });
      setResultado(r);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="panel">
      <CabMovil titulo="Matrícula en línea" volverA="/padre/matricula" volverTxt="Atrás" />
      <div className="movil-cuerpo">
        <div className="franja">
          <p className="suave" style={{ margin: 0, fontWeight: 600 }}>Paso 2 de 2</p>
          <h1>Confirma tu matrícula</h1>
          <div className="pasos"><span className="ok" /><span className="ok" /></div>
        </div>
        <div className="seccion">
          {!resultado ? (
            <>
              <div className="tarjeta">
                {filas.map(([k, v]) => (
                  <div className="resumen-fila" key={k}><span className="suave">{k}</span><b style={{ textAlign: 'right' }}>{v}</b></div>
                ))}
              </div>
              <p className="suave" style={{ margin: '16px 0' }}>[Texto sobre el proceso: la secretaría revisa los datos y confirma la sección.]</p>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
                <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
                <span>Declaro que los datos son correctos.</span>
              </label>
              {error && <p role="alert" style={{ margin: '0 0 16px', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f' }}>{error}</p>}
              <button type="button" className="pbtn pbtn-p pbtn-ancho" disabled={!acepta || enviando} onClick={confirmar}>
                {enviando ? 'Enviando…' : 'Confirmar matrícula'}
              </button>
              <Link className="pbtn pbtn-s pbtn-ancho" to="/padre/matricula" style={{ marginTop: 10 }}>Corregir datos</Link>
            </>
          ) : (
            <div className="tarjeta exito" role="status">
              <div className="tilde">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              </div>
              <h2 style={{ fontSize: 24 }}>Solicitud enviada</h2>
              <p className="suave" style={{ margin: '8px 0 4px' }}>Estado: <span className="etiqueta">Pendiente de revisión</span></p>
              <p className="suave" style={{ margin: '0 0 12px' }}>Sección provisional: <b>{resultado.seccion.grado}{resultado.seccion.letra}</b></p>
              <p className="suave" style={{ margin: '0 0 20px' }}>[Mensaje: la secretaría confirmará la matrícula y la sección.]</p>
              <Link className="pbtn pbtn-p pbtn-ancho" to="/padre/notas">Ir a mi cuenta</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
