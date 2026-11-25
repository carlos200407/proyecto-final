const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const alumnosRoutes = require('./routes/alumnos.routes');
const matriculasRoutes = require('./routes/matriculas.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const padresRoutes = require('./routes/padres.routes');
const seccionesRoutes = require('./routes/secciones.routes');
const cursosRoutes = require('./routes/cursos.routes');
const criteriosRoutes = require('./routes/criterios.routes');
const notasRoutes = require('./routes/notas.routes');
const asistenciasRoutes = require('./routes/asistencias.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const docenteRoutes = require('./routes/docente.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const secretariaRoutes = require('./routes/secretaria.routes');
const directorRoutes = require('./routes/director.routes');

if (!process.env.JWT_SECRET) {
    console.error('❌ Falta JWT_SECRET en el archivo .env (copia .env.example como .env).');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/matriculas', matriculasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/padres', padresRoutes);
app.use('/api/secciones', seccionesRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/criterios', criteriosRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/secretaria', secretariaRoutes);
app.use('/api/director', directorRoutes);

// --- Frontend compilado (src/frontend/dist) ---
// Primero ejecuta "npm run build". Así todo funciona en un solo puerto.
const carpetaFrontend = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(carpetaFrontend));

// Cualquier ruta que no sea de la API devuelve index.html (para React Router)
app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(carpetaFrontend, 'index.html'), (err) => {
        if (err) res.status(404).send('Falta compilar el frontend: ejecuta "npm run build".');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
