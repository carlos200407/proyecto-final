import { useEffect, useState } from 'react';
import { pedir, pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import { ENLACES_SECRETARIA } from './enlaces';

export default function Matricular() {
  useEffect(() => { document.title = 'Matricular alumno – El Técnico 3052'; }, []);
  const [vac, setVac] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    pedir('/secciones/vacantes').then((d) => vivo && setVac(d)).catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, []);

  return (
    <PanelEscritorio titulo="Matricular alumno" rol="Secretaría" enlaces={ENLACES_SECRETARIA}>
      {!vac && !error && <Cargando />}
      {error && <ErrorCaja texto={error} />}
      {vac && <Formulario secciones={vac.secciones} anio={vac.anio} />}
    </PanelEscritorio>
  );
}

const VACIO = { apDni: '', apNombre: '', apApellido: '', apCorreo: '', alDni: '', alNombre: '', alApellido: '' };

function Formulario({ secciones, anio }) {
  const niveles = ['Primaria', 'Secundaria'].filter((n) => secciones.some((s) => s.nivel === n));
  const [f, setF] = useState(VACIO);
  const [nivel, setNivel] = useState(niveles[0] ?? '');
  const gradosDe = (n) => [...new Set(secciones.filter((s) => s.nivel === n).map((s) => s.grado))];
  const [grado, setGrado] = useState(gradosDe(niveles[0] ?? '')[0] ?? '');
  const [idSec, setIdSec] = useState(''); // '' = automática
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(null);
  // Las vacantes se descuentan en pantalla para que no se ofrezca una sección llena tras matricular.
  const [lista, setLista] = useState(secciones);

  const campo = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const delGrado = lista.filter((s) => s.nivel === nivel && s.grado === grado);
  const libres = delGrado.reduce((a, s) => a + Math.max(0, s.disponibles), 0);

  const elegirNivel = (n) => { setNivel(n); setGrado(gradosDe(n)[0] ?? ''); setIdSec(''); };

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const r = await pedirAuth('/secretaria/matricula-presencial', {
        metodo: 'POST',
        cuerpo: {
          apoderado: { dni: f.apDni, nombre: f.apNombre, apellido: f.apApellido, correo: f.apCorreo },
          alumno: { dni: f.alDni, nombre: f.alNombre, apellido: f.alApellido },
          nivel, grado, id_sec: idSec ? Number(idSec) : undefined,
        },
      });
      setHecho({ ...r, alumno: `${f.alNombre} ${f.alApellido}` });
      setLista(lista.map((s) => (s.nivel === nivel && s.grado === grado && s.letra === r.letra
        ? { ...s, ocupadas: s.ocupadas + 1, disponibles: s.disponibles - 1 } : s)));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function otra() {
    setHecho(null);
    setF(VACIO);
    setIdSec('');
  }

  if (niveles.length === 0) {
    return <p className="suave">Todavía no hay secciones creadas. El director debe crearlas primero.</p>;
  }

  if (hecho) {
    return (
      <div className="tarjeta" style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Matrícula registrada</h2>
        <p style={{ margin: '0 0 8px' }}><b>{hecho.alumno}</b> quedó matriculado en <b>{hecho.nivel} {hecho.grado}{hecho.letra}</b> · año {hecho.anio}.</p>
        {hecho.clave_temporal ? (
          <div className="aviso-clave" role="status">
            <p style={{ margin: 0, fontWeight: 600 }}>Cuenta nueva para el apoderado ({f.apCorreo})</p>
            <p style={{ margin: '6px 0 0' }}>Clave temporal: <b className="clave">{hecho.clave_temporal}</b></p>
            <p className="suave" style={{ margin: '6px 0 0', fontSize: 13 }}>Entrégasela ahora; no se vuelve a mostrar. Deberá cambiarla en su primer ingreso.</p>
          </div>
        ) : (
          <p className="suave" style={{ margin: '0 0 8px' }}>El apoderado ya tenía cuenta; se le agregó este alumno y usa su misma clave.</p>
        )}
        <button type="button" className="pbtn pbtn-p" style={{ marginTop: 16 }} onClick={otra}>Matricular a otro alumno</button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <p className="suave" style={{ margin: '0 0 16px' }}>Para quien llega en persona. La matrícula queda <b>activa</b> de inmediato (año {anio}). Si el apoderado ya existe (mismo DNI), se reutiliza su cuenta.</p>
      <div className="dos-col">
        <div className="tarjeta" style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Apoderado</h2>
          <label className="campo"><span>DNI</span><input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" title="8 dígitos" value={f.apDni} onChange={campo('apDni')} /></label>
          <label className="campo"><span>Nombres</span><input required value={f.apNombre} onChange={campo('apNombre')} /></label>
          <label className="campo"><span>Apellidos</span><input required value={f.apApellido} onChange={campo('apApellido')} /></label>
          <label className="campo"><span>Correo (con este ingresa)</span><input required type="email" value={f.apCorreo} onChange={campo('apCorreo')} /></label>
        </div>
        <div className="tarjeta" style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Alumno</h2>
          <label className="campo"><span>DNI</span><input required inputMode="numeric" maxLength={8} pattern="[0-9]{8}" title="8 dígitos" value={f.alDni} onChange={campo('alDni')} /></label>
          <label className="campo"><span>Nombres</span><input required value={f.alNombre} onChange={campo('alNombre')} /></label>
          <label className="campo"><span>Apellidos</span><input required value={f.alApellido} onChange={campo('alApellido')} /></label>
          <div className="fila-doble">
            {niveles.map((n) => (
              <button key={n} type="button" aria-pressed={n === nivel} className={`pbtn ${n === nivel ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => elegirNivel(n)}>{n}</button>
            ))}
          </div>
          <label className="campo"><span>Grado</span>
            <select value={grado} onChange={(e) => { setGrado(e.target.value); setIdSec(''); }}>
              {gradosDe(nivel).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="campo"><span>Sección</span>
            <select value={idSec} onChange={(e) => setIdSec(e.target.value)}>
              <option value="">Automática (primera con vacante)</option>
              {delGrado.map((s) => (
                <option key={s.id_sec} value={s.id_sec} disabled={s.disponibles <= 0}>{s.letra} · {Math.max(0, s.disponibles)} vacantes</option>
              ))}
            </select>
          </label>
          {libres === 0 && <p role="alert" style={{ margin: '0 0 12px', fontWeight: 600 }}>Ese grado no tiene vacantes.</p>}
        </div>
      </div>
      {error && <p role="alert" style={{ margin: '16px 0 0', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f', background: '#fff' }}>{error}</p>}
      <div className="fila-acciones">
        <button type="submit" className="pbtn pbtn-p" disabled={enviando || libres === 0}>{enviando ? 'Registrando…' : 'Registrar matrícula'}</button>
      </div>
    </form>
  );
}
