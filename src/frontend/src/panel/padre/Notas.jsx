import { useEffect } from 'react';
import { CabPadre } from '../Estructura';

// Datos de ejemplo. Después vendrán de GET /api/notas/matricula/:id_mat/promedios
const CURSOS = [
  { nombre: 'Matemática', docente: 'Prof. Juan Ramírez', notas: [['Examen', 17.5], ['Práctica', 15], ['Tarea', 18]] },
  { nombre: 'Comunicación', docente: 'Prof. Ana Torres', notas: [['Examen', 14], ['Práctica', 16], ['Tarea', 15]] },
];
const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export default function Notas() {
  useEffect(() => { document.title = 'Notas – El Técnico 3052'; }, []);

  const cursos = CURSOS.map((c) => ({ ...c, prom: media(c.notas.map((n) => n[1])) }));
  const general = media(cursos.map((c) => c.prom));

  return (
    <div className="panel">
      <CabPadre />
      <div className="movil-cuerpo">
        <div className="franja" style={{ padding: '24px 20px' }}>
          <p className="suave" style={{ margin: 0, fontWeight: 600 }}>Hola, Luis Quispe</p>
          <h1>Mateo Quispe</h1>
          <p className="suave" style={{ margin: '4px 0 0' }}>Secundaria · 3°A · Año 2026</p>
          <div className="kpis2">
            <div><span className="suave" style={{ fontSize: 13 }}>Promedio general</span><b className="grande">{general.toFixed(2)}</b></div>
            <div><span className="suave" style={{ fontSize: 13 }}>Asistencia</span><b className="grande">50%</b><span className="suave" style={{ fontSize: 12 }}>1 presente · 1 falta</span></div>
          </div>
        </div>
        <div className="seccion">
          <div className="aviso">
            <p style={{ margin: 0, fontWeight: 600 }}>Citación</p>
            <p className="suave" style={{ margin: '2px 0 0' }}>Se cita al apoderado para reunión el viernes 25/09.</p>
          </div>
          <h2 style={{ fontSize: 22 }}>Notas por curso</h2>
          {cursos.map((c) => {
            const ok = c.prom >= 11;
            return (
              <details className="curso" key={c.nombre}>
                <summary>
                  <span style={{ flex: 1, minWidth: 0 }}><b>{c.nombre}</b><br /><span className="suave" style={{ fontSize: 13 }}>{c.docente}</span></span>
                  <span style={{ textAlign: 'right' }}>
                    <b style={{ fontSize: 22, color: '#1f5fbf' }}>{c.prom.toFixed(2)}</b><br />
                    <span className={`etiqueta ${ok ? 'etiqueta-ok' : 'etiqueta-no'}`}>{ok ? 'Aprobado' : 'En riesgo'}</span>
                  </span>
                </summary>
                <div className="detalle">
                  {c.notas.map(([crit, v]) => (
                    <div className="nota-fila" key={crit}><span>{crit}</span><b>{v.toFixed(2)}</b></div>
                  ))}
                  <p className="suave" style={{ margin: '8px 0 0', fontSize: 13 }}>Promedio = media aritmética de los criterios.</p>
                </div>
              </details>
            );
          })}
          <p className="suave" style={{ fontSize: 13 }}>Escala 0–20 · Aprobado desde 11. [Ajustar según el reglamento del colegio.]</p>
        </div>
      </div>
    </div>
  );
}
