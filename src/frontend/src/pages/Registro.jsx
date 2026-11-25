import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pedir } from '../api';
import PanelMarca from '../componentes/PanelMarca';
import './auth.css';

// Registro público de padres de familia (crea USUARIO rol Padre + PADRE).
export default function Registro() {
  const navigate = useNavigate();
  const [f, setF] = useState({ nombre: '', apellido: '', dni: '', correo: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const campo = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);
    try {
      await pedir('/auth/registro-padre', { metodo: 'POST', cuerpo: f });
      navigate('/ingresar', { replace: true });
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  }

  return (
    <main className="auth">
      <PanelMarca />
      <section className="auth-panel">
        <form className="auth-form" onSubmit={enviar}>
          <h1>Crear cuenta</h1>
          <p className="auth-ayuda">Para padres y madres de familia. Con tu cuenta podrás matricular y ver las notas de tu hijo o hija.</p>

          <div className="campo">
            <label htmlFor="nombre">Nombres</label>
            <input id="nombre" value={f.nombre} onChange={campo('nombre')} required />
          </div>
          <div className="campo">
            <label htmlFor="apellido">Apellidos</label>
            <input id="apellido" value={f.apellido} onChange={campo('apellido')} required />
          </div>
          <div className="campo">
            <label htmlFor="dni">DNI</label>
            <input id="dni" inputMode="numeric" pattern="[0-9]{8}" title="8 dígitos" value={f.dni} onChange={campo('dni')} required />
          </div>
          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" autoComplete="username" value={f.correo} onChange={campo('correo')} required />
          </div>
          <div className="campo">
            <label htmlFor="password">Contraseña (mínimo 6 caracteres)</label>
            <input id="password" type="password" minLength={6} autoComplete="new-password" value={f.password} onChange={campo('password')} required />
          </div>

          {error && <p className="error-caja" role="alert">{error}</p>}

          <button className="boton-principal" type="submit" disabled={cargando}>
            {cargando ? 'Creando…' : 'Crear cuenta'}
          </button>
          <p className="auth-ayuda" style={{ marginTop: 16 }}>
            ¿Ya tienes cuenta? <Link to="/ingresar">Iniciar sesión</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
