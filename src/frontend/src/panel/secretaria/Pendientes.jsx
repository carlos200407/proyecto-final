import { useEffect, useState } from 'react';
import { pedir, pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import useDatos from '../useDatos';
import { ENLACES_SECRETARIA, nombreNivel, nombreSeccion } from './enlaces';

export default function Pendientes() {
  useEffect(() => { document.title = 'Matrículas pendientes – El Técnico 3052'; }, []);
  const carga = useDatos(() =>
    Promise.all([pedirAuth('/secretaria/pendientes'), pedir('/secciones/vacantes')]).then(([pendientes, vac]) => ({ pendientes, vac })),
  );

  return (
    <PanelEscritorio titulo="Matrículas pendientes" rol="Secretaría" enlaces={ENLACES_SECRETARIA}>
      {carga.cargando && <Cargando />}
      {carga.error && <ErrorCaja texto={carga.error} />}
      {carga.datos && <Lista inicial={carga.datos.pendientes} secciones={carga.datos.vac.secciones} anio={carga.datos.vac.anio} />}
    </PanelEscritorio>
  );
}

function Lista({ inicial, secciones, anio }) {
  const [lista, setLista] = useState(inicial);
  const [aviso, setAviso] = useState('');

  const resolver = (m, texto) => {
    setLista((l) => l.filter((x) => x.id_mat !== m.id_mat));
    setAviso(texto);
  };

  return (
    <>
      <p className="suave" style={{ margin: '0 0 12px' }}>
        Solicitudes hechas por los apoderados desde la matrícula en línea (año {anio}). Revisa los datos, elige la sección y confirma.
      </p>
      {aviso && <p role="status" className="aviso">{aviso}</p>}
      {lista.length === 0 ? (
        <p className="suave">No hay solicitudes pendientes. 🎉</p>
      ) : (
        <div className="caja-tabla">
          <table>
            <thead><tr><th>Alumno</th><th>Apoderado</th><th>Grado</th><th>Sección</th><th /></tr></thead>
            <tbody>
              {lista.map((m) => (
                <Solicitud
                  key={m.id_mat}
                  m={m}
                  opciones={secciones.filter((s) => s.nivel === m.nivel && s.grado === m.grado)}
                  alResolver={resolver}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Solicitud({ m, opciones, alResolver }) {
  const [sec, setSec] = useState(m.id_sec);
  const [trabajando, setTrabajando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [error, setError] = useState('');

  async function confirmar() {
    setError('');
    setTrabajando(true);
    try {
      await pedirAuth(`/secretaria/matriculas/${m.id_mat}/confirmar`, { metodo: 'PATCH', cuerpo: { id_sec: Number(sec) } });
      const destino = opciones.find((s) => s.id_sec === Number(sec));
      alResolver(m, `Matrícula confirmada: ${m.nombre} ${m.apellido} → ${destino ? nombreSeccion(destino) : 'sección'}.`);
    } catch (err) {
      setError(err.message);
      setTrabajando(false);
    }
  }

  async function rechazar() {
    setError('');
    setTrabajando(true);
    try {
      await pedirAuth(`/secretaria/matriculas/${m.id_mat}`, { metodo: 'DELETE' });
      alResolver(m, `Solicitud rechazada: ${m.nombre} ${m.apellido}.`);
    } catch (err) {
      setError(err.message);
      setTrabajando(false);
      setRechazando(false);
    }
  }

  return (
    <tr>
      <td><b>{m.nombre} {m.apellido}</b><br /><span className="suave" style={{ fontSize: 13 }}>DNI {m.dni}</span></td>
      <td>{m.ap_nombre} {m.ap_apellido}<br /><span className="suave" style={{ fontSize: 13 }}>{m.ap_correo}</span></td>
      <td>{nombreNivel(m.nivel)} {m.grado}</td>
      <td>
        <select aria-label={`Sección de ${m.nombre}`} value={sec} onChange={(e) => setSec(e.target.value)} disabled={trabajando}
          style={{ minHeight: 40, borderRadius: 8, border: '1px solid #7fa6cc', padding: '0 8px', font: 'inherit' }}>
          {opciones.map((s) => (
            <option key={s.id_sec} value={s.id_sec} disabled={s.id_sec !== m.id_sec && s.disponibles <= 0}>
              {s.letra} · {Math.max(0, s.disponibles)} vacantes
            </option>
          ))}
        </select>
        {error && <p role="alert" style={{ margin: '6px 0 0', fontSize: 13 }}>{error}</p>}
      </td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        {rechazando ? (
          <>
            <span style={{ marginRight: 8, fontSize: 14 }}>¿Rechazar?</span>
            <button type="button" className="pbtn pbtn-d" disabled={trabajando} onClick={rechazar}>Sí</button>{' '}
            <button type="button" className="pbtn pbtn-d" disabled={trabajando} onClick={() => setRechazando(false)}>No</button>
          </>
        ) : (
          <>
            <button type="button" className="pbtn pbtn-p" style={{ minHeight: 36, padding: '0 14px', fontSize: 14 }} disabled={trabajando} onClick={confirmar}>
              {trabajando ? 'Guardando…' : 'Confirmar'}
            </button>{' '}
            <button type="button" className="pbtn pbtn-d" disabled={trabajando} onClick={() => setRechazando(true)}>Rechazar</button>
          </>
        )}
      </td>
    </tr>
  );
}
