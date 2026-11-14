import { useEffect, useState } from 'react';
import { PanelEscritorio } from '../Estructura';

const CRITERIOS = ['Examen', 'Práctica', 'Tarea'];
const INICIAL = [
  ['Mateo Quispe', ['17.5', '15', '18']],
  ['Lucía Paredes', ['12', '13', '14']],
  ['Diego Salas', ['9', '10', '8']],
  ['Camila Rojas', ['19', '18', '20']],
  ['Andrés Huamán', ['11', '12', '10']],
];
const ENLACES = [{ to: '/docente/notas', texto: 'Mis notas' }];

// Media aritmética de los valores escritos (ignora celdas vacías), limitada a 0–20.
function promedio(vals) {
  const n = vals.map(parseFloat).filter((v) => !Number.isNaN(v)).map((v) => Math.min(20, Math.max(0, v)));
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0;
}

export default function Notas() {
  const [notas, setNotas] = useState(INICIAL.map((x) => x[1]));
  const [guardado, setGuardado] = useState(false);

  useEffect(() => { document.title = 'Registro de notas – El Técnico 3052'; }, []);

  const cambiar = (i, j) => (e) => {
    setNotas(notas.map((fila, a) => (a === i ? fila.map((v, b) => (b === j ? e.target.value : v)) : fila)));
    setGuardado(false);
  };
  const proms = notas.map(promedio);
  const general = proms.reduce((a, b) => a + b, 0) / proms.length;

  // Aquí irá: POST /api/notas por cada celda (id_mat, id_crit, valor).
  const guardar = () => setGuardado(true);

  return (
    <PanelEscritorio titulo="3°A · Matemática" rol="Docente" nombre="Prof. Juan Ramírez" enlaces={ENLACES}>
      <p className="suave" style={{ margin: '0 0 16px', maxWidth: '44em' }}>Escribe las notas de 0 a 20. El promedio se calcula solo (media aritmética de los criterios).</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <span className="etiqueta">Sección 3°A</span><span className="etiqueta">Curso Matemática</span><span className="etiqueta">Año 2026</span>
      </div>
      <div className="caja-tabla">
        <table>
          <thead><tr><th>Alumno</th>{CRITERIOS.map((c) => <th key={c}>{c}</th>)}<th>Promedio</th><th>Estado</th></tr></thead>
          <tbody>
            {INICIAL.map(([nombre], i) => {
              const ok = proms[i] >= 11;
              return (
                <tr key={nombre}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{nombre}</td>
                  {CRITERIOS.map((c, j) => (
                    <td key={c}><input className="nota" type="number" min="0" max="20" step="0.5" value={notas[i][j]} onChange={cambiar(i, j)} aria-label={`${c} de ${nombre}`} /></td>
                  ))}
                  <td><b style={{ fontSize: 18, color: '#1f5fbf' }}>{proms[i].toFixed(2)}</b></td>
                  <td><span className={`etiqueta ${ok ? 'etiqueta-ok' : 'etiqueta-no'}`}>{ok ? 'Aprobado' : 'En riesgo'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="fila-acciones">
        <button type="button" className="pbtn pbtn-p" onClick={guardar}>Guardar notas</button>
        {guardado && <span role="status" style={{ fontWeight: 600 }}>Notas guardadas</span>}
        <span className="suave" style={{ marginLeft: 'auto' }}>Promedio de la sección: <b style={{ color: '#1f5fbf' }}>{general.toFixed(2)}</b></span>
      </div>
    </PanelEscritorio>
  );
}
