import { useEffect, useState } from 'react';
import { pedir, pedirAuth } from '../../api';
import { PanelEscritorio } from '../Estructura';
import { Cargando, ErrorCaja } from '../Mensaje';
import { ENLACES_DIRECTOR } from './enlaces';

const GRADOS = { Primaria: 6, Secundaria: 5 };
const gradosDe = (nivel) => Array.from({ length: GRADOS[nivel] }, (_, i) => `${i + 1}°`);

export default function Secciones() {
  useEffect(() => { document.title = 'Secciones – El Técnico 3052'; }, []);
  const [vac, setVac] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    pedir('/secciones/vacantes')
      .then((d) => vivo && setVac(d))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, []);

  return (
    <PanelEscritorio titulo="Secciones y vacantes" rol="Director" enlaces={ENLACES_DIRECTOR}>
      {!vac && !error && <Cargando />}
      {error && <ErrorCaja texto={error} />}
      {vac && <Contenido inicial={vac.secciones} anio={vac.anio} />}
    </PanelEscritorio>
  );
}

function Contenido({ inicial, anio }) {
  const [lista, setLista] = useState(inicial);
  const [nivel, setNivel] = useState('Primaria');
  const [grado, setGrado] = useState('1°');
  const [letra, setLetra] = useState('');
  const [capacidad, setCapacidad] = useState('30');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const elegirNivel = (n) => { setNivel(n); setGrado('1°'); };

  async function crear(e) {
    e.preventDefault();
    setError('');
    setAviso('');
    setEnviando(true);
    try {
      const s = await pedirAuth('/secciones', {
        metodo: 'POST',
        cuerpo: { nivel, grado, letra: letra.trim().toUpperCase(), capacidad: Number(capacidad) },
      });
      setLista([...lista, { ...s, ocupadas: 0, disponibles: s.capacidad }].sort(ordenar));
      setLetra('');
      setAviso(`Sección creada: ${nivel} ${s.grado}${s.letra}. Se le agregaron ${s.cursos_agregados} cursos del grado; asigna sus docentes en “Asignar docentes”.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function actualizada(s) {
    setLista(lista.map((x) => (x.id_sec === s.id_sec ? { ...x, capacidad: s.capacidad, disponibles: s.capacidad - x.ocupadas } : x)));
  }

  return (
    <div className="dos-col">
      <form className="tarjeta" style={{ flex: '1 1 280px', minWidth: 0 }} onSubmit={crear}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Nueva sección</h2>
        <div className="fila-doble">
          {Object.keys(GRADOS).map((n) => (
            <button key={n} type="button" aria-pressed={n === nivel} className={`pbtn ${n === nivel ? 'pbtn-p' : 'pbtn-s'}`} onClick={() => elegirNivel(n)}>{n}</button>
          ))}
        </div>
        <label className="campo"><span>Grado</span>
          <select value={grado} onChange={(e) => setGrado(e.target.value)}>
            {gradosDe(nivel).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="campo"><span>Letra de la sección</span><input required maxLength={2} value={letra} onChange={(e) => setLetra(e.target.value)} placeholder="A" /></label>
        <label className="campo"><span>Vacantes (capacidad)</span><input required type="number" min="1" max="60" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} /></label>
        <button type="submit" className="pbtn pbtn-p pbtn-ancho" disabled={enviando}>{enviando ? 'Creando…' : 'Crear sección'}</button>
        {error && <p role="alert" style={{ margin: '16px 0 0', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f' }}>{error}</p>}
        {aviso && <p role="status" className="aviso-clave" style={{ margin: '16px 0 0' }}>{aviso}</p>}
        <p className="suave" style={{ margin: '12px 0 0', fontSize: 13 }}>La sección recibe automáticamente los cursos de su grado (los defines en “Cursos”). Falta asignar sus docentes.</p>
      </form>
      <section style={{ flex: '2 1 420px', minWidth: 0 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Secciones · matrícula {anio}</h2>
        <div className="caja-tabla">
          <table className="tabla-movil">
            <thead><tr><th>Sección</th><th>Inscritos</th><th>Vacantes totales</th><th /></tr></thead>
            <tbody>
              {lista.map((s) => <Fila key={s.id_sec} s={s} alGuardar={actualizada} />)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const ordenar = (a, b) => (a.nivel === b.nivel ? a.grado.localeCompare(b.grado) || a.letra.localeCompare(b.letra) : a.nivel === 'Primaria' ? -1 : 1);

function Fila({ s, alGuardar }) {
  const [valor, setValor] = useState(String(s.capacidad));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const cambio = Number(valor) !== s.capacidad;

  async function guardar() {
    setError('');
    setGuardando(true);
    try {
      const r = await pedirAuth(`/secciones/${s.id_sec}`, { metodo: 'PATCH', cuerpo: { capacidad: Number(valor) } });
      alGuardar(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <tr>
      <td><b>{s.nivel === 'Primaria' ? 'Primaria' : 'Secundaria'} {s.grado}{s.letra}</b></td>
      <td data-label="Inscritos">{s.ocupadas}</td>
      <td data-label="Vacantes totales">
        <input className="nota" type="number" min="1" max="60" aria-label={`Vacantes de ${s.grado}${s.letra}`} value={valor} onChange={(e) => setValor(e.target.value)} />
        {error && <p role="alert" style={{ margin: '6px 0 0', fontSize: 13 }}>{error}</p>}
      </td>
      <td className="acciones" style={{ textAlign: 'right' }}>
        <button type="button" className="pbtn pbtn-d" disabled={!cambio || guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      </td>
    </tr>
  );
}
