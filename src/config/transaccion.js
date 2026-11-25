const { conectarDB, sql } = require('./db');

// Error con código HTTP para devolver mensajes claros desde dentro de una transacción.
class Falla extends Error {
    constructor(estado, mensaje) {
        super(mensaje);
        this.estado = estado;
    }
}

function responderError(res, error) {
    if (error instanceof Falla) return res.status(error.estado).json({ error: error.message });
    return res.status(500).json({ error: error.message });
}

// Ejecuta `trabajo(tx)` dentro de una transacción (commit si sale bien, rollback si falla).
async function enTransaccion(trabajo) {
    const pool = await conectarDB();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
        const resultado = await trabajo(tx);
        await tx.commit();
        return resultado;
    } catch (error) {
        try { await tx.rollback(); } catch { /* ya cerrada */ }
        throw error;
    }
}

module.exports = { Falla, responderError, enTransaccion };
