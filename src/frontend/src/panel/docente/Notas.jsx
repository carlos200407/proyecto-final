import { useEffect, useState } from 'react';
import { pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import useDatos from '../useDatos';

const ENLACES = [{ to: '/docente/notas', texto: 'Mis notas' }];

// Media aritmética de las celdas escritas, limitando cada valor a 0–20.
function promedio(vals) {
  const n = vals.map(parseFloat).filter((v) => !Number.isNaN(v)).map((v) => Math.min(20, Math.max(0, v)));
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}

export default function Notas() {
  useEffect(() => { document.title = 'Registro de notas – El Técnico 3052'; }, []);
  const cursos = useDatos(() => pedirAuth('/docente/cursos'));
  const [elegido, setElegido] = useState(0);
  const lista = cursos.datos ?? [];
  const c = lista[elegido];

  return (
    <PanelEscritorio titulo={c ? `${c.grado}${c.letra} · ${c.curso}` : 'Registro de notas'} rol="Docente" enlaces={ENLACES}>
      {cursos.cargando && <Cargando />}
      {cursos.error && <ErrorCaja texto={cursos.error} />}
      {cursos.datos && lista.length === 0 && <p className="suave">Todavía no tienes cursos asignados. El director debe asignarte una sección y un curso.</p>}
      {lista.length > 1 && (
        <label className="campo" style={{ maxWidth: 360 }}><span>Curso y sección</span>
          <select value={elegido} onChange={(e) => setElegido(Number(e.target.value))}>
            {lista.map((x, i) => <option key={`${x.id_sec}-${x.id_cur}`} value={i}>{x.nivel} {x.grado}{x.letra} · {x.curso}</option>)}
          </select>
        </label>
      )}
      {c && <Planilla key={`${c.id_sec}-${c.id_cur}`} id_sec={c.id_sec} id_cur={c.id_cur} />}
    </PanelEscritorio>
  );
}

function Planilla({ id_sec, id_cur }) {
  const carga = useDatos(() => pedirAuth(`/docente/planilla/${id_sec}/${id_cur}`));
  if (carga.cargando) return <Cargando />;
  if (carga.error) return <ErrorCaja texto={carga.error} />;
  return <Tabla datos={carga.datos} id_sec={id_sec} id_cur={id_cur} />;
}

function Tabla({ datos, id_sec, id_cur }) {
  const { criterios, alumnos, seccion, anio } = datos;
  // valores[i][j] = texto de la celda del alumno i, criterio j
  const [valores, setValores] = useState(() =>
    alumnos.map((a) => criterios.map((c) => (a.notas[c.id_crit] === undefined ? '' : String(a.notas[c.id_crit])))),
  );
  const [estado, setEstado] = useState({ guardando: false, ok: false, error: '' });

  const cambiar = (i, j) => (e) => {
    setValores(valores.map((fila, a) => (a === i ? fila.map((v, b) => (b === j ? e.target.value : v)) : fila)));
    setEstado({ guardando: false, ok: false, error: '' });
  };
  const proms = valores.map(promedio);
  const validos = proms.filter((p) => p !== null);
  const general = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null;

  async function guardar() {
    setEstado({ guardando: true, ok: false, error: '' });
    const notas = [];
    alumnos.forEach((a, i) => criterios.forEach((c, j) => {
      const v = parseFloat(valores[i][j]);
      if (!Number.isNaN(v)) notas.push({ id_mat: a.id_mat, id_crit: c.id_crit, valor: v });
    }));
    try {
      await pedirAuth(`/docente/planilla/${id_sec}/${id_cur}`, { metodo: 'PUT', cuerpo: { notas } });
      setEstado({ guardando: false, ok: true, error: '' });
    } catch (err) {
      setEstado({ guardando: false, ok: false, error: err.message });
    }
  }

  if (criterios.length === 0) return <p className="suave">Este curso aún no tiene criterios de evaluación. El director debe crearlos.</p>;
  if (alumnos.length === 0) return <p className="suave">No hay alumnos matriculados (activos) en esta sección para {anio}.</p>;

  return (
    <>
      <p className="suave" style={{ margin: '0 0 16px', maxWidth: '44em' }}>Escribe las notas de 0 a 20. El promedio se calcula solo (media aritmética de los criterios). Las celdas vacías no se guardan.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <span className="etiqueta">{seccion.nivel} {seccion.grado}{seccion.letra}</span><span className="etiqueta">{seccion.curso}</span><span className="etiqueta">Año {anio}</span>
      </div>
      <div className="caja-tabla">
        <table>
          <thead><tr><th>Alumno</th>{criterios.map((c) => <th key={c.id_crit}>{c.nombre}</th>)}<th>Promedio</th><th>Estado</th></tr></thead>
          <tbody>
            {alumnos.map((a, i) => {
              const ok = proms[i] !== null && proms[i] >= 11;
              return (
                <tr key={a.id_mat}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{a.apellido}, {a.nombre}</td>
                  {criterios.map((c, j) => (
                    <td key={c.id_crit}><input className="nota" type="number" min="0" max="20" step="0.5" value={valores[i][j]} onChange={cambiar(i, j)} aria-label={`${c.nombre} de ${a.nombre} ${a.apellido}`} /></td>
                  ))}
                  <td><b style={{ fontSize: 18, color: '#1f5fbf' }}>{proms[i] === null ? '—' : proms[i].toFixed(2)}</b></td>
                  <td>{proms[i] !== null && <span className={`etiqueta ${ok ? 'etiqueta-ok' : 'etiqueta-no'}`}>{ok ? 'Aprobado' : 'En riesgo'}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="fila-acciones">
        <button type="button" className="pbtn pbtn-p" onClick={guardar} disabled={estado.guardando}>{estado.guardando ? 'Guardando…' : 'Guardar notas'}</button>
        {estado.ok && <span role="status" style={{ fontWeight: 600 }}>Notas guardadas</span>}
        {estado.error && <span role="alert" style={{ fontWeight: 600 }}>{estado.error}</span>}
        <span className="suave" style={{ marginLeft: 'auto' }}>Promedio de la sección: <b style={{ color: '#1f5fbf' }}>{general === null ? '—' : general.toFixed(2)}</b></span>
      </div>
    </>
  );
}
