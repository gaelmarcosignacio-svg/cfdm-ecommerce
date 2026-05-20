const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    correo: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nombre: { type: String, required: true },
    rol: { type: String, default: 'cliente' },
    telefono: { type: String, default: '' }, 
    direccion: { type: String, default: '' },
    fotoPerfil: { type: String, default: '' } // <-- NUEVO CAMPO PARA LA FOTO
});

module.exports = mongoose.model('Usuario', usuarioSchema);