import { useEffect, useState } from 'react';
import { pedir, pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import { ENLACES_DIRECTOR } from './enlaces';

export default function Docentes() {
  useEffect(() => { document.title = 'Asignar docentes – El Técnico 3052'; }, []);
  const [secciones, setSecciones] = useState(null);
  const [idSec, setIdSec] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    pedir('/secciones/vacantes')
      .then((d) => {
        if (!vivo) return;
        setSecciones(d.secciones);
        setIdSec(d.secciones[0]?.id_sec ?? '');
      })
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, []);

  return (
    <PanelEscritorio titulo="Asignar docentes" rol="Director" enlaces={ENLACES_DIRECTOR}>
      {!secciones && !error && <Cargando />}
      {error && <ErrorCaja texto={error} />}
      {secciones && secciones.length === 0 && <p className="suave">Todavía no hay secciones. Créalas en la pantalla Secciones.</p>}
      {secciones && secciones.length > 0 && (
        <>
          <label className="campo" style={{ maxWidth: 320 }}><span>Sección</span>
            <select value={idSec} onChange={(e) => setIdSec(e.target.value)}>
              {secciones.map((s) => <option key={s.id_sec} value={s.id_sec}>{s.nivel} {s.grado}{s.letra}</option>)}
            </select>
          </label>
          {idSec !== '' && <Asignaciones key={idSec} idSec={idSec} />}
        </>
      )}
    </PanelEscritorio>
  );
}

function Asignaciones({ idSec }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vivo = true;
    pedirAuth(`/director/asignaciones/${idSec}`)
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, [idSec]);

  async function asignar(fila, valor, todas) {
    setError(''); setAviso('');
    try {
      const r = await pedirAuth(`/director/asignaciones/${fila.id_seccur}`, {
        metodo: 'PUT',
        cuerpo: { id_docente: valor === '' ? null : Number(valor), todas_las_secciones: todas },
      });
      if (todas) {
        setAviso(`${fila.curso}: docente aplicado a ${r.actualizadas} ${r.actualizadas === 1 ? 'sección' : 'secciones'} del grado.`);
      } else {
        setAviso(`${fila.curso}: guardado.`);
      }
      setDatos((d) => ({ ...d, cursos: d.cursos.map((c) => (c.id_seccur === fila.id_seccur ? { ...c, id_docente: r.id_docente } : c)) }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !datos) return <ErrorCaja texto={error} />;
  if (!datos) return <Cargando />;

  const sin = datos.cursos.filter((c) => c.id_docente === null).length;

  return (
    <>
      {datos.cursos.length === 0 && (
        <p className="aviso">Esta sección no tiene cursos. Créalos en <b>Cursos</b> para {datos.seccion.nivel} {datos.seccion.grado}, o pulsa “Sincronizar” allí.</p>
      )}
      {datos.cursos.length > 0 && sin > 0 && <p className="aviso">Faltan docentes en <b>{sin}</b> {sin === 1 ? 'curso' : 'cursos'} de esta sección.</p>}
      {error && <p role="alert" style={{ margin: '0 0 12px', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f', background: '#fff' }}>{error}</p>}
      {aviso && <p role="status" className="aviso-clave" style={{ margin: '0 0 12px' }}>{aviso}</p>}
      {datos.cursos.length > 0 && (
        <div className="caja-tabla">
          <table className="tabla-movil">
            <thead><tr><th>Curso</th><th>Docente</th><th /></tr></thead>
            <tbody>
              {datos.cursos.map((c) => (
                <tr key={c.id_seccur}>
                  <td><b>{c.curso}</b></td>
                  <td data-label="Docente">
                    <select aria-label={`Docente de ${c.curso}`} value={c.id_docente ?? ''} onChange={(e) => asignar(c, e.target.value, false)}
                      style={{ minHeight: 40, borderRadius: 8, border: '1px solid #7fa6cc', padding: '0 8px', font: 'inherit', minWidth: 220 }}>
                      <option value="">— Sin docente —</option>
                      {datos.docentes.map((d) => <option key={d.id_usu} value={d.id_usu}>{d.apellido}, {d.nombre}</option>)}
                    </select>
                  </td>
                  <td className="acciones" style={{ textAlign: 'right' }}>
                    <button type="button" className="pbtn pbtn-d" disabled={c.id_docente === null}
                      title="Pone a este docente en este curso en todas las secciones del grado"
                      onClick={() => asignar(c, c.id_docente, true)}>Aplicar a todo el grado</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="suave" style={{ margin: '12px 0 0', fontSize: 13 }}>El cambio se guarda al elegir. Solo aparecen docentes activos; si falta alguien, créalo en Usuarios.</p>
    </>
  );
}
