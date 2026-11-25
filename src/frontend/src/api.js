export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const CLAVE_SESION = 'simae_sesion';

// Función única para hablar con el backend.
// Devuelve los datos si todo sale bien, o lanza un Error con un mensaje legible.
export async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const cabeceras = { 'Content-Type': 'application/json' };
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa que el backend esté corriendo.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Ocurrió un error inesperado.');
    error.estado = respuesta.status;
    throw error;
  }
  return datos;
}

// --- Sesión guardada en el navegador (la escribe Acceso.jsx al iniciar sesión) ---
export function leerSesion() {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION);
    return guardada ? JSON.parse(guardada) : null;
  } catch {
    return null;
  }
}

export function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin almacenamiento */
  }
}

// Igual que pedir(), pero agrega solo el token de la sesión.
// Si el servidor responde 401 (token vencido), cierra la sesión y manda al login.
export async function pedirAuth(ruta, opciones = {}) {
  const sesion = leerSesion();
  try {
    return await pedir(ruta, { ...opciones, token: sesion?.token });
  } catch (error) {
    if (error.estado === 401) {
      borrarSesion();
      window.location.assign('/ingresar');
    }
    throw error;
  }
}
