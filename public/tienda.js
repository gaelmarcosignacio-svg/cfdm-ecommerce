// ==============================================================
// LÓGICA DE LA TIENDA, CARRITO DE COMPRAS Y REGISTRO DE PEDIDOS
// ==============================================================

let productosData = []; 
let carrito = JSON.parse(localStorage.getItem('carritoCFDM')) || []; 

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarCarritoUI();
    inicializarBotonPedido(); 
});

// --- 1. CARGAR CATÁLOGO DESDE EL BACKEND ---
async function cargarProductos() {
    try {
        const respuesta = await fetch('/api/productos')
        
        if (!respuesta.ok) throw new Error('Error al obtener productos');
        
        productosData = await respuesta.json();
        renderizarProductos(productosData);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('contenedorProductos').innerHTML = 
            '<p style="color:#e74c3c; text-align:center; width:100%;">Error al cargar el catálogo. Verifica que el servidor Node.js esté encendido.</p>';
    }
}

// --- 2. RENDERIZAR TARJETAS EN MODO OSCURO PREMIUM ---
function renderizarProductos(productos) {
    const contenedor = document.getElementById('contenedorProductos');
    if (!contenedor) return;
    contenedor.innerHTML = ''; 

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; width:100%; color:#888;">No hay productos disponibles por el momento.</p>';
        return;
    }

    productos.forEach(producto => {
        let claseStock = 'product-stock';
        if (producto.stock > 0 && producto.stock <= 5) {
            claseStock += ' low';
        }

        let textoStock = producto.stock > 0 
            ? `Stock: ${producto.stock} uds` 
            : `<span style="color:#e74c3c; font-weight:bold;">Agotado</span>`;

        let btnAgregar = producto.stock > 0 
            ? `<button class="btn-primary" style="width:100%; margin-top:15px;" onclick="agregarAlCarrito('${producto._id}', '${producto.nombre}', ${producto.precio}, '${producto.imagen}')">Agregar al Carrito</button>`
            : `<button class="btn-primary" style="width:100%; margin-top:15px; background:#333; color:#666; cursor:not-allowed;" disabled>Agotado</button>`;

        // Se inyectó el bloque de la descripción debajo del h3
        const tarjetaHTML = `
            <div class="tarjeta-producto" data-categoria="${producto.categoria}" data-precio="${producto.precio}" style="background:#111; padding:20px; border-radius:8px; border: 1px solid #222; box-shadow:0 4px 15px rgba(0,0,0,0.5); display:flex; flex-direction:column; justify-content:space-between; transition: transform 0.3s, border-color 0.3s;">
                <div>
                    <img src="${producto.imagen}" alt="${producto.nombre}" style="width:100%; height:200px; object-fit:contain; border-bottom:1px solid #222; margin-bottom:20px; padding-bottom:15px;">
                    <h3 style="color:#c5a059; font-size:1.1rem; margin-top:0; margin-bottom:10px; text-transform:uppercase; letter-spacing:1px;">${producto.nombre}</h3>
                    
                    <p style="color:#aaa; font-size:0.85rem; line-height:1.4; margin-bottom:15px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis;" title="${producto.descripcion}">
                        ${producto.descripcion || 'Sin descripción disponible.'}
                    </p>

                    <p style="font-weight:bold; font-size:1.4rem; color:#fff; margin:0 0 5px 0;">$${producto.precio} MXN</p>
                    <p class="${claseStock}">${textoStock}</p>
                </div>
                ${btnAgregar}
            </div>
        `;
        contenedor.innerHTML += tarjetaHTML;
    });

    if (typeof window.filtrarVistaActual === 'function') {
        window.filtrarVistaActual();
    }
    
    document.querySelectorAll('.tarjeta-producto').forEach(t => {
        t.addEventListener('mouseenter', () => { t.style.borderColor = '#c5a059'; t.style.transform = 'translateY(-5px)'; });
        t.addEventListener('mouseleave', () => { t.style.borderColor = '#222'; t.style.transform = 'none'; });
    });
}

// --- 3. ADMINISTRACIÓN DEL CARRITO ---
window.agregarAlCarrito = function(id, nombre, precio, imagen) {
    carrito.push({ id, nombre, precio, imagen });
    guardarCarrito();
    actualizarCarritoUI();
    const sidebar = document.getElementById('sidebarCarrito');
    if (sidebar) sidebar.classList.add('active');
};

window.eliminarDelCarrito = function(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    actualizarCarritoUI();
};

function guardarCarrito() {
    localStorage.setItem('carritoCFDM', JSON.stringify(carrito));
}

function actualizarCarritoUI() {
    const contenedorItems = document.getElementById('itemsCarrito');
    const txtVacio = document.getElementById('carritoVacioTexto');
    const contador = document.getElementById('carritoContador');
    const total = document.getElementById('carritoTotal');

    if (contador) contador.textContent = carrito.length;

    if (carrito.length === 0) {
        if (contenedorItems && txtVacio) {
            contenedorItems.innerHTML = '';
            contenedorItems.appendChild(txtVacio);
            txtVacio.style.display = 'block';
        }
        if (total) total.textContent = '$0.00 MXN';
        return;
    }

    if (txtVacio) txtVacio.style.display = 'none';
    if (contenedorItems) contenedorItems.innerHTML = '';
    let sumaTotal = 0;

    carrito.forEach((item, index) => {
        sumaTotal += parseFloat(item.precio);
        if (contenedorItems) {
            contenedorItems.innerHTML += `
                <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid #333;">
                    <img src="${item.imagen}" alt="img" style="width:60px; height:60px; object-fit:contain; border-radius:5px; border:1px solid #333; background: #fff;">
                    <div style="flex-grow:1; margin-left:15px;">
                        <p style="margin:0 0 5px 0; font-weight:bold; font-size:0.95rem; color:#fff; text-transform:uppercase; letter-spacing:1px;">${item.nombre}</p>
                        <p style="margin:0; color:#c5a059; font-weight:bold;">$${item.precio} MXN</p>
                    </div>
                    <button onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:1.2rem; transition: color 0.2s;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
    });

    if (total) total.textContent = `$${sumaTotal.toFixed(2)} MXN`;
}

// --- 4. PROCESAR Y ENVIAR EL PEDIDO A MONGODB ---
function inicializarBotonPedido() {
    const btnConfirmar = document.getElementById('btnConfirmarPedido');

    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            const telInput = document.getElementById('envioTelefono').value;
            const dirInput = document.getElementById('envioDireccion').value;
            const sesion = JSON.parse(localStorage.getItem('sesionActiva'));

            if (!telInput || !dirInput) {
                alert('⚠️ Por favor, ingresa tu teléfono y dirección completa para realizar el envío.');
                return;
            }

            let totalNumerico = 0;
            carrito.forEach(item => {
                totalNumerico += parseFloat(item.precio);
            });

            const datosPedido = {
                usuario: sesion ? sesion.correo : 'Anónimo/Desconocido', 
                nombreCliente: sesion ? sesion.nombre : 'Invitado',      
                telefono: telInput,                                      
                direccion: dirInput,                                    
                productos: carrito,
                total: totalNumerico,                                    
                fecha: new Date().toISOString()                          
            };

            try {
                const respuesta = await fetch('/api/pedidos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosPedido)
                });

                if (respuesta.ok) {
                    alert('✅ ¡Tu pedido se ha registrado con éxito en la Base de Datos! Nos pondremos en contacto contigo.');
                    
                    carrito = [];
                    guardarCarrito();
                    actualizarCarritoUI();
                    
                    document.getElementById('seccionEnvio').style.display = 'none';
                    document.getElementById('btnProcederPago').style.display = 'block';
                    document.getElementById('sidebarCarrito').classList.remove('active');
                } else {
                    const err = await respuesta.json();
                    console.log('Error del servidor:', err);
                    alert('🔴 Ocurrió un error al intentar registrar el pedido.');
                }
            } catch (error) {
                console.error('Error al enviar pedido:', error);
                alert('🔴 Error de conexión. Asegúrate de que el servidor en el puerto 3000 esté corriendo.');
            }
        });
    }
}