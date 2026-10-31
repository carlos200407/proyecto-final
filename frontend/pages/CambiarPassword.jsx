import { useState } from 'react';
import { pedir } from '../api';
import PanelMarca from '../componentes/PanelMarca';
import './auth.css';

export default function CambiarPassword({ token, onListo, onSalir }) {
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');

    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nueva !== repetida) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await pedir('/auth/cambiar-password', {
        metodo: 'PUT',
        token,
        cuerpo: { password_nueva: nueva },
      });
      onListo();
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
          <h1>Crea tu contraseña</h1>
          <p className="auth-ayuda">
            La que usaste para entrar es temporal. Elige una nueva para continuar.
          </p>

          <div className="campo">
            <label htmlFor="nueva">Nueva contraseña</label>
            <input
              id="nueva"
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="repetida">Repite la nueva contraseña</label>
            <input
              id="repetida"
              type="password"
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error-caja" role="alert">
              {error}
            </p>
          )}

          <button className="boton-principal" type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar contraseña'}
          </button>

          <button className="boton-enlace" type="button" onClick={onSalir}>
            Salir
          </button>
        </form>
      </section>
    </main>
  );
}
