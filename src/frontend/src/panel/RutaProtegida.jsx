import { Navigate, useLocation } from 'react-router-dom';
import { leerSesion } from '../api';

// Solo deja pasar a quien tenga sesión y uno de los roles indicados.
// Sin sesión -> /ingresar (y al entrar vuelve a la página que quería).
// Con otro rol -> /ingresar, que lo lleva a SU panel.
export default function RutaProtegida({ roles, children }) {
  const ubicacion = useLocation();
  const sesion = leerSesion();

  if (!sesion || sesion.usuario.primer_ingreso) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />;
  }
  if (!roles.includes(sesion.usuario.rol)) {
    return <Navigate to="/ingresar" replace />;
  }
  return children;
}
