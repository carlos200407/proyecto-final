const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,          // Docker no usa certificado SSL
        trustServerCertificate: true
    }
};

async function conectarDB() {
    try {
        const pool = await sql.connect(config);
        console.log('✅ Conectado a SQL Server');
        return pool;
    } catch (error) {
        console.error('❌ Error al conectar a SQL Server:', error);
        throw error;
    }
}

module.exports = { sql, conectarDB };