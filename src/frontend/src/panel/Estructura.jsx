import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { borrarSesion, leerSesion } from '../api';
import './panel.css';

const FLECHA = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

function useCerrarSesion() {
  const navigate = useNavigate();
  return () => {
    borrarSesion();
    navigate('/ingresar');
  };
}

// Cabecera de las pantallas de celular con botón "atrás".
export function CabMovil({ titulo, volverA, volverTxt }) {
  return (
    <header className="movil-cab">
      <Link className="volver" to={volverA}>{FLECHA}{volverTxt}</Link>
      <span className="titulo">{titulo}</span>
      <span style={{ width: 60 }} />
    </header>
  );
}

// Cabecera con logo y "Salir" para el panel de padres.
export function CabPadre() {
  const salir = useCerrarSesion();
  return (
    <header className="movil-cab">
      <div role="img" aria-label="Espacio para el logo" style={{ width: 40, height: 40, flex: 'none', border: '2px dashed #1f5fbf', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#3d5a80' }}>Logo</div>
      <span className="titulo" style={{ textAlign: 'left' }}>Mi familia</span>
      <button type="button" className="pbtn pbtn-d" onClick={salir}>Salir</button>
    </header>
  );
}

// Marco de escritorio: menú lateral + contenido (docente y director).
export function PanelEscritorio({ titulo, rol, enlaces, children }) {
  const salir = useCerrarSesion();
  const u = leerSesion()?.usuario;
  const nombre = u ? `${u.nombre} ${u.apellido}` : '';
  // En celular el menú está plegado y se abre con el botón "Menú"; en pantalla grande siempre se ve.
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="panel">
      <div className="escritorio">
        <aside className={`lateral${abierto ? ' abierto' : ''}`}>
          <div className="barra-movil">
            <div className="marca-panel"><b>El Técnico 3052</b><small>{rol}</small></div>
            <button type="button" className="menu-btn" aria-expanded={abierto} aria-controls="menu-panel" onClick={() => setAbierto(!abierto)}>
              {abierto ? 'Cerrar' : 'Menú'}
            </button>
          </div>
          <div className="menu" id="menu-panel">
            <nav aria-label="Menú del panel">
              {enlaces.map((e) => (
                <NavLink key={e.to} to={e.to} onClick={() => setAbierto(false)} className={({ isActive }) => (isActive ? 'activo' : '')}>{e.texto}</NavLink>
              ))}
            </nav>
            <button type="button" className="salir" onClick={salir} style={{ marginTop: 12 }}>Cerrar sesión</button>
          </div>
        </aside>
        <main className="contenido">
          <div className="contenido-cab"><h1>{titulo}</h1><span className="suave">{nombre}</span></div>
          {children}
        </main>
      </div>
    </div>
  );
}
