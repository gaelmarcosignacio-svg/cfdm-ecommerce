const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario: { type: String, required: true },
    nombreCliente: { type: String, required: true },
    productos: Array,
    total: Number,
    telefono: { type: String, required: true },
    direccion: { type: String, required: true },
    estatus: { type: String, default: 'Pendiente' },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', pedidoSchema);