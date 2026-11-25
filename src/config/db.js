const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Un solo pool de conexiones para todo el servidor (antes se reconectaba en cada petición).
let poolPromise = null;

function conectarDB() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config)
            .connect()
            .then((pool) => {
                console.log('✅ Conectado a SQL Server');
                pool.on('error', () => { poolPromise = null; });
                return pool;
            })
            .catch((error) => {
                poolPromise = null; // permite reintentar en la siguiente petición
                console.error('❌ Error al conectar a SQL Server:', error.message);
                throw error;
            });
    }
    return poolPromise;
}

module.exports = { sql, conectarDB };
