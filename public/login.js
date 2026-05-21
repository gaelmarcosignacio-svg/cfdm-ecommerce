
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const formTitle = document.getElementById('formTitle');

// --- Lógica visual (se queda intacta) ---
showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    formTitle.textContent = "Crea tu cuenta";
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    formTitle.textContent = "Acceso al panel";
});

// --- Lógica de INICIO DE SESIÓN con MongoDB ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailIngresado = document.getElementById('email').value;
    const passwordIngresado = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        
        const respuesta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Traducimos "email" a "correo" para que coincida con tu modelo
            body: JSON.stringify({ correo: emailIngresado, password: passwordIngresado })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            
            localStorage.setItem('sesionActiva', JSON.stringify(datos.usuario));
            window.location.href = 'tienda.html'; 
        } else {
            errorMessage.textContent = datos.mensaje || "Correo o contraseña incorrectos.";
        }
    } catch (error) {
        errorMessage.textContent = "Error de conexión con el servidor.";
        console.error('Error de red:', error);
    }
});

// --- Lógica de REGISTRO con MongoDB ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const regErrorMessage = document.getElementById('regErrorMessage');
    const regSuccessMessage = document.getElementById('regSuccessMessage');

    try {
        const respuesta = await fetch('/api/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos el rol por defecto como "cliente"
            body: JSON.stringify({ nombre: nombre, correo: email, password: password, rol: "cliente" })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            regErrorMessage.textContent = "";
            regSuccessMessage.textContent = "¡Registro exitoso! Redirigiendo...";
            registerForm.reset();
            setTimeout(() => { window.location.reload(); }, 2000);
        } else {
            regErrorMessage.textContent = datos.mensaje || "Este correo ya está registrado.";
        }
    } catch (error) {
        regErrorMessage.textContent = "Error de conexión con el servidor.";
        console.error('Error de red:', error);
    }
});