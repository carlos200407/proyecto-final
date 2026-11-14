import { useEffect, useState } from 'react';
import { PanelEscritorio } from '../Estructura';
import { ENLACES_DIRECTOR } from './enlaces';

const INICIAL = [
  { nombre: 'Carla Mendoza', correo: 'secretaria@colegio.pe', rol: 'Secretario', activo: true },
  { nombre: 'Juan Ramírez', correo: 'docente1@colegio.pe', rol: 'Docente', activo: true },
  { nombre: 'Ana Torres', correo: 'docente2@colegio.pe', rol: 'Docente', activo: true },
];
const VACIO = { nombre: '', apellido: '', correo: '' };

export default function Usuarios() {
  const [lista, setLista] = useState(INICIAL);
  const [f, setF] = useState(VACIO);
  const [rol, setRol] = useState('Docente');
  const [aviso, setAviso] = useState(null); // { texto, clave }

  useEffect(() => { document.title = 'Usuarios – El Técnico 3052'; }, []);

  const crear = (e) => {
    e.preventDefault();
    // Aquí irá: POST /api/usuarios con la clave temporal y primer_ingreso = 1.
    const clave = 'Temp-' + Math.floor(1000 + Math.random() * 9000);
    setLista([...lista, { nombre: `${f.nombre.trim()} ${f.apellido.trim()}`.trim(), correo: f.correo.trim(), rol, activo: true }]);
    setF(VACIO);
    setAviso({ texto: 'Usuario creado', clave });
  };
  // Aquí irá: PUT /api/usuarios/:id/desactivar
  const alternar = (i) => setLista(lista.map((u, j) => (j === i ? { ...u, activo: !u.activo } : u)));
  const campo = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <PanelEscritorio titulo="Usuarios del personal" rol="Director" nombre="Roberto Fernández" enlaces={ENLACES_DIRECTOR}>
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
          <button type="submit" className="pbtn pbtn-p pbtn-ancho">Crear y generar clave temporal</button>
          {aviso && (
            <div className="aviso-clave" role="status">
              <p style={{ margin: 0, fontWeight: 600 }}>{aviso.texto}</p>
              <p style={{ margin: '6px 0 0' }}>Clave temporal: <b className="clave">{aviso.clave}</b></p>
              <p className="suave" style={{ margin: '6px 0 0', fontSize: 13 }}>Entrégala a la persona. Deberá cambiarla en su primer ingreso.</p>
            </div>
          )}
        </form>
        <section style={{ flex: '2 1 420px', minWidth: 0 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Personal registrado</h2>
          <div className="caja-tabla">
            <table>
              <thead><tr><th>Nombre</th><th>Rol</th><th>Estado</th><th /></tr></thead>
              <tbody>
                {lista.map((u, i) => (
                  <tr key={u.correo + i}>
                    <td><b>{u.nombre}</b><br /><span className="suave" style={{ fontSize: 13 }}>{u.correo}</span></td>
                    <td>{u.rol}</td>
                    <td><span className={`etiqueta ${u.activo ? 'etiqueta-ok' : 'etiqueta-no'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span></td>
                    <td style={{ textAlign: 'right' }}><button type="button" className="pbtn pbtn-d" onClick={() => alternar(i)}>{u.activo ? 'Desactivar' : 'Reactivar'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="suave" style={{ margin: '12px 0 0', fontSize: 13 }}>Las cuentas no se borran: se desactivan, para conservar el historial.</p>
        </section>
      </div>
    </PanelEscritorio>
  );
}
