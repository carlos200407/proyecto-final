import { useState } from 'react';
import { pedir } from '../api';
import PanelMarca from '../componentes/PanelMarca';
import './auth.css';

export default function Login({ onLogin }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);

    try {
      const datos = await pedir('/auth/login', {
        metodo: 'POST',
        cuerpo: { correo, password },
      });
      onLogin({ token: datos.token, usuario: datos.usuario });
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
          <h1>Iniciar sesión</h1>
          <p className="auth-ayuda">Ingresa con el correo que te dio el colegio.</p>

          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error-caja" role="alert">
              {error}
            </p>
          )}

          <button className="boton-principal" type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  );
}
