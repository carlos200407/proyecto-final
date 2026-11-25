import { Routes, Route, Navigate } from 'react-router-dom';
import Portada from './sitio/Portada';
import CursosTecnicos from './sitio/CursosTecnicos';
import Acceso from './pages/Acceso';
import Registro from './pages/Registro';
import RutaProtegida from './panel/RutaProtegida';

import PadreMatricula from './panel/padre/Matricula';
import PadreConfirmar from './panel/padre/Confirmar';
import PadreNotas from './panel/padre/Notas';
import DocenteNotas from './panel/docente/Notas';
import DirectorUsuarios from './panel/director/Usuarios';
import DirectorDashboard from './panel/director/Dashboard';

const soloPadre = (el) => <RutaProtegida roles={['Padre']}>{el}</RutaProtegida>;
const soloDocente = (el) => <RutaProtegida roles={['Docente']}>{el}</RutaProtegida>;
const soloDirector = (el) => <RutaProtegida roles={['Director']}>{el}</RutaProtegida>;

export default function App() {
  return (
    <Routes>
      {/* Página pública del colegio */}
      <Route path="/" element={<Portada />} />
      <Route path="/cursos-tecnicos" element={<CursosTecnicos />} />

      {/* Acceso */}
      <Route path="/ingresar" element={<Acceso />} />
      <Route path="/registro" element={<Registro />} />

      {/* Padres */}
      <Route path="/padre/matricula" element={soloPadre(<PadreMatricula />)} />
      <Route path="/padre/confirmar" element={soloPadre(<PadreConfirmar />)} />
      <Route path="/padre/notas" element={soloPadre(<PadreNotas />)} />

      {/* Docente */}
      <Route path="/docente/notas" element={soloDocente(<DocenteNotas />)} />

      {/* Director */}
      <Route path="/director" element={<Navigate to="/director/dashboard" replace />} />
      <Route path="/director/usuarios" element={soloDirector(<DirectorUsuarios />)} />
      <Route path="/director/dashboard" element={soloDirector(<DirectorDashboard />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
