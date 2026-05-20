const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // En la nube, el host decide el puerto

app.use(cors());
app.use(express.json());

// --- SERVIR CARPETAS ESTÁTICAS PARA LA NUBE ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public'))); // Muestra tu web frontend

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

const uri = "mongodb://gaelmarcosignacio_db_user:86dgqrjZVvm5aFwG@ac-yls9nzm-shard-00-00.fglybct.mongodb.net:27017,ac-yls9nzm-shard-00-01.fglybct.mongodb.net:27017,ac-yls9nzm-shard-00-02.fglybct.mongodb.net:27017/cfdm_db?ssl=true&replicaSet=atlas-f551w5-shard-0&authSource=admin&appName=ClusterCFDM";

mongoose.connect(uri)
    .then(() => console.log('🟢 ¡Conectado exitosamente a MongoDB Atlas!'))
    .catch(err => console.log('🔴 Error al conectar a MongoDB:', err));

const Producto = require('./models/Producto');
const Usuario = require('./models/Usuario');
const Pedido = require('./models/Pedido');

// --- RUTAS DE PRODUCTOS ---
app.get('/api/productos', async (req, res) => { res.json(await Producto.find()); });
app.post('/api/productos', upload.single('imagen'), async (req, res) => {
    const nuevo = new Producto({...req.body, imagen: req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/150"});
    await nuevo.save(); res.status(201).json({ mensaje: 'Guardado' });
});
app.put('/api/productos/:id', upload.single('imagen'), async (req, res) => {
    const datos = {...req.body};
    if (req.file) datos.imagen = `/uploads/${req.file.filename}`;
    await Producto.findByIdAndUpdate(req.params.id, datos); res.json({ mensaje: 'Actualizado' });
});
app.delete('/api/productos/:id', async (req, res) => { await Producto.findByIdAndDelete(req.params.id); res.json({ mensaje: 'Eliminado' }); });

// --- RUTAS DE PEDIDOS Y CONTROL DE INVENTARIO ---
app.post('/api/pedidos', async (req, res) => { 
    try {
        await new Pedido(req.body).save(); 

        if (req.body.productos && req.body.productos.length > 0) {
            for (let item of req.body.productos) {
                await Producto.findByIdAndUpdate(item.id, { $inc: { stock: -1 } });
            }
        }

        if (req.body.usuario && req.body.usuario.includes('@')) {
            let listaProductosHTML = '';
            req.body.productos.forEach(prod => {
                listaProductosHTML += `<li style="margin-bottom: 5px;"><strong>${prod.nombre}</strong> - $${prod.precio} MXN</li>`;
            });

            const htmlFinal = `
                <div style="font-family: Arial, sans-serif; color: #fff; background-color: #0f0f0f; max-width: 600px; margin: 0 auto; border: 1px solid #333; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #c5a059; text-align: center; text-transform: uppercase; letter-spacing: 2px;">¡Gracias por tu compra!</h2>
                    <p>Hola <strong>${req.body.nombreCliente}</strong>,</p>
                    <p>Hemos recibido tu pedido exitosamente y ya lo estamos preparando. Aquí tienes el resumen de tu compra:</p>
                    
                    <div style="background: #1a1a1a; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #333;">
                        <ul style="list-style-type: none; padding: 0; margin: 0; color: #ccc;">
                            ${listaProductosHTML}
                        </ul>
                        <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;">
                        <h3 style="text-align: right; color: #fff; margin: 0;">Total pagado: <span style="color: #c5a059;">$${req.body.total} MXN</span></h3>
                    </div>
                    
                    <p style="color: #aaa;"><strong>Dirección de envío:</strong><br>${req.body.direccion}</p>
                    <p style="color: #aaa;"><strong>Teléfono de contacto:</strong> ${req.body.telefono}</p>
                    
                    <div style="text-align: center; margin-top: 40px; font-size: 0.85em; color: #666;">
                        <p>Centro de Farmacología Deportiva Mexicana</p>
                    </div>
                </div>
            `;

            // EVADIR BLOQUEO: Envío mediante la API HTTP de Brevo (Puerto 443 HTTPS)
            fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: "CFDM - Tienda Oficial", email: "farmacologiadeportiva26@gmail.com" },
                    to: [{ email: req.body.usuario, name: req.body.nombreCliente }],
                    subject: 'Confirmación de tu pedido en CFDM 🎉',
                    htmlContent: htmlFinal
                })
            })
            .then(response => response.json())
            .then(data => console.log('🟢 Correo enviado exitosamente vía API de Brevo:', data))
            .catch(error => console.error('🔴 Error al enviar correo vía API de Brevo:', error));
        }

        res.status(201).json({ mensaje: 'Pedido registrado, stock actualizado y correo en proceso' }); 
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/pedidos', async (req, res) => {
    try { res.json(await Pedido.find().sort({ _id: -1 })); } 
    catch (error) { res.status(500).json({ mensaje: 'Error' }); }
});

// --- RUTAS DE USUARIOS ---
app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;
    const user = await Usuario.findOne({ correo: correo });
    if (!user || user.password !== password) return res.status(401).json({ mensaje: 'Error' });
    res.json({ usuario: { nombre: user.nombre, rol: user.rol, correo: user.correo, telefono: user.telefono, direccion: user.direccion, fotoPerfil: user.fotoPerfil } });
});

app.post('/api/registro', async (req, res) => {
    try { await new Usuario(req.body).save(); res.status(201).json({ mensaje: 'Registrado' }); } 
    catch (e) { res.status(400).json({ mensaje: 'Correo ya registrado' }); }
});

app.put('/api/usuarios/:correo', upload.single('fotoPerfil'), async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;
        let datosActualizados = { nombre, telefono, direccion };
        if (req.file) datosActualizados.fotoPerfil = `/uploads/${req.file.filename}`;
        const usuarioActualizado = await Usuario.findOneAndUpdate({ correo: req.params.correo }, datosActualizados, { returnDocument: 'after' });
        res.status(200).json({ mensaje: '✅ Perfil actualizado', usuario: usuarioActualizado });
    } catch (error) { res.status(500).json({ mensaje: '🔴 Error al actualizar', error }); }
});

app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));