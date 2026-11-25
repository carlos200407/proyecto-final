import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedirAuth } from '../../api';
import { CabPadre } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import useDatos from '../useDatos';

const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export default function Notas() {
  const [elegido, setElegido] = useState(0);
  const perfil = useDatos(() => pedirAuth('/padres/yo'));

  useEffect(() => { document.title = 'Notas – El Técnico 3052'; }, []);

  const { cargando, datos, error } = perfil;
  const hijo = datos?.hijos[elegido];

  return (
    <div className="panel">
      <CabPadre />
      <div className="movil-cuerpo">
        {cargando && <Cargando />}
        {error && <ErrorCaja texto={error} />}
        {datos && datos.hijos.length === 0 && (
          <div className="seccion">
            <h1 style={{ fontSize: 24 }}>Hola, {datos.padre.nombre}</h1>
            <p className="suave">Todavía no tienes hijos registrados en el colegio.</p>
            <Link className="pbtn pbtn-p pbtn-ancho" to="/padre/matricula">Matricular a mi hijo o hija</Link>
          </div>
        )}
        {hijo && (
          <>
            {datos.hijos.length > 1 && (
              <div className="seccion" style={{ paddingBottom: 0 }}>
                <label className="campo"><span>Hijo o hija</span>
                  <select value={elegido} onChange={(e) => setElegido(Number(e.target.value))}>
                    {datos.hijos.map((h, i) => <option key={h.id_alu} value={i}>{h.nombre} {h.apellido}</option>)}
                  </select>
                </label>
              </div>
            )}
            <Hijo key={hijo.id_alu} padre={datos.padre} hijo={hijo} anio={datos.anio_academico} />
          </>
        )}
      </div>
    </div>
  );
}

function Hijo({ padre, hijo, anio }) {
  // Matrícula del año académico; si no hay, la más reciente.
  const mat = hijo.matriculas.find((m) => m.anio === anio && m.estado === 'Activa') ?? hijo.matriculas[0];
  const carga = useDatos(() => {
    if (!mat || mat.estado !== 'Activa') return Promise.resolve(null);
    return Promise.all([
      pedirAuth(`/notas/matricula/${mat.id_mat}`),
      pedirAuth(`/asistencias/matricula/${mat.id_mat}`),
      pedirAuth(`/notificaciones/alumno/${hijo.id_alu}`),
    ]).then(([notas, asistencias, avisos]) => ({ notas, asistencias, avisos }));
  });

  const cab = (
    <div className="franja" style={{ padding: '24px 20px' }}>
      <p className="suave" style={{ margin: 0, fontWeight: 600 }}>Hola, {padre.nombre} {padre.apellido}</p>
      <h1>{hijo.nombre} {hijo.apellido}</h1>
      {mat && <p className="suave" style={{ margin: '4px 0 0' }}>{mat.nivel} · {mat.grado}{mat.letra} · Año {mat.anio}</p>}
      {carga.datos && <Resumen datos={carga.datos} />}
    </div>
  );

  if (!mat) {
    return <>{cab}<div className="seccion"><p className="suave">Este alumno todavía no tiene matrícula.</p><Link className="pbtn pbtn-p pbtn-ancho" to="/padre/matricula">Matricular</Link></div></>;
  }
  if (mat.estado === 'Pendiente') {
    return <>{cab}<div className="seccion"><div className="aviso"><p style={{ margin: 0, fontWeight: 600 }}>Matrícula {mat.anio} pendiente</p><p className="suave" style={{ margin: '2px 0 0' }}>La secretaría está revisando la solicitud. Las notas aparecerán cuando sea confirmada.</p></div></div></>;
  }

  return (
    <>
      {cab}
      <div className="seccion">
        {carga.cargando && <Cargando />}
        {carga.error && <ErrorCaja texto={carga.error} />}
        {carga.datos && <Detalle datos={carga.datos} />}
      </div>
    </>
  );
}

// Notas agrupadas por curso: media aritmética de los criterios.
function cursosDe(notas) {
  const mapa = new Map();
  for (const n of notas) {
    if (!mapa.has(n.id_cur)) {
      mapa.set(n.id_cur, {
        id_cur: n.id_cur,
        nombre: n.curso,
        docente: n.nombre_docente ? `Prof. ${n.nombre_docente} ${n.apellido_docente}` : '',
        notas: [],
      });
    }
    mapa.get(n.id_cur).notas.push([n.criterio, Number(n.valor)]);
  }
  return [...mapa.values()].map((c) => ({ ...c, prom: media(c.notas.map((x) => x[1])) }));
}

// Asistió = Presente, Tardanza o Justificada. Falta = Falta.
function asistenciaDe(asistencias) {
  const total = asistencias.length;
  const faltas = asistencias.filter((a) => a.estado === 'Falta').length;
  const presentes = asistencias.filter((a) => a.estado === 'Presente' || a.estado === 'Tardanza').length;
  const asistio = total - faltas;
  return { total, faltas, presentes, pct: total ? Math.round((asistio / total) * 100) : null };
}

function Resumen({ datos }) {
  const cursos = cursosDe(datos.notas);
  const general = cursos.length ? media(cursos.map((c) => c.prom)) : null;
  const asis = asistenciaDe(datos.asistencias);
  return (
    <div className="kpis2">
      <div><span className="suave" style={{ fontSize: 13 }}>Promedio general</span><b className="grande">{general === null ? '—' : general.toFixed(2)}</b></div>
      <div>
        <span className="suave" style={{ fontSize: 13 }}>Asistencia</span>
        <b className="grande">{asis.pct === null ? '—' : `${asis.pct}%`}</b>
        <span className="suave" style={{ fontSize: 12 }}>{asis.presentes} {asis.presentes === 1 ? 'presente' : 'presentes'} · {asis.faltas} {asis.faltas === 1 ? 'falta' : 'faltas'}</span>
      </div>
    </div>
  );
}

function Detalle({ datos }) {
  const cursos = cursosDe(datos.notas);
  const ultimo = datos.avisos[0];
  return (
    <>
      {ultimo && (
        <div className="aviso">
          <p style={{ margin: 0, fontWeight: 600 }}>{ultimo.tipo === 'Citacion' ? 'Citación' : ultimo.tipo === 'Amonestacion' ? 'Amonestación' : 'Aviso'}</p>
          <p className="suave" style={{ margin: '2px 0 0' }}>{ultimo.mensaje}</p>
        </div>
      )}
      <h2 style={{ fontSize: 22 }}>Notas por curso</h2>
      {cursos.length === 0 && <p className="suave">Todavía no hay notas registradas.</p>}
      {cursos.map((c) => {
        const ok = c.prom >= 11;
        return (
          <details className="curso" key={c.id_cur}>
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
    </>
  );
}

