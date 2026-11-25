// Estados de carga / error / vacío que comparten todos los paneles.
export function Cargando({ texto = 'Cargando…' }) {
  return <p className="suave" role="status" style={{ padding: 20 }}>{texto}</p>;
}

export function ErrorCaja({ texto }) {
  return (
    <p role="alert" style={{ margin: '16px 20px', padding: '12px 14px', borderRadius: 8, border: '2px solid #12315f', background: '#fff' }}>
      {texto}
    </p>
  );
}
