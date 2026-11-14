import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CabMovil } from '../Estructura';

const EJEMPLO = {
  nivel: 'Secundaria', grado: '3° año',
  alumno: { nombre: 'Mateo', apellido: 'Quispe', dni: '78912345' },
  apoderado: { nombre: 'Luis', apellido: 'Quispe' },
};

export default function Confirmar() {
  const { state } = useLocation();
  const d = state || EJEMPLO;
  const [listo, setListo] = useState(false);
  const [acepta, setAcepta] = useState(true);

  useEffect(() => { document.title = 'Confirmar matrícula – El Técnico 3052'; }, []);

  const filas = [
    ['Alumno', `${d.alumno.nombre} ${d.alumno.apellido}`],
    ['DNI alumno', d.alumno.dni],
    ['Nivel y grado', `${d.nivel} · ${d.grado}`],
    ['Año lectivo', '2027'],
    ['Apoderado', `${d.apoderado.nombre} ${d.apoderado.apellido}`],
  ];

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
          {!listo ? (
            <>
              <div className="tarjeta">
                {filas.map(([k, v]) => (
                  <div className="resumen-fila" key={k}><span className="suave">{k}</span><b style={{ textAlign: 'right' }}>{v}</b></div>
                ))}
              </div>
              <p className="suave" style={{ margin: '16px 0' }}>[Texto sobre el proceso: la secretaría revisa los datos y asigna la sección.]</p>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
                <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 2 }} />
                <span>Declaro que los datos son correctos.</span>
              </label>
              <button type="button" className="pbtn pbtn-p pbtn-ancho" disabled={!acepta} onClick={() => setListo(true)}>Confirmar matrícula</button>
              <Link className="pbtn pbtn-s pbtn-ancho" to="/padre/matricula" style={{ marginTop: 10 }}>Corregir datos</Link>
            </>
          ) : (
            <div className="tarjeta exito" role="status">
              <div className="tilde">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              </div>
              <h2 style={{ fontSize: 24 }}>Solicitud enviada</h2>
              <p className="suave" style={{ margin: '8px 0 12px' }}>Estado: <span className="etiqueta">Pendiente de revisión</span></p>
              <p className="suave" style={{ margin: '0 0 20px' }}>[Mensaje: te avisaremos por correo cuando la secretaría asigne la sección.]</p>
              <Link className="pbtn pbtn-p pbtn-ancho" to="/padre/notas">Ir a mi cuenta</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
