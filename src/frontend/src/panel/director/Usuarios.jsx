import { useEffect, useState } from 'react';
import { pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import useDatos from '../useDatos';
import { ENLACES_DIRECTOR } from './enlaces';

export default function Usuarios() {
  useEffect(() => { document.title = 'Usuarios – El Técnico 3052'; }, []);
  const carga = useDatos(() => pedirAuth('/usuarios?personal=1'));

  return (
    <PanelEscritorio titulo="Usuarios del personal" rol="Director" enlaces={ENLACES_DIRECTOR}>
      {carga.cargando && <Cargando />}
      {carga.error && <ErrorCaja texto={carga.error} />}
      {carga.datos && <Contenido inicial={carga.datos} />}
    </PanelEscritorio>
  );
}

const VACIO = { nombre: '', apellido: '', correo: '' };

function Contenido({ inicial }) {
  const [lista, setLista] = useState(inicial);
  const [f, setF] = useState(VACIO);
  const [rol, setRol] = useState('Docente');
  const [aviso, setAviso] = useState(null); // { texto, clave }
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const campo = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function crear(e) {
    e.preventDefault();
    setError('');
    setAviso(null);
    setEnviando(true);
    try {
      // Sin "password": el servidor genera la clave temporal y la devuelve una sola vez.
      const u = await pedirAuth('/usuarios', {
        metodo: 'POST',
        cuerpo: { nombre: f.nombre.trim(), apellido: f.apellido.trim(), correo: f.correo.trim(), rol },
      });
      setLista([...lista, u]);
      setF(VACIO);
      setAviso({ texto: `Usuario creado: ${u.nombre} ${u.apellido}`, clave: u.clave_temporal });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternar(u) {
    setError('');
    try {
      const r = await pedirAuth(`/usuarios/${u.id_usu}/${u.activo ? 'desactivar' : 'activar'}`, { metodo: 'PATCH' });
      setLista(lista.map((x) => (x.id_usu === u.id_usu ? { ...x, activo: r.activo } : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dos-col">
      <form className="tarjeta" style={{ flex: '1 1 300px', minWidth: 0 }} onSubmit={crear}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Crear usuario</h2>
        <label className="campo"><span>Nombres</span><input required value={f.nombre} onChange={campo('nombre')} /></label>
        <label className="campo"><span>Apellidos</span><input required value={f.apellido} onChange={campo('apellido')} /></label>
        <label className="campo"><span>Correo</span><input required type="email" value={f.correo} onChange={campo('correo')} /></label>
        <div className="fila-doble">
          {['Docente', 'Secretario'].map((n) => (
            <button key={n} type="button" aria-pressed={n === rol} className={`pbtn ${n === rol ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => setRol(n)}>{n}</button>
          ))}
        </div>
        <button type="submit" className="pbtn pbtn-p pbtn-ancho" disabled={enviando}>{enviando ? 'Creando…' : 'Crear y generar clave temporal'}</button>
        {error && <p role="alert" style={{ margin: '16px 0 0', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f' }}>{error}</p>}
        {aviso && (
          <div className="aviso-clave" role="status">
            <p style={{ margin: 0, fontWeight: 600 }}>{aviso.texto}</p>
            <p style={{ margin: '6px 0 0' }}>Clave temporal: <b className="clave">{aviso.clave}</b></p>
            <p className="suave" style={{ margin: '6px 0 0', fontSize: 13 }}>Entrégala a la persona; no se vuelve a mostrar. Deberá cambiarla en su primer ingreso.</p>
          </div>
        )}
      </form>
      <section style={{ flex: '2 1 420px', minWidth: 0 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Personal registrado</h2>
        <div className="caja-tabla">
          <table className="tabla-movil">
            <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id_usu}>
                  <td><b>{u.nombre} {u.apellido}</b><br /><span className="suave" style={{ fontSize: 13 }}>{u.correo}</span></td>
                  <td data-label="Rol">{u.rol}</td>
                  <td data-label="Estado"><span className={`etiqueta ${u.activo ? 'etiqueta-ok' : 'etiqueta-no'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span></td>
                  <td className="acciones" style={{ textAlign: 'right' }}><button type="button" className="pbtn pbtn-d" onClick={() => alternar(u)}>{u.activo ? 'Desactivar' : 'Reactivar'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="suave" style={{ margin: '12px 0 0', fontSize: 13 }}>Las cuentas no se borran: se desactivan, para conservar el historial.</p>
      </section>
    </div>
  );
}
