import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Login from './Login';
import CambiarPassword from './CambiarPassword';
import Inicio from './Inicio';

const CLAVE_SESION = 'simae_sesion';

// Panel de cada rol.
const PANEL_POR_ROL = {
  Padre: '/padre/notas',
  Docente: '/docente/notas',
  Director: '/director/dashboard',
  Secretario: '/secretaria/matriculas',
};
const BASE_POR_ROL = { Padre: '/padre', Docente: '/docente', Director: '/director', Secretario: '/secretaria' };

function leerSesion() {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION);
    return guardada ? JSON.parse(guardada) : null;
  } catch {
    return null;
  }
}

// Es el App.jsx de antes: decide qué pantalla del sistema mostrar según la sesión.
export default function Acceso() {
  const { state } = useLocation();
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

  // 3) Sesión normal: llevar a su panel
  const panel = PANEL_POR_ROL[sesion.usuario.rol];
  if (panel) {
    // Si venía de una página protegida de SU rol (ej. /padre/matricula), vuelve a ella.
    const desde = state?.desde;
    const destino = desde && desde.startsWith(BASE_POR_ROL[sesion.usuario.rol]) ? desde : panel;
    return <Navigate to={destino} replace />;
  }

  return <Inicio usuario={sesion.usuario} onSalir={cerrarSesion} />;
}
