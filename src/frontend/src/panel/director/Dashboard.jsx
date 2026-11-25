import { useEffect, useState } from 'react';
import { pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import useDatos from '../useDatos';
import { ENLACES_DIRECTOR } from './enlaces';

const mediaPonderada = (xs) => xs.reduce((a, r) => a + r.p * r.alum, 0) / xs.reduce((a, r) => a + r.alum, 0);
const ancho = (p) => `${Math.round((p / 20) * 100)}%`;

export default function Dashboard() {
  useEffect(() => { document.title = 'Calificaciones – El Técnico 3052'; }, []);
  const carga = useDatos(() => pedirAuth('/dashboard/calificaciones'));

  return (
    <PanelEscritorio titulo="Calificaciones" rol="Director" enlaces={ENLACES_DIRECTOR}>
      {carga.cargando && <Cargando />}
      {carga.error && <ErrorCaja texto={carga.error} />}
      {carga.datos && <Tablero datos={carga.datos} />}
    </PanelEscritorio>
  );
}

function Tablero({ datos }) {
  const [filtro, setFiltro] = useState('Todos');

  // Una fila por sección: promedio de la sección y % de alumnos aprobados (promedio >= 11).
  const todas = datos.secciones.map((s) => ({
    nivel: s.nivel,
    grado: `${s.grado} ${s.nivel === 'Primaria' ? 'grado' : 'año'}`,
    sec: `${s.grado}${s.letra}`,
    p: Number(s.promedio),
    alum: s.alumnos,
    aprob: Math.round((s.aprobados / s.alumnos) * 100),
  }));

  if (todas.length === 0) {
    return <p className="suave">Todavía no hay notas registradas para {datos.anio}. Cuando los docentes las guarden, aparecerán aquí.</p>;
  }

  const sel = todas.filter((r) => filtro === 'Todos' || r.nivel === filtro);
  const total = sel.reduce((a, r) => a + r.alum, 0);
  const aprob = sel.reduce((a, r) => a + (r.alum * r.aprob) / 100, 0) / total;

  const porNivel = ['Primaria', 'Secundaria']
    .filter((n) => (filtro === 'Todos' || n === filtro) && todas.some((r) => r.nivel === n))
    .map((n) => ({ nombre: n, p: mediaPonderada(todas.filter((r) => r.nivel === n)) }));

  const grupos = [];
  sel.forEach((r) => {
    const k = r.nivel + r.grado;
    let g = grupos.find((x) => x.k === k);
    if (!g) { g = { k, nombre: `${r.nivel === 'Primaria' ? 'Prim.' : 'Sec.'} ${r.grado}`, rs: [] }; grupos.push(g); }
    g.rs.push(r);
  });

  return (
    <>
      <p className="suave" style={{ margin: '0 0 12px' }}>Promedios por nivel, grado y sección · Año {datos.anio}.</p>
      <div className="filtros">
        {['Todos', 'Primaria', 'Secundaria'].map((n) => (
          <button key={n} type="button" aria-pressed={n === filtro} className={`pbtn ${n === filtro ? 'pbtn-p' : 'pbtn-s'}`} style={{ minHeight: 40 }} onClick={() => setFiltro(n)}>{n}</button>
        ))}
      </div>

      {sel.length === 0 ? <p className="suave">No hay datos para este nivel.</p> : (
        <>
          <div className="kpis">
            <div className="kpi"><span className="suave" style={{ fontSize: 13 }}>Promedio general</span><b>{mediaPonderada(sel).toFixed(2)}</b></div>
            <div className="kpi"><span className="suave" style={{ fontSize: 13 }}>Aprobados</span><b>{Math.round(aprob * 100)}%</b></div>
            <div className="kpi"><span className="suave" style={{ fontSize: 13 }}>Alumnos evaluados</span><b>{total}</b></div>
            <div className="kpi"><span className="suave" style={{ fontSize: 13 }}>Secciones en riesgo</span><b>{sel.filter((r) => r.p < 11).length}</b></div>
          </div>

          <div className="dos-col">
            <section className="tarjeta" style={{ flex: '1 1 300px', minWidth: 0 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Por nivel</h2>
              {porNivel.map((b) => (
                <div key={b.nombre} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{b.nombre}</span><b>{b.p.toFixed(2)}</b></div>
                  <div className="barra"><i style={{ width: ancho(b.p) }} /></div>
                </div>
              ))}
              <p className="suave" style={{ margin: '8px 0 0', fontSize: 13 }}>Escala 0–20.</p>
            </section>
            <section className="tarjeta" style={{ flex: '2 1 420px', minWidth: 0 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Por grado</h2>
              {grupos.map((g) => {
                const p = mediaPonderada(g.rs);
                return (
                  <div className="barra-fila" key={g.k}>
                    <span className="nom">{g.nombre}</span>
                    <div className="barra"><i style={{ width: ancho(p) }} /></div>
                    <b>{p.toFixed(1)}</b>
                  </div>
                );
              })}
            </section>
          </div>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Por sección</h2>
            <div className="caja-tabla">
              <table>
                <thead><tr><th>Nivel</th><th>Sección</th><th>Alumnos</th><th>Promedio</th><th>Aprobados</th><th>Estado</th></tr></thead>
                <tbody>
                  {sel.map((r) => (
                    <tr key={r.nivel + r.sec}>
                      <td>{r.nivel}</td><td><b>{r.sec}</b></td><td>{r.alum}</td>
                      <td><b style={{ color: '#1f5fbf' }}>{r.p.toFixed(2)}</b></td><td>{r.aprob}%</td>
                      <td><span className={`etiqueta ${r.p >= 11 ? 'etiqueta-ok' : 'etiqueta-no'}`}>{r.p >= 11 ? 'Normal' : 'En riesgo'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
