import { useState } from 'react';
import Login from './pages/Login';
import CambiarPassword from './pages/CambiarPassword';
import Inicio from './pages/Inicio';

const CLAVE_SESION = 'simae_sesion';

function leerSesion() {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION);
    return guardada ? JSON.parse(guardada) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [sesion, setSesion] = useState(leerSesion);

  function iniciarSesion(nuevaSesion) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);
  }

  function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
    setSesion(null);
  }

  function marcarPasswordCambiada() {
    iniciarSesion({
      ...sesion,
      usuario: { ...sesion.usuario, primer_ingreso: false },
    });
  }

  // 1) Sin sesión: pantalla de login
  if (!sesion) {
    return <Login onLogin={iniciarSesion} />;
  }

  // 2) Cuenta nueva con contraseña temporal: obligar a cambiarla
  if (sesion.usuario.primer_ingreso) {
    return (
      <CambiarPassword
        token={sesion.token}
        onListo={marcarPasswordCambiada}
        onSalir={cerrarSesion}
      />
    );
  }

  // 3) Sesión normal
  return <Inicio usuario={sesion.usuario} onSalir={cerrarSesion} />;
}
