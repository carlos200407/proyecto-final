import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './sitio.css';

const CURSOS = ['Electricidad', 'Manualidades', 'Cosmetología', 'Diseño gráfico', 'Textilería'];

export default function CursosTecnicos() {
  useEffect(() => {
    document.title = 'Cursos técnicos – El Técnico 3052';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="sitio">
      <header className="s-cab">
        <div className="s-wrap s-cab-fila">
          <Link className="s-volver" to="/">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Inicio
          </Link>
          <span className="s-nombre s-centro">El Técnico 3052</span>
          <Link className="btn btn-p s-btn-chico" to="/ingresar">
            Ingresar
          </Link>
        </div>
      </header>

      <section className="s-hero s-hero-chico">
        <div className="s-wrap">
          <p className="s-suave s-etiqueta">Secundaria</p>
          <h1 className="s-h1">Cursos técnicos</h1>
          <p className="s-suave s-lead">
            [Presentación de la formación técnica: qué aprenden los estudiantes y para qué los prepara.]
          </p>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap">
          <div className="s-grid">
            {CURSOS.map((curso) => (
              <div className="s-card" key={curso}>
                <h3 className="s-h3">{curso}</h3>
                <p className="s-suave s-texto-card">
                  [Descripción del curso: qué se aprende, duración y requisitos.]
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="s-pie">
        <div className="s-wrap s-pie-interior">
          <p className="s-pie-aviso">[¿Dudas sobre los cursos técnicos? Datos de contacto del área.]</p>
          <Link className="btn btn-blanco" to="/">Volver al inicio</Link>
        </div>
      </footer>
    </div>
  );
}
