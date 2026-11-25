import { useEffect, useState } from 'react';
import { pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import { ENLACES_DIRECTOR } from './enlaces';

const GRADOS = { Primaria: 6, Secundaria: 5 };
const gradosDe = (nivel) => Array.from({ length: GRADOS[nivel] }, (_, i) => `${i + 1}°`);

export default function Cursos() {
  useEffect(() => { document.title = 'Cursos – El Técnico 3052'; }, []);
  const [nivel, setNivel] = useState('Primaria');
  const [grado, setGrado] = useState('1°');
  const [version, setVersion] = useState(0);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vivo = true;
    pedirAuth(`/director/cursos?nivel=${encodeURIComponent(nivel)}&grado=${encodeURIComponent(grado)}`)
      .then((d) => { if (vivo) { setDatos(d); setError(''); } })
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, [nivel, grado, version]);

  const recargar = () => setVersion((v) => v + 1);
  const elegirNivel = (n) => { setNivel(n); setGrado('1°'); setDatos(null); setAviso(''); };
  const elegirGrado = (g) => { setGrado(g); setDatos(null); setAviso(''); };

  async function sincronizar() {
    setError('');
    try {
      const r = await pedirAuth('/director/sincronizar', { metodo: 'POST' });
      setAviso(r.agregados === 0 ? 'Todas las secciones ya tenían sus cursos.' : `Se agregaron ${r.agregados} cursos a secciones que no los tenían.`);
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <PanelEscritorio titulo="Cursos por grado" rol="Director" enlaces={ENLACES_DIRECTOR}>
      <p className="aviso">
        Los cursos se definen <b>una vez por grado</b> y aparecen solos en <b>todas las secciones</b> de ese grado, las que ya existen y las que crees después.
        Luego asigna el docente de cada sección en <b>Asignar docentes</b>.
      </p>
      <div className="filtros">
        {Object.keys(GRADOS).map((n) => (
          <button key={n} type="button" aria-pressed={n === nivel} className={`pbtn ${n === nivel ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => elegirNivel(n)}>{n}</button>
        ))}
      </div>
      <div className="filtros">
        {gradosDe(nivel).map((g) => (
          <button key={g} type="button" aria-pressed={g === grado} className={`pbtn ${g === grado ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => elegirGrado(g)}>{g}</button>
        ))}
      </div>
      {error && <ErrorCaja texto={error} />}
      {aviso && <p role="status" className="aviso-clave" style={{ margin: '0 0 16px' }}>{aviso}</p>}
      {!datos && !error && <Cargando />}
      {datos && <Contenido datos={datos} alCambiar={recargar} />}
      <p className="suave" style={{ marginTop: 24, fontSize: 13 }}>
        ¿Hay secciones que no muestran los cursos de su grado?{' '}
        <button type="button" className="pbtn pbtn-d" onClick={sincronizar}>Sincronizar todas las secciones</button>
      </p>
    </PanelEscritorio>
  );
}

function Contenido({ datos, alCambiar }) {
  const [nombre, setNombre] = useState('');
  const [estandar, setEstandar] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crear(e) {
    e.preventDefault();
    setError(''); setAviso(''); setEnviando(true);
    try {
      const r = await pedirAuth('/director/cursos', {
        metodo: 'POST',
        cuerpo: { nivel: datos.nivel, grado: datos.grado, nombre: nombre.trim(), criterios_estandar: estandar },
      });
      setNombre('');
      setAviso(`Curso creado y agregado a ${r.secciones} ${r.secciones === 1 ? 'sección' : 'secciones'}.`);
      alCambiar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="dos-col">
      <form className="tarjeta" style={{ flex: '1 1 280px', minWidth: 0 }} onSubmit={crear}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Nuevo curso</h2>
        <p className="suave" style={{ margin: '0 0 12px' }}>{datos.nivel} · {datos.grado} ({datos.secciones_del_grado} {datos.secciones_del_grado === 1 ? 'sección' : 'secciones'})</p>
        <label className="campo"><span>Nombre del curso</span><input required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Matemática" /></label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
          <input type="checkbox" checked={estandar} onChange={(e) => setEstandar(e.target.checked)} style={{ marginTop: 4 }} />
          <span>Agregar los criterios estándar (Examen, Práctica, Tarea)</span>
        </label>
        <button type="submit" className="pbtn pbtn-p pbtn-ancho" disabled={enviando}>{enviando ? 'Creando…' : 'Crear curso'}</button>
        {error && <p role="alert" style={{ margin: '16px 0 0', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f' }}>{error}</p>}
        {aviso && <p role="status" className="aviso-clave" style={{ margin: '16px 0 0' }}>{aviso}</p>}
      </form>
      <section style={{ flex: '2 1 420px', minWidth: 0 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Cursos de {datos.nivel} {datos.grado}</h2>
        {datos.cursos.length === 0 && <p className="suave">Este grado todavía no tiene cursos. Crea el primero.</p>}
        {datos.cursos.map((c) => <Tarjeta key={c.id_cur} c={c} alCambiar={alCambiar} />)}
      </section>
    </div>
  );
}

function Tarjeta({ c, alCambiar }) {
  const [criterio, setCriterio] = useState('');
  const [error, setError] = useState('');
  const [quitando, setQuitando] = useState(false);

  async function agregar(e) {
    e.preventDefault();
    setError('');
    try {
      await pedirAuth(`/director/cursos/${c.id_cur}/criterios`, { metodo: 'POST', cuerpo: { nombre: criterio.trim() } });
      setCriterio('');
      alCambiar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function quitarCriterio(k) {
    setError('');
    try {
      await pedirAuth(`/director/criterios/${k.id_crit}`, { metodo: 'DELETE' });
      alCambiar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function quitarCurso() {
    setError('');
    try {
      await pedirAuth(`/director/cursos/${c.id_cur}`, { metodo: 'DELETE' });
      alCambiar();
    } catch (err) {
      setError(err.message);
      setQuitando(false);
    }
  }

  return (
    <div className="tarjeta" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <b style={{ fontSize: 18 }}>{c.nombre}</b><br />
          <span className="suave" style={{ fontSize: 13 }}>
            En {c.secciones} {c.secciones === 1 ? 'sección' : 'secciones'}
            {c.sin_docente > 0 && <> · <b>{c.sin_docente} sin docente</b></>}
          </span>
        </div>
        <div style={{ whiteSpace: 'nowrap' }}>
          {quitando ? (
            <>
              <span style={{ marginRight: 8, fontSize: 14 }}>¿Quitar de todas las secciones?</span>
              <button type="button" className="pbtn pbtn-d" onClick={quitarCurso}>Sí</button>{' '}
              <button type="button" className="pbtn pbtn-d" onClick={() => setQuitando(false)}>No</button>
            </>
          ) : (
            <button type="button" className="pbtn pbtn-d" onClick={() => setQuitando(true)}>Quitar curso</button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
        {c.criterios.length === 0 && <span className="suave" style={{ fontSize: 14 }}>Sin criterios: agrega al menos uno para poder registrar notas.</span>}
        {c.criterios.map((k) => (
          <span key={k.id_crit} className="etiqueta" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {k.nombre}
            <button type="button" aria-label={`Quitar criterio ${k.nombre}`} disabled={k.notas > 0} title={k.notas > 0 ? 'Ya tiene notas' : 'Quitar'}
              onClick={() => quitarCriterio(k)}
              style={{ border: 0, background: 'transparent', color: 'inherit', cursor: k.notas > 0 ? 'not-allowed' : 'pointer', opacity: k.notas > 0 ? 0.35 : 1, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <form onSubmit={agregar} style={{ display: 'flex', gap: 8 }}>
        <input aria-label={`Nuevo criterio para ${c.nombre}`} required maxLength={100} placeholder="Nuevo criterio (ej. Participación)" value={criterio} onChange={(e) => setCriterio(e.target.value)}
          style={{ flex: 1, minWidth: 0, minHeight: 40, borderRadius: 8, border: '1px solid #7fa6cc', padding: '0 12px', font: 'inherit' }} />
        <button type="submit" className="pbtn pbtn-d">Agregar</button>
      </form>
      {error && <p role="alert" style={{ margin: '8px 0 0', fontSize: 14 }}>{error}</p>}
    </div>
  );
}
