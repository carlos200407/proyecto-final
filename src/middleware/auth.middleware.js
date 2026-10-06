const jwt = require('jsonwebtoken');

// Verifica que la petición traiga un token válido (usuario logueado)
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization; // formato esperado: "Bearer eyJhbGci..."

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado; // ahora cualquier controller puede usar req.usuario.id_usu y req.usuario.rol
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

// Verifica que el usuario logueado tenga uno de los roles permitidos
// Uso: router.post('/', verificarToken, verificarRol('Director'), crearAlgo)
function verificarRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
        }
        next();
    };
}

module.exports = { verificarToken, verificarRol };
