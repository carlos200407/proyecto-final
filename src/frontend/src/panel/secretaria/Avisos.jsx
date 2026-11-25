import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { pedir, pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import { ENLACES_SECRETARIA, nombreNivel, nombreTipo, nombreSeccion } from './enlaces';

const MAX = 1000;

export default function Avisos() {
  useEffect(() => { document.title = 'Avisos a padres – El Técnico 3052'; }, []);
  const { state } = useLocation();
  const [version, setVersion] = useState(0);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    Promise.all([pedirAuth('/secretaria/avisos'), pedir('/secciones/vacantes')])
      .then(([avisos, vac]) => vivo && setDatos({ avisos, secciones: vac.secciones }))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, [version]);

  return (
    <PanelEscritorio titulo="Avisos a padres" rol="Secretaría" enlaces={ENLACES_SECRETARIA}>
      {!datos && !error && <Cargando />}
      {error && <ErrorCaja texto={error} />}
      {datos && (
        <div className="dos-col">
          <Redactar secciones={datos.secciones} alumnoInicial={state?.alumno ?? null} alEnviar={() => setVersion((v) => v + 1)} />
          <Historial avisos={datos.avisos} />
        </div>
      )}
    </PanelEscritorio>
  );
}

function Redactar({ secciones, alumnoInicial, alEnviar }) {
  const [destino, setDestino] = useState(alumnoInicial ? 'alumno' : 'seccion');
  const [alumno, setAlumno] = useState(alumnoInicial);
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState(null);
  const [idSec, setIdSec] = useState(secciones[0]?.id_sec ?? '');
  const [tipo, setTipo] = useState('Citacion');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function buscar(e) {
    e.preventDefault();
    setError('');
    try {
      setResultados(await pedirAuth(`/secretaria/buscar?q=${encodeURIComponent(q.trim())}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setAviso('');
    if (destino === 'alumno' && !alumno) { setError('Elige primero al alumno.'); return; }
    setEnviando(true);
    try {
      if (destino === 'alumno') {
        await pedirAuth('/notificaciones', { metodo: 'POST', cuerpo: { id_alu: alumno.id_alu, tipo, mensaje: mensaje.trim() } });
        setAviso(`${nombreTipo(tipo)} enviado al apoderado de ${alumno.nombre} ${alumno.apellido}.`);
      } else {
        const r = await pedirAuth('/secretaria/avisos/seccion', { metodo: 'POST', cuerpo: { id_sec: Number(idSec), tipo, mensaje: mensaje.trim() } });
        setAviso(`${nombreTipo(tipo)} enviado a ${r.enviados} apoderados.`);
      }
      setMensaje('');
      alEnviar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta" style={{ flex: '1 1 340px', minWidth: 0 }} onSubmit={enviar}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Nuevo aviso</h2>
      <div className="fila-doble">
        {[['alumno', 'A un alumno'], ['seccion', 'A una sección']].map(([k, t]) => (
          <button key={k} type="button" aria-pressed={destino === k} className={`pbtn ${destino === k ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => setDestino(k)}>{t}</button>
        ))}
      </div>

      {destino === 'alumno' ? (
        <div style={{ marginBottom: 14 }}>
          {alumno ? (
            <p style={{ margin: 0 }}>
              <b>{alumno.nombre} {alumno.apellido}</b> <span className="suave">· DNI {alumno.dni}</span>{' '}
              <button type="button" className="pbtn pbtn-d" onClick={() => { setAlumno(null); setResultados(null); }}>Cambiar</button>
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <input aria-label="Buscar alumno" placeholder="Nombre o DNI del alumno" value={q} onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscar(e)}
                  style={{ flex: 1, minHeight: 44, borderRadius: 8, border: '1px solid #7fa6cc', padding: '0 12px', font: 'inherit' }} />
                <button type="button" className="pbtn pbtn-s" onClick={buscar} disabled={q.trim().length < 2}>Buscar</button>
              </div>
              {resultados && resultados.length === 0 && <p className="suave" style={{ margin: '8px 0 0' }}>Sin resultados.</p>}
              {resultados && resultados.slice(0, 8).map((r) => (
                <button key={r.id_alu} type="button" className="pbtn pbtn-d" style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 6 }}
                  onClick={() => setAlumno({ id_alu: r.id_alu, nombre: r.nombre, apellido: r.apellido, dni: r.dni })}>
                  {r.apellido}, {r.nombre} · DNI {r.dni}{r.estado ? ` · ${nombreNivel(r.nivel)} ${r.grado}${r.letra}` : ''}
                </button>
              ))}
            </>
          )}
        </div>
      ) : (
        <label className="campo"><span>Sección (todos sus alumnos activos)</span>
          <select value={idSec} onChange={(e) => setIdSec(e.target.value)}>
            {secciones.map((s) => <option key={s.id_sec} value={s.id_sec}>{s.nivel} {nombreSeccion(s)}</option>)}
          </select>
        </label>
      )}

      <label className="campo"><span>Tipo</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="Citacion">Citación</option>
          <option value="Amonestacion">Amonestación</option>
          <option value="Informativa">Informativo</option>
        </select>
      </label>
      <label className="campo"><span>Mensaje ({mensaje.length}/{MAX})</span>
        <textarea required maxLength={MAX} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
      </label>
      <button type="submit" className="pbtn pbtn-p pbtn-ancho" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar aviso'}</button>
      {error && <p role="alert" style={{ margin: '16px 0 0', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f' }}>{error}</p>}
      {aviso && <p role="status" className="aviso-clave" style={{ margin: '16px 0 0' }}>{aviso}</p>}
    </form>
  );
}

function Historial({ avisos }) {
  return (
    <section style={{ flex: '2 1 420px', minWidth: 0 }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Últimos avisos enviados</h2>
      {avisos.length === 0 ? <p className="suave">Todavía no se enviaron avisos.</p> : (
        <div className="caja-tabla">
          <table>
            <thead><tr><th>Fecha</th><th>Alumno</th><th>Tipo</th><th>Mensaje</th></tr></thead>
            <tbody>
              {avisos.map((a) => (
                <tr key={a.id_notif}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(a.fecha_envio).toLocaleDateString('es-PE', { timeZone: 'UTC' })}</td>
                  <td>{a.nombre} {a.apellido}</td>
                  <td><span className={`etiqueta ${a.tipo === 'Amonestacion' ? 'etiqueta-no' : ''}`}>{nombreTipo(a.tipo)}</span></td>
                  <td style={{ maxWidth: 320 }}>{a.mensaje}<br /><span className="suave" style={{ fontSize: 12 }}>por {a.env_nombre} {a.env_apellido}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
