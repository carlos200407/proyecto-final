import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import './sitio.css';

const ENLACES = [
  { texto: 'Inicio', href: '#inicio' },
  { texto: 'Vacantes', href: '#vacantes' },
  { texto: 'Nosotros', href: '#nosotros' },
  { texto: 'Niveles', href: '#niveles' },
  { texto: 'Contacto', href: '#contacto' },
];

const PIE = [
  { etiqueta: 'Dirección', valor: '[Dirección del colegio]' },
  { etiqueta: 'Teléfono', valor: '[Teléfono]' },
  { etiqueta: 'Correo', valor: '[Correo institucional]' },
  { etiqueta: 'Horario de atención', valor: '[Días y horas]' },
  { etiqueta: 'Redes sociales', valor: '[Facebook, WhatsApp u otras]' },
];

export default function Portada() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    document.title = 'El Técnico 3052';
    window.scrollTo(0, 0);
  }, []);

  // Con el menú abierto, la tecla Escape lo cierra.
  useEffect(() => {
    if (!menuAbierto) return;
    function alTeclear(evento) {
      if (evento.key === 'Escape') setMenuAbierto(false);
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [menuAbierto]);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="sitio">
      <header className="s-cab">
        <div className="s-wrap s-cab-fila">
          <Logo />
          <span className="s-nombre">El Técnico 3052</span>
          <Link className="btn btn-p s-btn-chico" to="/ingresar">
            Ingresar
          </Link>
          <button
            type="button"
            className="s-hamb"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuAbierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuAbierto && (
          <>
            <button type="button" className="s-velo" onClick={cerrarMenu} aria-label="Cerrar menú" />
            <nav id="menu" className="s-menu" aria-label="Menú principal">
              {ENLACES.map((enlace) => (
                <a key={enlace.href} className="s-enlace" href={enlace.href} onClick={cerrarMenu}>
                  {enlace.texto}
                </a>
              ))}
              <div className="s-menu-pie">
                <Link className="btn btn-p s-ancho" to="/ingresar" onClick={cerrarMenu}>
                  Ingresar
                </Link>
              </div>
            </nav>
          </>
        )}
      </header>

      <section id="inicio" className="s-hero">
        <div className="s-wrap">
          <p className="s-suave s-etiqueta">Institución Educativa</p>
          <h1 className="s-h1">Bienvenidos a El Técnico 3052</h1>
          <p className="s-suave s-lead">
            [Frase de bienvenida del colegio: una o dos líneas que expliquen quiénes son y qué ofrecen.]
          </p>
          <div className="s-acciones">
            <a className="btn btn-p" href="#vacantes">Ver vacantes</a>
            <a className="btn btn-s" href="#niveles">Conocer los niveles</a>
          </div>
        </div>
      </section>

      <section id="vacantes" className="s-sec">
        <div className="s-wrap">
          <h2 className="s-h2">Vacantes [año]</h2>
          <p className="s-suave s-intro">
            [Texto breve: cómo funcionan las vacantes y hasta cuándo se puede matricular.]
          </p>
          <div className="s-grid">
            {['Primaria', 'Secundaria'].map((nivel) => (
              <div className="s-card" key={nivel}>
                <h3 className="s-h3">{nivel}</h3>
                <p className="s-cifra">[00]</p>
                <p className="s-suave s-bajo-cifra">vacantes disponibles de [00]</p>
                <Link className="btn btn-p" to="/padre/matricula">Matricular en línea</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nosotros" className="s-sec s-fondo">
        <div className="s-wrap">
          <h2 className="s-h2">Nosotros</h2>
          <p className="s-suave s-intro">
            [Presentación del colegio: historia, ubicación y a quién sirve.]
          </p>
          <div className="s-grid">
            {[
              { titulo: 'Misión', texto: '[Texto de la misión del colegio.]' },
              { titulo: 'Visión', texto: '[Texto de la visión del colegio.]' },
              { titulo: 'Valores', texto: '[Valores que se trabajan con los estudiantes.]' },
            ].map((item) => (
              <div className="s-card" key={item.titulo}>
                <h3 className="s-h3 s-h3-chico">{item.titulo}</h3>
                <p className="s-suave s-texto-card">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="niveles" className="s-sec">
        <div className="s-wrap">
          <h2 className="s-h2">Niveles</h2>
          <p className="s-suave s-intro">
            [Texto breve sobre los niveles que ofrece el colegio.]
          </p>
          <div className="s-grid">
            <div className="s-card">
              <h3 className="s-h3">Primaria</h3>
              <p className="s-suave s-datos">[Grados] · [00] aulas</p>
              <p>[Descripción del nivel: enfoque, horario y actividades.]</p>
            </div>
            <div className="s-card">
              <h3 className="s-h3">Secundaria</h3>
              <p className="s-suave s-datos">[Grados] · [00] aulas</p>
              <p>[Descripción del nivel: enfoque, horario y actividades.]</p>
              <div className="s-aviso">
                <p className="s-aviso-titulo">¿Quieres conocer los cursos técnicos?</p>
                <p className="s-aviso-texto">[Una frase sobre la formación técnica del colegio.]</p>
                <Link className="btn btn-blanco" to="/cursos-tecnicos">
                  Ver cursos técnicos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contacto" className="s-pie">
        <div className="s-wrap s-pie-interior">
          <h2 className="s-h2 s-blanco">Contacto</h2>
          <div className="s-grid s-pie-grid">
            {PIE.map((dato) => (
              <div key={dato.etiqueta}>
                <p className="s-pie-etiqueta">{dato.etiqueta}</p>
                <p>{dato.valor}</p>
              </div>
            ))}
          </div>
          <p className="s-derechos">© [Año] El Técnico 3052. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
