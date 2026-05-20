const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
    categoria: { type: String, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    imagen: { type: String, required: false },
    descripcion: { type: String, required: true }
});

module.exports = mongoose.model('Producto', ProductoSchema);