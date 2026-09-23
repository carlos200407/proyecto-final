const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
