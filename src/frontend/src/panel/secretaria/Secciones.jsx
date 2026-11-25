import { useEffect, useState } from 'react';
import { pedir, pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import { ENLACES_SECRETARIA, nombreNivel, nombreSeccion } from './enlaces';

export default function Secciones() {
  useEffect(() => { document.title = 'Secciones – El Técnico 3052'; }, []);
  const [version, setVersion] = useState(0); // sube cada vez que algo cambia, para recargar
  const [vac, setVac] = useState(null);
  const [error, setError] = useState('');
  const [nivel, setNivel] = useState('Todos');

  useEffect(() => {
    let vivo = true;
    pedir('/secciones/vacantes')
      .then((d) => vivo && setVac(d))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, [version]);

  const todas = vac?.secciones ?? [];
  const mostradas = todas.filter((s) => nivel === 'Todos' || s.nivel === nivel);

  return (
    <PanelEscritorio titulo="Secciones y alumnos" rol="Secretaría" enlaces={ENLACES_SECRETARIA}>
      {!vac && !error && <Cargando />}
      {error && <ErrorCaja texto={error} />}
      {vac && (
        <>
          <p className="suave" style={{ margin: '0 0 12px' }}>
            Vacantes y alumnos por sección · matrícula {vac.anio}. Abre una sección para ver su lista, cambiar a un alumno de salón o retirarlo.
          </p>
          <div className="filtros">
            {['Todos', 'Primaria', 'Secundaria'].map((n) => (
              <button key={n} type="button" aria-pressed={n === nivel} className={`pbtn ${n === nivel ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => setNivel(n)}>{n}</button>
            ))}
          </div>
          {mostradas.length === 0 && <p className="suave">No hay secciones para mostrar.</p>}
          {mostradas.map((s) => (
            <Salon key={s.id_sec} s={s} hermanas={todas.filter((x) => x.nivel === s.nivel && x.grado === s.grado)} version={version} alCambiar={() => setVersion((v) => v + 1)} />
          ))}
        </>
      )}
    </PanelEscritorio>
  );
}

function Salon({ s, hermanas, version, alCambiar }) {
  const [abierta, setAbierta] = useState(false);
  const pct = Math.min(100, Math.round((s.ocupadas / s.capacidad) * 100));

  return (
    <details className="curso" onToggle={(e) => e.currentTarget.open && setAbierta(true)}>
      <summary>
        <b style={{ flex: '0 0 110px' }}>{nombreNivel(s.nivel)} {nombreSeccion(s)}</b>
        <span className="barra" style={{ flex: 1 }} aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
        <span style={{ flex: '0 0 150px', textAlign: 'right' }}>{s.ocupadas}/{s.capacidad} · {Math.max(0, s.disponibles)} libres</span>
      </summary>
      <div className="detalle">
        {abierta && <Nomina s={s} hermanas={hermanas} version={version} alCambiar={alCambiar} />}
      </div>
    </details>
  );
}

function Nomina({ s, hermanas, version, alCambiar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [retirando, setRetirando] = useState(null); // id_mat que espera confirmación

  useEffect(() => {
    let vivo = true;
    pedirAuth(`/secretaria/nomina/${s.id_sec}`)
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, [s.id_sec, version]);

  async function mover(a, id_sec) {
    setError('');
    try {
      await pedirAuth(`/secretaria/matriculas/${a.id_mat}/seccion`, { metodo: 'PATCH', cuerpo: { id_sec: Number(id_sec) } });
      alCambiar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function retirar(a) {
    setError('');
    try {
      await pedirAuth(`/secretaria/matriculas/${a.id_mat}/retirar`, { metodo: 'PATCH' });
      setRetirando(null);
      alCambiar();
    } catch (err) {
      setError(err.message);
      setRetirando(null);
    }
  }

  if (error && !datos) return <ErrorCaja texto={error} />;
  if (!datos) return <Cargando />;
  if (datos.alumnos.length === 0) return <p className="suave">Esta sección todavía no tiene alumnos.</p>;

  return (
    <>
      {error && <p role="alert" style={{ margin: '8px 0', padding: '10px 12px', borderRadius: 8, border: '2px solid #12315f' }}>{error}</p>}
      <div className="caja-tabla">
        <table className="tabla-movil">
          <thead><tr><th>Alumno</th><th>Estado</th><th>Cambiar a</th><th /></tr></thead>
          <tbody>
            {datos.alumnos.map((a) => (
              <tr key={a.id_mat}>
                <td><b>{a.apellido}, {a.nombre}</b><br /><span className="suave" style={{ fontSize: 13 }}>DNI {a.dni}</span></td>
                <td data-label="Estado"><span className={`etiqueta ${a.estado === 'Activa' ? 'etiqueta-ok' : ''}`}>{a.estado}</span></td>
                <td data-label="Cambiar a">
                  {a.movible ? (
                    <select aria-label={`Mover a ${a.nombre}`} value={s.id_sec} onChange={(e) => mover(a, e.target.value)}
                      style={{ minHeight: 40, borderRadius: 8, border: '1px solid #7fa6cc', padding: '0 8px', font: 'inherit' }}>
                      {hermanas.map((h) => (
                        <option key={h.id_sec} value={h.id_sec} disabled={h.id_sec !== s.id_sec && h.disponibles <= 0}>
                          {h.letra} · {Math.max(0, h.disponibles)} libres
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="suave" style={{ fontSize: 13 }}>Ya tiene notas o asistencias</span>
                  )}
                </td>
                <td className="acciones" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {a.estado === 'Activa' && (retirando === a.id_mat ? (
                    <>
                      <span style={{ marginRight: 8, fontSize: 14 }}>¿Retirar?</span>
                      <button type="button" className="pbtn pbtn-d" onClick={() => retirar(a)}>Sí</button>{' '}
                      <button type="button" className="pbtn pbtn-d" onClick={() => setRetirando(null)}>No</button>
                    </>
                  ) : (
                    <button type="button" className="pbtn pbtn-d" onClick={() => setRetirando(a.id_mat)}>Retirar</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
