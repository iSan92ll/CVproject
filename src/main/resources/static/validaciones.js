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

    // Verificar si hay campos con la clase 'is-invalid'
    const camposInvalidos = document.querySelectorAll('.is-invalid');
    if (camposInvalidos.length > 0) {
        mostrarNotificacion('Por favor, corrija los errores en el formulario antes de enviarlo.', 'error');
        valido = false;
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

function validarEmail(campo) {
    if (!campo) campo = document.getElementById('email');
    const valor = campo.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9-]{2,}\.[a-zA-Z]{2,}(\.com|\.co|\.gov\.co|\.gov\.com|\.org|\.edu\.co|\.net|\.info)$/i;
    if (!valor) {
        mostrarErrorCampo(campo, 'El email no puede estar vacío');
        return false;
    }
    if (!emailRegex.test(valor)) {
        mostrarErrorCampo(campo, 'El correo debe tener un formato válido.');
        return false;
    }
    campo.classList.add('is-valid');
    return true;
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
            
            // Validar nombre usando la función general
            if (!validarNombre(nombres[i])) {
                valido = false;
            }
            // Validar profesión usando la función general
            if (!validarOcupacion(profesiones[i])) {
                valido = false;
            }
            // Validar email usando la función general
            if (!validarEmail(emails[i])) {
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

// Validación de texto real usando LanguageTool API
async function validarTextoRealAPI(texto, campo, tipo = "general", errores) {
    if (!errores) errores = 4; // Número máximo de errores permitidos
    try {
        const response = await fetch("https://api.languagetoolplus.com/v2/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `text=${encodeURIComponent(texto)}&language=es`
        });
        const data = await response.json();
        if (data.matches && data.matches.length > errores) {
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
    if (!campo) campo = document.getElementById('nombre');
    const valor = campo.value.trim();
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/;
    campo.classList.remove('is-valid', 'is-invalid');
    if (!valor) {
        mostrarErrorCampo(campo, 'El nombre no puede estar vacío');
        return false;
    }
    if (!regex.test(valor)) {
        mostrarErrorCampo(campo, 'El nombre solo puede contener letras, espacios, apóstrofes y tildes');
        return false;
    }
    const palabras = valor.split(/\s+/).filter(p => p.length >= 3);
    if (palabras.length < 2) {
        mostrarErrorCampo(campo, 'El nombre debe tener al menos dos palabras de mínimo 3 letras cada una');
        return false;
    }
    if (palabras.some(p => /(.)\1\1/.test(p))) {
        mostrarErrorCampo(campo, 'Las palabras no pueden tener más de dos letras iguales seguidas');
        return false;
    }
    campo.classList.add('is-valid');
    return true;
}

// Validar ocupación
async function validarOcupacion(campo) {
    if (!campo) campo = document.getElementById('ocupacion');
    const valor = campo.value.trim();
    campo.classList.remove('is-valid', 'is-invalid');
    if (!valor) {
        mostrarErrorCampo(campo, 'La ocupación no puede estar vacía');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "ocupación", 1)) return false;
    campo.classList.add('is-valid');
    return true;
}

// Validar puesto
async function validarPuesto(puesto) {
    if (!puesto) puesto = document.getElementById('puesto');
    const valor = puesto.value.trim();
    puesto.classList.remove('is-valid', 'is-invalid');
    if (!valor) {
        mostrarErrorCampo(puesto, 'El puesto no puede estar vacío');
        return false;
    }
    if (!await validarTextoRealAPI(valor, puesto, "puesto", 1)) return false;
    puesto.classList.add('is-valid');
    return true;
}

// Validar dirección
async function validarDireccion() {
    const campo = document.getElementById('direccion');
    const valor = campo.value.trim();
    campo.classList.remove('is-valid', 'is-invalid');
    if (!valor) {
        mostrarErrorCampo(campo, 'La dirección no puede estar vacía');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "dirección")) return false;
    campo.classList.add('is-valid');
    return true;
}

// Validar objetivo profesional
async function validarObjetivo() {
    const campo = document.getElementById('objetivo');
    const valor = campo.value.trim();
    campo.classList.remove('is-valid', 'is-invalid');
    if (!valor) {
        mostrarErrorCampo(campo, 'El objetivo no puede estar vacío');
        return false;
    }
    const palabras = valor.split(' ');
    const primeraPalabra = palabras[0]?.toLowerCase() || '';
    const verbosComunes = ['tomar', 'hacer', 'desarrollar', 'implementar', 'crear', 'diseñar', 'mejorar', 'optimizar', 'coordinar', 'gestionar', 'liderar', 'colaborar', 'analizar', 'investigar', 'aprender', 'contribuir', 'participar', 'resolver', 'planificar', 'organizar', 'comunicar', 'supervisar', 'evaluar', 'motivar', 'iniciar', 'proponer', 'facilitar', 'negociar', 'capacitar', 'asesorar', 'dirigir', 'promover', 'fomentar', 'integrar', 'adaptar', 'transformar', 'innovar', 'influenciar', 'persuadir', 'sugerir', 'colaborar', 'coordinar', 'lograr', 'alcanzar', 'cumplir', 'ejecutar', 'operar', 'controlar', 'monitorear', 'supervisar', 'auditar', 'reportar', 'documentar', 'presentar', 'demostrar', 'explicar', 'ilustrar', 'formular', 'estructurar', 'priorizar', 'delegar', 'organizar', 'planificar', 'programar', 'presupuestar', 'financiar', 'invertir', 'ahorrar', 'costear', 'comprar', 'vender', 'publicitar', 'promocionar', 'mercadear', 'investigar', 'desarrollar', 'producir', 'fabricar', 'ensamblar', 'construir', 'instalar', 'mantener', 'reparar', 'solucionar', 'diagnosticar', 'evaluar', 'medir', 'analizar', 'interpretar', 'sintetizar', 'comparar', 'contrastar', 'criticar', 'reflexionar', 'crear', 'imaginar', 'idear', 'innovar', 'inventar', 'diseñar', 'escribir', 'redactar', 'editar', 'corregir', 'traducir', 'interpretar', 'enseñar', 'instruir', 'formar', 'capacitar', 'orientar', 'asesorar', 'guiar', 'apoyar', 'ayudar', 'servir', 'atender', 'escuchar', 'comprender', 'empatizar', 'respetar', 'valorar', 'incluir', 'diversificar'];
    if (!verbosComunes.some(verbo => primeraPalabra.startsWith(verbo))) {
        mostrarErrorCampo(campo, 'El objetivo debe comenzar con un verbo de acción');
        return false;
    }
    if (palabras.length < 10) {
        mostrarErrorCampo(campo, 'El objetivo debe tener al menos 10 palabras');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "objetivo")) return false;
    campo.classList.add('is-valid');
    return true;
}

// Validar "Sobre mí"
async function validarSobreMi(campo) {
    if (!campo) campo = document.getElementById('sobremi');
    const valor = campo.value.trim();
    campo.classList.remove('is-valid', 'is-invalid');
    if (!valor) {
        mostrarErrorCampo(campo, 'El campo "Sobre mí" no puede estar vacío');
        return false;
    }
    const palabras = valor.split(' ');
    if (palabras.length < 10) {
        mostrarErrorCampo(campo, 'El campo "Sobre mí" debe tener al menos 10 palabras');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "sobre mí")) return false;
    campo.classList.add('is-valid');
    return true;
}

// Validar número de identificación
function validarNumeroIdentificacion() {
    const campo = document.getElementById('numeroiden');
    const valor = campo.value.trim();
    const tipoIden = document.getElementById('tipoiden')?.value;
    campo.classList.remove('is-valid', 'is-invalid');
    if (!tipoIden) {
        mostrarErrorCampo(campo, 'Seleccione un tipo de identificación primero');
        return false;
    }
    if (!valor) {
        mostrarErrorCampo(campo, 'El número de identificación no puede estar vacío');
        return false;
    }
    if (/\D/.test(valor)) {
        mostrarErrorCampo(campo, 'El número de identificación solo puede contener dígitos numéricos');
        return false;
    }
    if (/^(\d)\1+$/.test(valor)) {
        mostrarErrorCampo(campo, 'El número de identificación no puede tener todos los dígitos iguales');
        return false;
    }
    if (tipoIden === 'Cédula de Ciudadanía' && (valor.length < 6 || valor.length > 10)) {
        mostrarErrorCampo(campo, 'La cédula de ciudadanía debe tener entre 6 y 10 dígitos');
        return false;
    }
    if (tipoIden === 'Cédula de Extranjería' && (valor.length < 6 || valor.length > 12)) {
        mostrarErrorCampo(campo, 'La cédula de extranjería debe tener entre 6 y 12 dígitos');
        return false;
    }
    campo.classList.add('is-valid');
    return true;
}

// Validar institución de estudio
async function validarInstitucionEstudio(campo) {
    const valor = typeof campo === "string" ? campo.trim() : campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'La institución no puede estar vacía');
        return false;
    }
    const institucionesEducativas = [
        'universidad', 'colegio', 'instituto', 'escuela', 'academia', 'politécnico', 'tecnológico', 'centro educativo',
        'sena', 'uniminuto', 'javeriana', 'andes', 'nacional', 'sabana', 'rosario', 'externado', 'pontificia', 'autónoma',
        'católica', 'san buenaventura', 'eafit', 'ces', 'cesa', 'del valle', 'del norte', 'del atlántico', 'del cauca',
        'del tolima', 'del magdalena', 'del quindío', 'del sur', 'del oriente', 'del occidente', 'del caribe', 'del pacífico', 'IED', 'distrital'
    ];
    if (!institucionesEducativas.some(nombre => valor.toLowerCase().includes(nombre))) {
        mostrarErrorCampo(campo, 'El nombre debe contener el nombre de una institución educativa reconocida');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "institución", 2)) return false;
    campo.classList.add('is-valid');
    return true;
}

// Validar título de estudio
async function validarTituloEstudio(campo) {
    const valor = typeof campo === "string" ? campo.trim() : campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'El título no puede estar vacío');
        return false;
    }
    const titulosAcademicos = [
        'técnico', 'tecnólogo', 'bachiller', 'profesional', 'especialista',
        'magíster', 'maestría', 'doctor', 'doctorado', 'licenciado', 'ingeniero',
        'abogado', 'contador', 'administrador', 'arquitecto', 'médico', 'enfermero',
        'psicólogo', 'químico', 'biólogo', 'físico', 'matemático', 'artista', 'diseñador'
    ];
    if (!titulosAcademicos.some(titulo => valor.toLowerCase().includes(titulo))) {
        mostrarErrorCampo(campo, 'El título debe contener el nombre de un título académico (ej: técnico, bachiller, profesional, etc.)');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "título", 2)) return false;
    campo.classList.add('is-valid');
    return true;
}

// Validar descripción de experiencia
async function validarDescripcionExperiencia(campo) {
    const valor = typeof campo === "string" ? campo.trim() : campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'La descripción no puede estar vacía');
        return false;
    }
    const palabras = valor.split(' ');
    if (palabras.length < 10) {
        mostrarErrorCampo(campo, 'La descripción debe tener al menos 10 palabras');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "descripción experiencia")) return false;
    campo.classList.add('is-valid');
    return true;
}

// Validar objetivo sin experiencia
async function validarObjetivoSinExperiencia(campo) {
    const valor = typeof campo === "string" ? campo.trim() : campo.value.trim();
    if (!valor) {
        mostrarErrorCampo(campo, 'El objetivo sin experiencia no puede estar vacío');
        return false;
    }
    const palabras = valor.split(' ');
    if (palabras.length < 15) {
        mostrarErrorCampo(campo, 'El objetivo sin experiencia debe tener al menos 15 palabras');
        return false;
    }
    if (!await validarTextoRealAPI(valor, campo, "objetivo sin experiencia")) return false;
    campo.classList.add('is-valid');
    return true;
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
    document.getElementById('nombre')?.addEventListener('blur', function() { validarNombre(this); });
    document.getElementById('direccion')?.addEventListener('blur', function() { validarDireccion(this); });
    document.getElementById('ocupacion')?.addEventListener('blur', function() { validarOcupacion(this); });
    document.getElementById('puesto')?.addEventListener('blur', function() { validarPuesto(this); });
    document.getElementById('objetivo')?.addEventListener('blur', function() { validarObjetivo(this); });
    document.getElementById('sobremi')?.addEventListener('blur', function() { validarSobreMi(this); });
    document.getElementById('numeroiden')?.addEventListener('blur', function() { validarNumeroIdentificacion(this); });

    document.querySelectorAll('.institucion-estudio').forEach(campo => {
        campo.addEventListener('blur', function() { validarInstitucionEstudio(campo); });
    });
    document.querySelectorAll('.titulo-estudio').forEach(campo => {
        campo.addEventListener('blur', function() { validarTituloEstudio(campo); });
    });

    // Referencias dinámicas usando funciones generales
    document.querySelectorAll('.referencia-nombre').forEach(campo => {
        campo.addEventListener('blur', function() { validarNombre(campo); });
    });
    document.querySelectorAll('.referencia-profesion').forEach(campo => {
        campo.addEventListener('blur', function() { validarOcupacion(campo); });
    });
    document.querySelectorAll('.referencia-email').forEach(campo => {
        campo.addEventListener('blur', function() { validarEmail(campo); });
    });

    // Experiencias dinámicas usando funciones generales
    document.querySelectorAll('.empresa').forEach(campo => {
        campo.addEventListener('blur', function() { validarNombre(campo); });
    });
    document.querySelectorAll('.cargo').forEach(campo => {
        campo.addEventListener('blur', function() { validarPuesto(campo); });
    });
    document.querySelectorAll('.descripcion').forEach(campo => {
        campo.addEventListener('blur', function() { validarDescripcionExperiencia(campo); });
    });

    document.getElementById('objetivo_sin_experiencia')?.addEventListener('blur', function() {
        validarObjetivoSinExperiencia(document.getElementById('objetivo_sin_experiencia'));
    });
});