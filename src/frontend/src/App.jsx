import { Routes, Route, Navigate } from 'react-router-dom';
import Portada from './sitio/Portada';
import CursosTecnicos from './sitio/CursosTecnicos';
import Acceso from './pages/Acceso';

// Pilotos de los paneles (datos de ejemplo, sin conexión al backend todavía)
import PadreMatricula from './panel/padre/Matricula';
import PadreConfirmar from './panel/padre/Confirmar';
import PadreNotas from './panel/padre/Notas';
import DocenteNotas from './panel/docente/Notas';
import DirectorUsuarios from './panel/director/Usuarios';
import DirectorDashboard from './panel/director/Dashboard';

export default function App() {
  return (
    <Routes>
      {/* Página pública del colegio */}
      <Route path="/" element={<Portada />} />
      <Route path="/cursos-tecnicos" element={<CursosTecnicos />} />

      {/* Sistema (login) */}
      <Route path="/ingresar" element={<Acceso />} />

      {/* Padres */}
      <Route path="/padre/matricula" element={<PadreMatricula />} />
      <Route path="/padre/confirmar" element={<PadreConfirmar />} />
      <Route path="/padre/notas" element={<PadreNotas />} />

      {/* Docente */}
      <Route path="/docente/notas" element={<DocenteNotas />} />

      {/* Director */}
      <Route path="/director" element={<Navigate to="/director/dashboard" replace />} />
      <Route path="/director/usuarios" element={<DirectorUsuarios />} />
      <Route path="/director/dashboard" element={<DirectorDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
