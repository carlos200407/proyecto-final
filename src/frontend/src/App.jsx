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
import DirectorSecciones from './panel/director/Secciones';
import SecretariaPendientes from './panel/secretaria/Pendientes';
import SecretariaSecciones from './panel/secretaria/Secciones';
import SecretariaMatricular from './panel/secretaria/Matricular';
import SecretariaDirectorio from './panel/secretaria/Directorio';
import SecretariaAvisos from './panel/secretaria/Avisos';

const soloPadre = (el) => <RutaProtegida roles={['Padre']}>{el}</RutaProtegida>;
const soloDocente = (el) => <RutaProtegida roles={['Docente']}>{el}</RutaProtegida>;
const soloSecretaria = (el) => <RutaProtegida roles={['Secretario']}>{el}</RutaProtegida>;
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

      {/* Secretaría */}
      <Route path="/secretaria" element={<Navigate to="/secretaria/matriculas" replace />} />
      <Route path="/secretaria/matriculas" element={soloSecretaria(<SecretariaPendientes />)} />
      <Route path="/secretaria/secciones" element={soloSecretaria(<SecretariaSecciones />)} />
      <Route path="/secretaria/matricular" element={soloSecretaria(<SecretariaMatricular />)} />
      <Route path="/secretaria/directorio" element={soloSecretaria(<SecretariaDirectorio />)} />
      <Route path="/secretaria/avisos" element={soloSecretaria(<SecretariaAvisos />)} />

      {/* Director */}
      <Route path="/director" element={<Navigate to="/director/dashboard" replace />} />
      <Route path="/director/usuarios" element={soloDirector(<DirectorUsuarios />)} />
      <Route path="/director/secciones" element={soloDirector(<DirectorSecciones />)} />
      <Route path="/director/dashboard" element={soloDirector(<DirectorDashboard />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
