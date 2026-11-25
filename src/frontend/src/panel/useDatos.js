import { useEffect, useState } from 'react';

// Carga datos al montar el componente: { cargando, datos, error }.
// Para volver a cargar con otros parámetros, cambia la `key` del componente que lo usa.
export default function useDatos(cargar) {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: '' });

  useEffect(() => {
    let vivo = true;
    cargar()
      .then((datos) => vivo && setEstado({ cargando: false, datos, error: '' }))
      .catch((e) => vivo && setEstado({ cargando: false, datos: null, error: e.message }));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return estado;
}
