export const API_URL = 'http://localhost:3000/api';

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
    throw new Error(datos.error || 'Ocurrió un error inesperado.');
  }
  return datos;
}
