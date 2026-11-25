import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { ENLACES_SECRETARIA, nombreNivel } from './enlaces';

export default function Directorio() {
  useEffect(() => { document.title = 'Directorio – El Técnico 3052'; }, []);
  const [q, setQ] = useState('');
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);

  async function buscar(e) {
    e.preventDefault();
    setError('');
    setBuscando(true);
    try {
      setFilas(await pedirAuth(`/secretaria/buscar?q=${encodeURIComponent(q.trim())}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  }

  const reemplazar = (id_alu, cambios) => setFilas(filas.map((x) => (x.id_alu === id_alu ? { ...x, ...cambios } : x)));
  const reemplazarApoderado = (id_pad, cambios) => setFilas(filas.map((x) => (x.id_pad === id_pad ? { ...x, ...cambios } : x)));

  return (
    <PanelEscritorio titulo="Directorio" rol="Secretaría" enlaces={ENLACES_SECRETARIA}>
      <form onSubmit={buscar} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <label className="campo" style={{ flex: '1 1 280px', margin: 0 }}>
          <span>Buscar alumno o apoderado (nombre, apellido o DNI)</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} minLength={2} required />
        </label>
        <button type="submit" className="pbtn pbtn-p" style={{ alignSelf: 'flex-end' }} disabled={buscando}>{buscando ? 'Buscando…' : 'Buscar'}</button>
      </form>
      {error && <p role="alert" style={{ margin: '0 0 16px', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f', background: '#fff' }}>{error}</p>}
      {filas && filas.length === 0 && <p className="suave">No se encontró a nadie con “{q}”.</p>}
      {filas && filas.map((f) => (
        <Ficha key={f.id_alu} f={f} alAlumno={(c) => reemplazar(f.id_alu, c)} alApoderado={(c) => reemplazarApoderado(f.id_pad, c)} />
      ))}
      {filas && filas.length === 30 && <p className="suave" style={{ fontSize: 13 }}>Se muestran los primeros 30. Afina la búsqueda si no ves a quien buscas.</p>}
    </PanelEscritorio>
  );
}

function Ficha({ f, alAlumno, alApoderado }) {
  const [editando, setEditando] = useState(false);
  return (
    <div className="tarjeta" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
        <div>
          <b style={{ fontSize: 18 }}>{f.apellido}, {f.nombre}</b> <span className="suave">· DNI {f.dni}</span>
          <p style={{ margin: '4px 0 0' }}>
            {f.estado ? (
              <>
                <span className={`etiqueta ${f.estado === 'Activa' ? 'etiqueta-ok' : ''}`}>{f.estado}</span>{' '}
                {nombreNivel(f.nivel)} {f.grado}{f.letra} · {f.anio}
              </>
            ) : <span className="suave">Sin matrícula</span>}
          </p>
          <p className="suave" style={{ margin: '6px 0 0', fontSize: 14 }}>
            Apoderado: {f.ap_nombre} {f.ap_apellido} · DNI {f.ap_dni} · {f.ap_correo}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Link className="pbtn pbtn-d" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} to="/secretaria/avisos" state={{ alumno: { id_alu: f.id_alu, nombre: f.nombre, apellido: f.apellido, dni: f.dni } }}>Enviar aviso</Link>
          <button type="button" className="pbtn pbtn-d" onClick={() => setEditando(!editando)}>{editando ? 'Cerrar' : 'Corregir datos'}</button>
        </div>
      </div>
      {editando && (
        <div className="dos-col" style={{ marginTop: 16 }}>
          <FormAlumno f={f} alGuardar={alAlumno} />
          <FormApoderado f={f} alGuardar={alApoderado} />
        </div>
      )}
    </div>
  );
}

function useGuardar(enviar, alExito) {
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [guardando, setGuardando] = useState(false);
  async function guardar(e) {
    e.preventDefault();
    setError(''); setOk(false); setGuardando(true);
    try {
      alExito(await enviar());
      setOk(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }
  return { error, ok, guardando, guardar };
}

function FormAlumno({ f, alGuardar }) {
  const [v, setV] = useState({ nombre: f.nombre, apellido: f.apellido, dni: f.dni });
  const c = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const { error, ok, guardando, guardar } = useGuardar(
    () => pedirAuth(`/secretaria/alumnos/${f.id_alu}`, { metodo: 'PATCH', cuerpo: v }),
    (r) => alGuardar({ nombre: r.nombre, apellido: r.apellido, dni: r.dni }),
  );
  return (
    <form onSubmit={guardar} style={{ flex: '1 1 260px', minWidth: 0 }}>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Alumno</h3>
      <label className="campo"><span>Nombres</span><input required value={v.nombre} onChange={c('nombre')} /></label>
      <label className="campo"><span>Apellidos</span><input required value={v.apellido} onChange={c('apellido')} /></label>
      <label className="campo"><span>DNI</span><input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" title="8 dígitos" value={v.dni} onChange={c('dni')} /></label>
      <button type="submit" className="pbtn pbtn-p" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar alumno'}</button>
      {ok && <p role="status" style={{ margin: '8px 0 0' }}>Guardado.</p>}
      {error && <p role="alert" style={{ margin: '8px 0 0' }}>{error}</p>}
    </form>
  );
}

function FormApoderado({ f, alGuardar }) {
  const [v, setV] = useState({ nombre: f.ap_nombre, apellido: f.ap_apellido, dni: f.ap_dni, correo: f.ap_correo });
  const c = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const { error, ok, guardando, guardar } = useGuardar(
    () => pedirAuth(`/secretaria/apoderados/${f.id_pad}`, { metodo: 'PATCH', cuerpo: v }),
    (r) => alGuardar({ ap_nombre: r.nombre, ap_apellido: r.apellido, ap_dni: r.dni, ap_correo: r.correo }),
  );
  return (
    <form onSubmit={guardar} style={{ flex: '1 1 260px', minWidth: 0 }}>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Apoderado</h3>
      <label className="campo"><span>Nombres</span><input required value={v.nombre} onChange={c('nombre')} /></label>
      <label className="campo"><span>Apellidos</span><input required value={v.apellido} onChange={c('apellido')} /></label>
      <label className="campo"><span>DNI</span><input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" title="8 dígitos" value={v.dni} onChange={c('dni')} /></label>
      <label className="campo"><span>Correo (con este ingresa)</span><input required type="email" value={v.correo} onChange={c('correo')} /></label>
      <button type="submit" className="pbtn pbtn-p" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar apoderado'}</button>
      {ok && <p role="status" style={{ margin: '8px 0 0' }}>Guardado.</p>}
      {error && <p role="alert" style={{ margin: '8px 0 0' }}>{error}</p>}
    </form>
  );
}
