// Validar formulario completo
function validarFormulario() {
    let valido = true;
    const errores = [];

    // Validar campos obligatorios
    const camposObligatorios = [
        'nombre', 'email', 'telefono', 'genero', 'fechanac', 
        'tipoiden', 'numeroiden', 'ciudad', 'direccion',
        'ocupacion', 'puesto', 'objetivo', 'sobremi'
    ];
    
    camposObligatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !campo.value.trim()) {
            mostrarErrorCampo(campo, `El campo ${id} es obligatorio`);
            valido = false;
        }
    });

    function validarTelefono(campo) {
    const iti = window.intlTelInputGlobals.getInstance(campo);
    campo.classList.remove('is-valid', 'is-invalid');
    if (!campo.value.trim()) {
        mostrarErrorCampo(campo, 'El teléfono no puede estar vacío');
        return false;
    }
    if (!iti.isValidNumber()) {
        mostrarErrorCampo(campo, 'El número no es válido para el país seleccionado.');
        return false;
    }
    const tipo = iti.getNumberType();
    if (tipo !== intlTelInputUtils.numberType.MOBILE && tipo !== intlTelInputUtils.numberType.FIXED_LINE_OR_MOBILE) {
        mostrarErrorCampo(campo, 'El número debe ser móvil o fijo válido.');
        return false;
    }
    campo.classList.add('is-valid');
    return true;
}

function obtenerTelefonoParaBackend() {
    const telefonoInput = document.getElementById('telefono');
    if (!telefonoInput) return '';
    const iti = window.intlTelInputGlobals.getInstance(telefonoInput);
    return iti.getNumber(); // Devuelve el número en formato internacional (+57...)
}

    // Validar estudios
    const sinEstudios = document.getElementById('sin-estudios').checked;
    if (!sinEstudios) {
        const estudiosValidos = validarEstudios();
        if (!estudiosValidos) {
            valido = false;
        }
    }

    // Validar experiencias u objetivo sin experiencia
    const sinExperiencia = document.getElementById('sin-experiencia').checked;
    if (sinExperiencia) {
        const objetivoSinExp = document.getElementById('objetivo_sin_experiencia');
        if (!objetivoSinExp.value.trim() || objetivoSinExp.value.split(' ').length < 15) {
            mostrarErrorCampo(objetivoSinExp, 'El objetivo sin experiencia debe tener al menos 15 palabras');
            valido = false;
        }
    } else {
        const experienciasValidas = validarExperiencias();
        if (!experienciasValidas) {
            valido = false;
        }
    }

    // Validar habilidades
    const habilidadesSelect = document.getElementById('habilidades-select');
    const habilidadesSeleccionadas = Array.from(habilidadesSelect.selectedOptions);
    if (habilidadesSeleccionadas.length === 0) {
        mostrarErrorCampo(habilidadesSelect, 'Seleccione al menos una habilidad');
        valido = false;
    }

    // Validar idiomas
    const idiomasValidos = validarIdiomas();
    if (!idiomasValidos) {
        valido = false;
    }

    // Validar referencias
    const sinReferencias = document.getElementById('sin-referencias').checked;
    if (!sinReferencias) {
        const referenciasValidas = validarReferencias();
        if (!referenciasValidas) {
            valido = false;
        }
    }

    // Mostrar todos los errores juntos
    if (errores.length > 0) {
        const mensajeError = errores.join('\n• ');
        mostrarNotificacion('Errores de validación:\n• ' + mensajeError, 'error');
    }

    return valido;
}

// Validar estudios
function validarEstudios() {
    const niveles = document.querySelectorAll('.nivel-estudio');
    const titulos = document.querySelectorAll('.titulo-estudio');
    const instituciones = document.querySelectorAll('.institucion-estudio');
    const anos = document.querySelectorAll('.ano-estudio');
    
    let estudiosValidos = 0;
    let valido = true;
    
    for (let i = 0; i < niveles.length; i++) {
        if (niveles[i].value && titulos[i].value && instituciones[i].value && anos[i].value) {
            estudiosValidos++;
            
            // Validar año
            const ano = parseInt(anos[i].value);
            if (ano < 1950 || ano > new Date().getFullYear() + 1) {
                mostrarErrorCampo(anos[i], 'El año debe estar entre 1950 y el año actual');
                valido = false;
            }
        } else if (niveles[i].value || titulos[i].value || instituciones[i].value || anos[i].value) {
            // Campo incompleto
            mostrarErrorCampo(niveles[i].parentElement, 'Complete todos los campos del estudio o elimínelo');
            valido = false;
        }
    }
    
    if (estudiosValidos === 0) {
        mostrarNotificacion('Debe agregar al menos un estudio válido', 'error');
        valido = false;
    }
    
    return valido;
}

// Validar experiencias
function validarExperiencias() {
    const empresas = document.querySelectorAll('.empresa');
    const tiempos = document.querySelectorAll('.tiempo');
    const cargos = document.querySelectorAll('.cargo');
    const descripciones = document.querySelectorAll('.descripcion');
    
    let experienciasValidas = 0;
    let valido = true;
    
    for (let i = 0; i < empresas.length; i++) {
        if (empresas[i].value && tiempos[i].value && cargos[i].value && descripciones[i].value) {
            experienciasValidas++;
            
            // Validar descripción
            const palabras = descripciones[i].value.split(' ');
            if (palabras.length < 15) {
                mostrarErrorCampo(descripciones[i], 'La descripción debe tener al menos 15 palabras');
                valido = false;
            }
            
            // Validar tiempo
            const tiempo = parseInt(tiempos[i].value);
            if (tiempo < 1 || tiempo > 600) {
                mostrarErrorCampo(tiempos[i], 'El tiempo debe ser un valor razonable (1-600 meses)');
                valido = false;
            }
        } else if (empresas[i].value || tiempos[i].value || cargos[i].value || descripciones[i].value) {
            // Campo incompleto
            mostrarErrorCampo(empresas[i].parentElement, 'Complete todos los campos de la experiencia o elimínela');
            valido = false;
        }
    }
    
    if (experienciasValidas === 0) {
        mostrarNotificacion('Debe agregar al menos una experiencia válida o marcar "No tengo experiencia"', 'error');
        valido = false;
    }
    
    return valido;
}

// Validar idiomas
function validarIdiomas() {
    const idiomas = document.querySelectorAll('.idioma');
    const niveles = document.querySelectorAll('.nivel-idioma');
    
    let idiomasValidos = 0;
    let valido = true;
    
    for (let i = 0; i < idiomas.length; i++) {
        if (idiomas[i].value && niveles[i].value) {
            idiomasValidos++;
        } else if (idiomas[i].value || niveles[i].value) {
            // Campo incompleto
            mostrarErrorCampo(idiomas[i].parentElement, 'Complete todos los campos del idioma o elimínelo');
            valido = false;
        }
    }
    
    if (idiomasValidos === 0) {
        mostrarNotificacion('Debe agregar al menos un idioma', 'error');
        valido = false;
    }
    
    return valido;
}

// Validar referencias
function validarReferencias() {
    const nombres = document.querySelectorAll('.referencia-nombre');
    const telefonos = document.querySelectorAll('.referencia-telefono');
    const profesiones = document.querySelectorAll('.referencia-profesion');
    const emails = document.querySelectorAll('.referencia-email');
    
    let referenciasValidas = 0;
    let valido = true;
    
    for (let i = 0; i < nombres.length; i++) {
        if (nombres[i].value && telefonos[i].value && profesiones[i].value && emails[i].value) {
            referenciasValidas++;
            
            // Validar email
            const emailRegex = /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(emails[i].value) || !(/\.(com|co|gov.co|gov.com|org|edu.co|net|info)$/i.test(emails[i].value))) {
                mostrarErrorCampo(emails[i], 'El correo de referencia debe tener un formato válido');
                valido = false;
            }
            
            // Validar teléfono
            if (!/^\d{7,15}$/.test(telefonos[i].value)) {
                mostrarErrorCampo(telefonos[i], 'El teléfono de referencia debe tener entre 7 y 15 dígitos');
                valido = false;
            }
        } else if (nombres[i].value || telefonos[i].value || profesiones[i].value || emails[i].value) {
            // Campo incompleto
            mostrarErrorCampo(nombres[i].parentElement, 'Complete todos los campos de la referencia o elimínela');
            valido = false;
        }
    }
    
    if (referenciasValidas === 0) {
        mostrarNotificacion('Debe agregar al menos una referencia válida o marcar "No tengo referencias"', 'error');
        valido = false;
    }
    
    return valido;
}

// Validar formulario para vista previa (menos estricto que para guardar)
function validarFormularioParaVistaPrevia() {
    const nombre = document.getElementById("nombre")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    
    return nombre && email; // Solo requerimos nombre y email para vista previa
}

function validarEntrada(inputId, lista) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('change', () => {
        const valor = input.value.trim().toLowerCase();
        if (valor && !lista.map(v => v.toLowerCase()).includes(valor)) {
            mostrarNotificacion(`Por favor selecciona un valor válido para ${inputId}.`, "error");
            input.value = "";
        }
    });
}

// Mover aquí las funciones de validación de script.js
function validarCampo(campo) {
    const valor = campo.value.trim();
    const id = campo.id;
    campo.classList.remove('is-valid', 'is-invalid');
    if (!valor) {
        mostrarErrorCampo(campo, 'Este campo es requerido');
        return false;
    }
    switch(id) {
        case 'nombre':
            return validarNombre(campo);
        case 'email':
            return validarEmail(campo);
        case 'telefono':
            return validarTelefono(campo);
        case 'objetivo':
            return validarObjetivo(campo);
        case 'sobremi':
            return validarSobreMi(campo);
        case 'numeroiden':
            return validarNumeroIdentificacion(campo);
        default:
            campo.classList.add('is-valid');
            return true;
    }
}

// Validación de texto real usando LanguageTool API
async function validarTextoRealAPI(texto, campo, tipo = "general") {
    try {
        const response = await fetch("https://api.languagetoolplus.com/v2/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `text=${encodeURIComponent(texto)}&language=es`
        });
        const data = await response.json();
        if (data.matches && data.matches.length > 5) {
            mostrarErrorCampo(campo, `El texto ingresado en ${tipo} no parece válido o contiene palabras inventadas.`);
            return false;
        }
        campo.classList.add('is-valid');
        return true;
    } catch (e) {
        mostrarErrorCampo(campo, "No se pudo validar el texto. Intente más tarde.");
        return false;
    }
}

// Validar nombre
async function validarNombre(campo) {
    const valor = campo.value.trim();
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/;
    if (!valor) {
        mostrarErrorCampo(campo, 'El nombre no puede estar vacío');
        return false;
    }
    if (!regex.test(valor)) {
        mostrarErrorCampo(campo, 'El nombre solo puede contener letras, espacios, apóstrofes y tildes');
        return false;
    }
    const palabras = valor.split(/\s+/).filter(p => p.length >= 2);
    if (palabras.length < 2) {
        mostrarErrorCampo(campo, 'El nombre debe tener al menos dos palabras de mínimo 2 letras cada una');
        return false;
    }
    if (palabras.some(p => /(.)\1\1/.test(p))) {
        mostrarErrorCampo(campo, 'Las palabras no pueden tener más de dos letras iguales seguidas');
        return false;
    }
    // Validación con API externa
    return await validarTextoRealAPI(valor, campo, "nombre");
}

// Validar ocupación
async function validarOcupacion(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'La ocupación no puede estar vacía');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "ocupación");
}

// Validar puesto
async function validarPuesto(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'El puesto no puede estar vacío');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "puesto");
}

// Validar dirección
async function validarDireccion(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'La dirección no puede estar vacía');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "dirección");
}

// Validar objetivo
async function validarObjetivo(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'El objetivo no puede estar vacío');
        return false;
    }
    const palabras = valor.split(' ');
    const primeraPalabra = palabras[0].toLowerCase();
    const verbosComunes = ['desarrollar', 'implementar', 'crear', 'diseñar', 'mejorar', 'optimizar', 'coordinar', 'gestionar', 'liderar', 'colaborar'];
    if (!verbosComunes.some(verbo => primeraPalabra.startsWith(verbo))) {
        mostrarErrorCampo(campo, 'El objetivo debe comenzar con un verbo de acción');
        return false;
    }
    if (palabras.length < 20) {
        mostrarErrorCampo(campo, 'El objetivo debe tener al menos 20 palabras');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "objetivo");
}

// Validar "Sobre mí"
async function validarSobreMi(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'El campo "Sobre mí" no puede estar vacío');
        return false;
    }
    const palabras = valor.split(' ');
    if (palabras.length < 20) {
        mostrarErrorCampo(campo, 'El campo "Sobre mí" debe tener al menos 20 palabras');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "sobre mí");
}

// Validar institución de estudio
async function validarInstitucionEstudio(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'La institución no puede estar vacía');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "institución");
}

// Validar título de estudio
async function validarTituloEstudio(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'El título no puede estar vacío');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "título");
}

// Validar descripción de experiencia
async function validarDescripcionExperiencia(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'La descripción no puede estar vacía');
        return false;
    }
    const palabras = valor.split(' ');
    if (palabras.length < 15) {
        mostrarErrorCampo(campo, 'La descripción debe tener al menos 15 palabras');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "descripción experiencia");
}

// Validar profesión de referencia
async function validarProfesionReferencia(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'La profesión no puede estar vacía');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "profesión referencia");
}

// Validar nombre de referencia
async function validarNombreReferencia(campo) {
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'El nombre de referencia no puede estar vacío');
        return false;
    }
    return await validarTextoRealAPI(valor, campo, "nombre referencia");
}

function mostrarErrorCampo(campo, mensaje) {
    campo.classList.add('is-invalid');
    campo.classList.remove('is-valid');
    let feedback = campo.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        campo.parentElement.appendChild(feedback);
    }
    feedback.textContent = mensaje;
}

// Inicializa validación en blur para todos los campos de texto libre
document.addEventListener('DOMContentLoaded', () => {
    const camposTexto = [
        'nombre', 'direccion', 'ocupacion', 'puesto', 'objetivo', 'sobremi',
        // Agrega aquí los IDs de los campos de texto libre adicionales
    ];
    camposTexto.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('blur', async () => {
                // Solo muestra el error al salir del campo
                if (typeof window[`validar${capitalize(id)}`] === 'function') {
                    await window[`validar${capitalize(id)}`](campo);
                }
            });
        }
    });
    // Validación de teléfono solo en blur
    const campoTelefono = document.getElementById('telefono');
    if (campoTelefono) {
        campoTelefono.addEventListener('blur', async () => {
            await validarTelefono(campoTelefono);
        });
    }
});

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Validar teléfono con API solo en blur
function validarTelefono(campo) {
    const iti = window.intlTelInputGlobals.getInstance(campo);
    campo.classList.remove('is-valid', 'is-invalid');
    if (!campo.value.trim()) {
        mostrarErrorCampo(campo, 'El teléfono no puede estar vacío');
        return false;
    }
    if (!iti.isValidNumber()) {
        mostrarErrorCampo(campo, 'El número no es válido para el país seleccionado.');
        return false;
    }
    campo.classList.add('is-valid');
    return true;
}

function obtenerTelefonoParaBackend() {
    const telefonoInput = document.getElementById('telefono');
    if (!telefonoInput) return '';
    const iti = window.intlTelInputGlobals.getInstance(telefonoInput);
    return iti.getNumber(); // Devuelve el número en formato internacional (+57...)
}