// Variables globales
let selectedTemplate = "";
let cvDataList = [];
let listaPaises = [];
let listaCiudadesColombia = [];
let codigosTelefonicos = [];
let estudiosCount = 1;
let experienciasCount = 0;
let referenciasCount = 0;
let idiomasCount = 1;
const MAX_ESTUDIOS = 5;
const MAX_EXPERIENCIAS = 5;
const MAX_REFERENCIAS = 3;
const MAX_IDIOMAS = 5;
const API_URL = "http://localhost:8080/api/cv";
const NUMVERIFY_API_KEY = "60e3507689314a070a05c195500482ea";
let editando = false;
let cropper;

// Reemplazo de alert y confirm por alertify
function mostrarNotificacion(mensaje, tipo = 'success', tiempo = 5) {
    // Cerrar notificaciones previas para evitar superposición
    alertify.dismissAll();
    
    if (tipo === 'error') {
        alertify.error(mensaje, tiempo);
    } else if (tipo === 'warning') {
        alertify.warning(mensaje, tiempo);
    } else {
        alertify.success(mensaje, tiempo);
    }
}

function mostrarConfirmacion(mensaje, callback) {
    alertify.confirm(mensaje, function () {
        callback(true);
    }, function () {
        callback(false);
    }).set('labels', {ok:'Sí', cancel:'No'});
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarCVs();
    inicializarDireccion();
    inicializarEstudios();
    inicializarExperiencias();
    inicializarIdiomas();
    inicializarReferencias();
    cargarCodigosTelefonicos();
    inicializarSelectorPlantillas();
    inicializarEventosBotones();
    inicializarValidacionEnTiempoReal();

    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        window.intlTelInput(telefonoInput, {
            initialCountry: "co",
            preferredCountries: ["co", "us", "mx", "es", "ar", "gb", "de"],
            separateDialCode: true,
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js"
        });
    }
    
    // Cargar datos iniciales de ciudades y países
    cargarCSV('recursos/paises.csv', 'nombre')
        .then(data => {
            listaPaises = data;
            llenarDatalist('paises', listaPaises);
            validarEntrada('pais', listaPaises);
        })
        .catch(err => console.log("Error cargando países:", err));

    cargarCiudadesColombia()
        .then(data => {
            listaCiudadesColombia = data;
            llenarDatalist('ciudades-colombia', listaCiudadesColombia);
            validarEntrada('ciudad', listaCiudadesColombia);
        })
        .catch(err => console.log("Error cargando ciudades:", err));
        
    // Inicializar evento de envío del formulario
    const cvForm = document.getElementById("cvForm");
    if (cvForm) {
        cvForm.addEventListener("submit", guardarCV);
    }
    
    // Inicializar botón de cancelar
    const cancelarBtn = document.getElementById("btncancelar");
    if (cancelarBtn) {
        cancelarBtn.addEventListener("click", resetForm);
    }

    // Inicializar manejo de imagen
    inicializarManejoImagen();
});

// Cargar ciudades de Colombia desde el CSV
async function cargarCiudadesColombia() {
    try {
        const response = await fetch('recursos/ciudad.csv');
        const text = await response.text();
        const lineas = text.trim().split('\n');
        
        return lineas.map(linea => {
            const columnas = linea.split(',');
            // Asumiendo que el formato es: Ciudad,País,Departamento,Código
            if (columnas[1] === 'Colombia') {
                return columnas[0].replace(/"/g, '').trim();
            }
            return null;
        }).filter(ciudad => ciudad !== null);
    } catch (error) {
        console.error('Error al cargar ciudades de Colombia:', error);
        // Devolver algunas ciudades principales por defecto
        return [
            "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
            "Cúcuta", "Soledad", "Ibagué", "Bucaramanga", "Soacha",
            "Villavicencio", "Santa Marta", "Valledupar", "Bello", "Pereira",
            "Manizales", "Montería", "Neiva", "Pasto", "Armenia"
        ];
    }
}

// Inicializar eventos para los botones de editar y eliminar
function inicializarEventosBotones() {
    const btnEditar = document.getElementById('btn-editar');
    const btnEliminar = document.getElementById('btn-eliminar');
    
    if (btnEditar) {
        btnEditar.addEventListener('click', function() {
            const personaSelect = document.getElementById('personaSelect');
            const selectedCvId = personaSelect.value;
            if (selectedCvId) {
                editarCV(selectedCvId);
            }
        });
    }
    
    if (btnEliminar) {
        btnEliminar.addEventListener('click', function() {
            const personaSelect = document.getElementById('personaSelect');
            const selectedCvId = personaSelect.value;
            if (selectedCvId) {
                eliminarCV(selectedCvId);
            }
        });
    }
}

// Inicializar validación en tiempo real
function inicializarValidacionEnTiempoReal() {
    // Validar campos al perder el foco
    const camposValidables = document.querySelectorAll('input[required], select[required], textarea[required]');
    camposValidables.forEach(campo => {
        campo.addEventListener('blur', function() {
            validarCampo(this);
        });
    });
    
    // Validar campos con expresiones regulares específicas
    const nombre = document.getElementById('nombre');
    if (nombre) {
        nombre.addEventListener('blur', function() {
            validarNombre(this);
        });
    }
    
    const email = document.getElementById('email');
    if (email) {
        email.addEventListener('blur', function() {
            validarEmail(this);
        });
    }
    
    const telefono = document.getElementById('telefono');
    if (telefono) {
        telefono.addEventListener('blur', function() {
            validarTelefono(this);
        });
    }
    
    const objetivo = document.getElementById('objetivo');
    if (objetivo) {
        objetivo.addEventListener('blur', function() {
            validarObjetivo(this);
        });
    }
    
    const sobremi = document.getElementById('sobremi');
    if (sobremi) {
        sobremi.addEventListener('blur', function() {
            validarSobreMi(this);
        });
    }
}

// Función para validar un campo individual
function validarCampo(campo) {
    const valor = campo.value.trim();
    const id = campo.id;
    
    // Remover estado de validación previo
    campo.classList.remove('is-valid', 'is-invalid');
    
    // Validar según el tipo de campo
    if (!valor) {
        mostrarErrorCampo(campo, 'Este campo es requerido');
        return false;
    }
    
    // Validaciones específicas por campo
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
            // Para otros campos, solo verificar que no estén vacíos
            campo.classList.add('is-valid');
            return true;
    }
}

// Validar nombre
function validarNombre(campo) {
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
    
    campo.classList.add('is-valid');
    return true;
}

// Validar email
function validarEmail(campo) {
    const valor = campo.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!valor) {
        mostrarErrorCampo(campo, 'El email no puede estar vacío');
        return false;
    }
    
    if (!emailRegex.test(valor) || !(/\.(com|co|gov.co|gov.com|org|edu.co|net|info)$/i.test(valor))) {
        mostrarErrorCampo(campo, 'El correo debe tener un formato válido y terminar en .com, .co, .org, .net o .info');
        return false;
    }
    
    campo.classList.add('is-valid');
    return true;
}

// Validar teléfono
function validarTelefono(campo) {
    const valor = campo.value.trim();
    const codigoPais = document.getElementById('codigoPais').value;
    
    if (!valor) {
        mostrarErrorCampo(campo, 'El teléfono no puede estar vacío');
        return false;
    }
    
    if (!codigoPais) {
        mostrarErrorCampo(campo, 'Por favor, selecciona un código de país');
        return false;
    }
    
    if (!/^\d{7,15}$/.test(valor)) {
        mostrarErrorCampo(campo, 'El número de teléfono debe tener entre 7 y 15 dígitos');
        return false;
    }
    
    // Validar con API de NumVerify (solo si tenemos API key)
    if (NUMVERIFY_API_KEY && NUMVERIFY_API_KEY !== 'TU_API_KEY_AQUI') {
        validarTelefonoConAPI(codigoPais + valor, campo);
    } else {
        campo.classList.add('is-valid');
    }
    
    return true;
}

// Validar teléfono con API de NumVerify
async function validarTelefonoConAPI(numeroCompleto, campo) {
    try {
        const response = await fetch(`http://apilayer.net/api/validate?access_key=${NUMVERIFY_API_KEY}&number=${numeroCompleto}`);
        const data = await response.json();
        
        if (data.valid) {
            campo.classList.add('is-valid');
        } else {
            mostrarErrorCampo(campo, 'Número de teléfono no válido');
        }
    } catch (error) {
        console.error('Error al validar teléfono:', error);
        // Si falla la API, al menos validar formato básico
        campo.classList.add('is-valid');
    }
}

// Validar objetivo
function validarObjetivo(campo) {
    const valor = campo.value.trim();
    
    if (!valor) {
        mostrarErrorCampo(campo, 'El objetivo no puede estar vacío');
        return false;
    }
    
    // Verificar que empiece con verbo
    const palabras = valor.split(' ');
    const primeraPalabra = palabras[0].toLowerCase();
    const verbosComunes = ['desarrollar', 'implementar', 'crear', 'diseñar', 'mejorar', 'optimizar', 'coordinar', 'gestionar', 'liderar', 'colaborar'];
    
    if (!verbosComunes.some(verbo => primeraPalabra.startsWith(verbo))) {
        mostrarErrorCampo(campo, 'El objetivo debe comenzar con un verbo de acción (ej: desarrollar, implementar, crear)');
        return false;
    }
    
    // Verificar mínimo de palabras
    if (palabras.length < 20) {
        mostrarErrorCampo(campo, 'El objetivo debe tener al menos 20 palabras');
        return false;
    }
    
    // Validar con API de texto (simulada por ahora)
    validarTextoConAPI(valor, campo, 'objetivo');
    
    return true;
}

// Validar "Sobre mí"
function validarSobreMi(campo) {
    const valor = campo.value.trim();
    
    if (!valor) {
        mostrarErrorCampo(campo, 'El campo "Sobre mí" no puede estar vacío');
        return false;
    }
    
    // Verificar mínimo de palabras
    const palabras = valor.split(' ');
    if (palabras.length < 20) {
        mostrarErrorCampo(campo, 'El campo "Sobre mí" debe tener al menos 20 palabras');
        return false;
    }
    
    // Validar con API de texto (simulada por ahora)
    validarTextoConAPI(valor, campo, 'sobremi');
    
    return true;
}

// Validar número de identificación
function validarNumeroIdentificacion(campo) {
    const valor = campo.value.trim();
    const tipoIden = document.getElementById('tipoiden').value;
    
    if (!valor) {
        mostrarErrorCampo(campo, 'El número de identificación no puede estar vacío');
        return false;
    }
    
    if (!/^\d{6,12}$/.test(valor)) {
        mostrarErrorCampo(campo, 'El número de identificación debe contener entre 6 y 12 dígitos');
        return false;
    }
    
    // Validaciones específicas según tipo de documento
    if (tipoIden === 'Cédula de Ciudadanía' && valor.length !== 10) {
        mostrarErrorCampo(campo, 'La cédula de ciudadanía debe tener 10 dígitos');
        return false;
    }
    
    campo.classList.add('is-valid');
    return true;
}

// Validar texto con API (simulada)
async function validarTextoConAPI(texto, campo, tipo) {
    try {
        // Simular validación con API
        // En un caso real, aquí haríamos una llamada a una API de validación de texto
        const tieneSentido = !/(.)\1{4,}/.test(texto); // Verificar que no tenga muchas letras repetidas
        
        if (tieneSentido) {
            campo.classList.add('is-valid');
        } else {
            mostrarErrorCampo(campo, 'El texto parece contener caracteres aleatorios sin sentido');
        }
    } catch (error) {
        console.error('Error al validar texto:', error);
        campo.classList.add('is-valid');
    }
}

// Mostrar error en un campo
function mostrarErrorCampo(campo, mensaje) {
    campo.classList.add('is-invalid');
    
    // Mostrar notificación inmediata
    mostrarNotificacion(mensaje, 'error', 3);
    
    // Enfocar el campo con error
    campo.focus();
}

// Inicializar selector de plantillas
function inicializarSelectorPlantillas() {
    // Event listeners para las opciones de plantillas
    document.querySelectorAll('.option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedTemplate = opt.dataset.template;
        });
    });

    // Event listener para el botón de vista previa
    const btnEjemplar = document.getElementById('btn-ejemplar');
    if (btnEjemplar) {
        btnEjemplar.addEventListener('click', mostrarVistaPrevia);
    }
    
    // Event listeners para el modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.onclick = function () {
            document.getElementById('modal').style.display = "none";
        };
    }
    
    window.onclick = function (event) {
        const modal = document.getElementById('modal');
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

// Inicializar manejo de imagen (solo SVG)
function inicializarManejoImagen() {
    const inputFoto = document.getElementById('foto');
    const preview = document.querySelector('.foto-preview');
    
    if (inputFoto && preview) {
        inputFoto.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                // Validar tipo y tamaño de archivo (solo SVG)
                if (file.type !== 'image/svg+xml') {
                    mostrarNotificacion('Formato de archivo no permitido. Solo se aceptan archivos SVG.', 'error');
                    this.value = '';
                    return;
                }
                
                const tamañoMaximo = 2 * 1024 * 1024; // 2MB
                if (file.size > tamañoMaximo) {
                    mostrarNotificacion('El archivo es demasiado grande. Máximo 2MB.', 'error');
                    this.value = '';
                    return;
                }
                
                // Leer y mostrar el SVG
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    // Guardar el SVG para enviar al backend
                    preview.dataset.originalSvg = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Inicializar experiencias laborales
function inicializarExperiencias() {
    const addExperienciaBtn = document.getElementById('add-experiencia-btn');
    const sinExperienciaCheck = document.getElementById('sin-experiencia');
    const objetivoSinExp = document.getElementById('objetivo-sin-experiencia');
    
    if (addExperienciaBtn) {
        addExperienciaBtn.addEventListener('click', agregarExperiencia);
    }
    
    if (sinExperienciaCheck && objetivoSinExp) {
        sinExperienciaCheck.addEventListener('change', function() {
            if (this.checked) {
                objetivoSinExp.style.display = 'block';
                document.getElementById('experiencias-container').style.display = 'none';
                addExperienciaBtn.style.display = 'none';
            } else {
                objetivoSinExp.style.display = 'none';
                document.getElementById('experiencias-container').style.display = 'block';
                addExperienciaBtn.style.display = 'block';
            }
        });
    }
    
    // Agregar primera experiencia
    agregarExperiencia();
}

// Agregar campo de experiencia
function agregarExperiencia() {
    if (experienciasCount >= MAX_EXPERIENCIAS) {
        mostrarNotificacion(`Solo se permiten un máximo de ${MAX_EXPERIENCIAS} experiencias.`, 'error');
        return;
    }
    
    const container = document.getElementById('experiencias-container');
    if (!container) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'experiencia-item row g-2 mb-3 p-3 border rounded';
    newItem.innerHTML = `
        <div class="col-md-4">
            <label class="form-label">Empresa</label>
            <input type="text" class="form-control empresa" name="empresa[]" placeholder="Nombre de la empresa" required>
        </div>
        <div class="col-md-3">
            <label class="form-label">Tiempo (meses)</label>
            <input type="number" class="form-control tiempo" name="tiempo[]" placeholder="Ej: 12" min="1" required>
        </div>
        <div class="col-md-3">
            <label class="form-label">Cargo</label>
            <input type="text" class="form-control cargo" name="cargo[]" placeholder="Cargo ocupado" required>
        </div>
        <div class="col-md-2">
            <label class="form-label">&nbsp;</label>
            <button type="button" class="btn btn-danger btn-sm remove-experiencia w-100"><i class="bi bi-trash"></i></button>
        </div>
        <div class="col-12">
            <label class="form-label">Descripción</label>
            <textarea class="form-control descripcion" name="descripcion[]" rows="3" placeholder="Describa sus responsabilidades y logros (mínimo 15 palabras)..." required></textarea>
        </div>
    `;
    
    container.appendChild(newItem);
    experienciasCount++;
    
    // Agregar evento al botón de eliminar
    const removeBtn = newItem.querySelector('.remove-experiencia');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            newItem.remove();
            experienciasCount--;
        });
    }
    
    // Validación en tiempo real para la descripción
    const descripcion = newItem.querySelector('.descripcion');
    if (descripcion) {
        descripcion.addEventListener('blur', function() {
            validarDescripcionExperiencia(this);
        });
    }
}

// Validar descripción de experiencia
function validarDescripcionExperiencia(campo) {
    const valor = campo.value.trim();
    
    if (!valor) {
        mostrarErrorCampo(campo, 'La descripción no puede estar vacía');
        return false;
    }
    
    // Verificar mínimo de palabras
    const palabras = valor.split(' ');
    if (palabras.length < 15) {
        mostrarErrorCampo(campo, 'La descripción debe tener al menos 15 palabras');
        return false;
    }
    
    // Validar con API de texto
    validarTextoConAPI(valor, campo, 'experiencia');
    
    return true;
}

// Inicializar idiomas
function inicializarIdiomas() {
    const addIdiomaBtn = document.getElementById('add-idioma-btn');
    
    if (addIdiomaBtn) {
        addIdiomaBtn.addEventListener('click', agregarIdioma);
    }
}

// Agregar campo de idioma
function agregarIdioma() {
    if (idiomasCount >= MAX_IDIOMAS) {
        mostrarNotificacion(`Solo se permiten un máximo de ${MAX_IDIOMAS} idiomas.`, 'error');
        return;
    }
    
    const container = document.getElementById('idiomas-container');
    if (!container) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'idioma-item row g-2 mb-2';
    newItem.innerHTML = `
        <div class="col-md-5">
            <select class="form-select idioma" name="idioma[]">
                <option value="" disabled selected>Seleccione idioma</option>
                <option value="Español">Español</option>
                <option value="Inglés">Inglés</option>
                <option value="Francés">Francés</option>
                <option value="Alemán">Alemán</option>
                <option value="Italiano">Italiano</option>
                <option value="Portugués">Portugués</option>
                <option value="Chino">Chino</option>
                <option value="Japonés">Japonés</option>
                <option value="Ruso">Ruso</option>
                <option value="Árabe">Árabe</option>
            </select>
        </div>
        <div class="col-md-5">
            <select class="form-select nivel-idioma" name="nivelIdioma[]">
                <option value="" disabled selected>Nivel</option>
                <option value="Básico">Básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
                <option value="Nativo">Nativo</option>
            </select>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger btn-sm remove-idioma"><i class="bi bi-dash"></i></button>
        </div>
    `;
    
    container.appendChild(newItem);
    idiomasCount++;
    
    // Agregar evento al botón de eliminar
    const removeBtn = newItem.querySelector('.remove-idioma');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            newItem.remove();
            idiomasCount--;
        });
    }
}

// Inicializar referencias
function inicializarReferencias() {
    const addReferenciaBtn = document.getElementById('add-referencia-btn');
    const sinReferenciasCheck = document.getElementById('sin-referencias');
    
    if (addReferenciaBtn) {
        addReferenciaBtn.addEventListener('click', agregarReferencia);
    }
    
    if (sinReferenciasCheck) {
        sinReferenciasCheck.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('referencias-container').style.display = 'none';
                addReferenciaBtn.style.display = 'none';
            } else {
                document.getElementById('referencias-container').style.display = 'block';
                addReferenciaBtn.style.display = 'block';
            }
        });
    }
    
    // Agregar primera referencia
    agregarReferencia();
}

// Agregar campo de referencia
function agregarReferencia() {
    if (referenciasCount >= MAX_REFERENCIAS) {
        mostrarNotificacion(`Solo se permiten un máximo de ${MAX_REFERENCIAS} referencias.`, 'error');
        return;
    }
    
    const container = document.getElementById('referencias-container');
    if (!container) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'referencia-item row g-2 mb-3 p-3 border rounded';
    newItem.innerHTML = `
        <div class="col-md-4">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control referencia-nombre" name="referenciaNombre[]" placeholder="Nombre completo" required>
        </div>
        <div class="col-md-4">
            <label class="form-label">Teléfono</label>
            <input type="text" class="form-control referencia-telefono" name="referenciaTelefono[]" placeholder="Teléfono de contacto" required>
        </div>
        <div class="col-md-4">
            <label class="form-label">Profesión</label>
            <input type="text" class="form-control referencia-profesion" name="referenciaProfesion[]" placeholder="Profesión u ocupación" required>
        </div>
        <div class="col-md-6">
            <label class="form-label">Email</label>
            <input type="email" class="form-control referencia-email" name="referenciaEmail[]" placeholder="Email de contacto" required>
        </div>
        <div class="col-md-6">
            <label class="form-label">&nbsp;</label>
            <button type="button" class="btn btn-danger btn-sm remove-referencia w-100"><i class="bi bi-trash"></i></button>
        </div>
    `;
    
    container.appendChild(newItem);
    referenciasCount++;
    
    // Agregar evento al botón de eliminar
    const removeBtn = newItem.querySelector('.remove-referencia');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            newItem.remove();
            referenciasCount--;
        });
    }
}

// Mostrar vista previa del CV seleccionado
function mostrarVistaPrevia() {
    if (!selectedTemplate) {
        mostrarNotificacion("Por favor selecciona un formato de CV primero.", "error");
        return;
    }

    // Si hay un CV seleccionado en el dropdown, usar esos datos
    const personaSelect = document.getElementById('personaSelect');
    const selectedCvId = personaSelect.value;
    
    if (selectedCvId) {
        // Buscar el CV seleccionado
        const selectedCv = cvDataList.find(cv => cv.id == selectedCvId);
        if (selectedCv) {
            // Cargar la plantilla con los datos del CV seleccionado
            cargarPlantillaConDatos(selectedTemplate, selectedCv);
        }
    } else if (validarFormularioParaVistaPrevia()) {
        // Si no hay CV seleccionado pero el formulario está completo, usar datos del formulario
        const formData = obtenerDatosFormulario();
        cargarPlantillaConDatos(selectedTemplate, formData);
    } else {
        mostrarNotificacion("Complete el formulario o seleccione un CV existente para ver la vista previa.", "error");
    }
}

// Obtener datos del formulario para la vista previa
function obtenerDatosFormulario() {
    // Obtener estudios
    const estudios = obtenerEstudios();
    
    // Obtener experiencias
    const experiencias = obtenerExperiencias();
    
    // Obtener idiomas
    const idiomas = obtenerIdiomas();
    
    // Obtener referencias
    const referencias = obtenerReferencias();
    
    // Obtener habilidades seleccionadas
    const habilidadesSelect = document.getElementById('habilidades-select');
    const habilidades = Array.from(habilidadesSelect.selectedOptions).map(opt => opt.value).join(', ');
    
    return {
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        telefono: document.getElementById("codigoPais").value + document.getElementById("telefono").value,
        tipoiden: document.getElementById("tipoiden").value,
        numeroiden: document.getElementById("numeroiden").value,
        fechanac: document.getElementById("fechanac").value,
        genero: document.getElementById("genero").value,
        estadocivil: document.getElementById("estadocivil").value,
        ciudad: document.getElementById("ciudad").value,
        direccion: document.getElementById("direccion").value,
        ocupacion: document.getElementById("ocupacion").value,
        puesto: document.getElementById("puesto").value,
        nacionalidad: document.getElementById("pais").value,
        objetivo: document.getElementById("objetivo").value,
        perfil: document.getElementById("sobremi").value,
        foto: foto,
        referencias: referencias,
        habilidades: {
            habilidad: habilidades,
            esducacion: estudios,
            experiencia: experiencias,
            idiomas: idiomas,
        }
    };
}

// Obtener estudios en formato para base de datos
function obtenerEstudios() {
    const niveles = document.querySelectorAll('.nivel-estudio');
    const titulos = document.querySelectorAll('.titulo-estudio');
    const instituciones = document.querySelectorAll('.institucion-estudio');
    const anos = document.querySelectorAll('.ano-estudio');
    let estudios = [];
    
    for (let i = 0; i < niveles.length; i++) {
        if (niveles[i].value && titulos[i].value && instituciones[i].value && anos[i].value) {
            estudios.push(`${niveles[i].value},${titulos[i].value},${instituciones[i].value},${anos[i].value}`);
        }
    }
    
    return estudios.join('.');
}

// Obtener experiencias en formato para base de datos
function obtenerExperiencias() {
    const empresas = document.querySelectorAll('.empresa');
    const tiempos = document.querySelectorAll('.tiempo');
    const cargos = document.querySelectorAll('.cargo');
    const descripciones = document.querySelectorAll('.descripcion');
    let experiencias = [];
    
    for (let i = 0; i < empresas.length; i++) {
        if (empresas[i].value && tiempos[i].value && cargos[i].value && descripciones[i].value) {
            experiencias.push(`${empresas[i].value},${tiempos[i].value},${cargos[i].value},${descripciones[i].value}`);
        }
    }
    
    return experiencias.join('.');
}

// Obtener idiomas en formato para base de datos
function obtenerIdiomas() {
    const idiomas = document.querySelectorAll('.idioma');
    const niveles = document.querySelectorAll('.nivel-idioma');
    let idiomasData = [];
    
    for (let i = 0; i < idiomas.length; i++) {
        if (idiomas[i].value && niveles[i].value) {
            idiomasData.push(`${idiomas[i].value},${niveles[i].value}`);
        }
    }
    
    return idiomasData.join('.');
}

// Obtener referencias en formato para base de datos
function obtenerReferencias() {
    const nombres = document.querySelectorAll('.referencia-nombre');
    const telefonos = document.querySelectorAll('.referencia-telefono');
    const profesiones = document.querySelectorAll('.referencia-profesion');
    const emails = document.querySelectorAll('.referencia-email');
    let referencias = [];
    
    for (let i = 0; i < nombres.length; i++) {
        if (nombres[i].value && telefonos[i].value && profesiones[i].value && emails[i].value) {
            referencias.push(`${nombres[i].value},${telefonos[i].value},${profesiones[i].value},${emails[i].value}`);
        }
    }
    
    const sinReferencias = document.getElementById('sin-referencias').checked;
    if (sinReferencias || referencias.length === 0) {
        return "No";
    }
    
    return referencias.join('.');
}

// Cargar plantilla con datos específicos
function cargarPlantillaConDatos(templateUrl, data) {
    // Primero cargar la plantilla vacía
    const iframe = document.getElementById('iframe-template');
    iframe.src = templateUrl;
    document.getElementById('modal').style.display = "block";
    
    // Esperar a que el iframe cargue para insertar los datos
    iframe.onload = function() {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            rellenarPlantilla(doc, data, templateUrl);
        } catch (e) {
            console.error("Error accediendo al iframe:", e);
            // En caso de error de CORS, mostrar advertencia
            iframe.contentWindow.postMessage({type: 'cvData', data: data}, '*');
        }
    };
}

// Rellenar plantilla según el tipo
function rellenarPlantilla(doc, data, template) {
    try {
        if (template.includes('plantilla_antigua.html')) {
            rellenarPlantillaAntigua(doc, data);
        } else if (template.includes('plantilla_clasico.html')) {
            rellenarPlantillaClasico(doc, data);
        } else if (template.includes('plantilla_actual.html')) {
            rellenarPlantillaActual(doc, data);
        }
    } catch (e) {
        console.error("Error rellenando plantilla", e);
    }
}

function rellenarPlantillaAntigua(doc, data) {
    doc.getElementById('antigua-nombre').textContent = data.nombre || '';
    doc.getElementById('antigua-cedula').textContent = data.numeroiden || '';
    doc.getElementById('antigua-direccion').textContent = data.direccion || '';
    doc.getElementById('antigua-ciudad').textContent = data.ciudad || '';
    doc.getElementById('antigua-telefono').textContent = data.telefono || '';
    doc.getElementById('antigua-email').textContent = data.email || '';
    doc.getElementById('antigua-nacionalidad').textContent = data.nacionalidad || '';
    doc.getElementById('antigua-estado_civil').textContent = data.estadocivil || '';
    doc.getElementById('antigua-genero').textContent = data.genero || '';
    doc.getElementById('antigua-edad').textContent = calcularEdad(data.fechanac);
    doc.getElementById('antigua-nivel_estudios').textContent = data.estudios || '';
    doc.getElementById('antigua-idiomas').textContent = data.idiomas || '';
    doc.getElementById('antigua-objetivo').textContent = data.objetivo || '';
    // Foto
    const fotoTd = doc.getElementById('antigua-foto');
    fotoTd.innerHTML = data.foto ? `<img src="${data.foto}" alt="Foto" style="width:100px;height:120px;">` : '';
    // Experiencia
    const expList = doc.getElementById('antigua-exp-list');
    expList.innerHTML = '';
    if (data.experiencias && data.experiencias !== "No") {
        data.experiencias.split('.').forEach(exp => {
            const [empresa, tiempo, cargo] = exp.split(',');
            const li = doc.createElement('li');
            li.innerHTML = `<span>${empresa || ''}</span><span>${tiempo || ''}</span><span>${cargo || ''}</span>`;
            expList.appendChild(li);
        });
    }
}
function calcularEdad(fecha) {
    if (!fecha) return '';
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
}

function rellenarPlantillaClasico(doc, data) {
    // Foto
    const fotoBox = doc.getElementById('clasico-foto');
    fotoBox.innerHTML = data.foto ? `<img src="${data.foto}" alt="Foto" style="width:100%;height:100%;object-fit:cover;">` : '';
    doc.getElementById('clasico-nombre').textContent = data.nombre || '';
    doc.getElementById('clasico-documento').textContent = `${data.tipoiden || ''}: ${data.numeroiden || ''}`;
    doc.getElementById('clasico-nacimiento').textContent = data.fechanac || '';
    doc.getElementById('clasico-lugar').textContent = data.ciudad || '';
    doc.getElementById('clasico-estado').textContent = data.estadocivil || '';
    doc.getElementById('clasico-direccion').textContent = data.direccion || '';
    doc.getElementById('clasico-celular').textContent = data.telefono || '';
    doc.getElementById('clasico-email').textContent = data.email || '';
    doc.getElementById('clasico-perfil').textContent = data.sobremi || '';
    // Formación académica
    doc.getElementById('clasico-profesional').textContent = '';
    doc.getElementById('clasico-tecnico').textContent = '';
    doc.getElementById('clasico-secundarios').textContent = '';
    if (data.estudios) {
        const estudios = data.estudios.split('.');
        estudios.forEach(estudio => {
            const [nivel, titulo, institucion, ano] = estudio.split(',');
            if (nivel && nivel.toLowerCase().includes('profesional')) {
                doc.getElementById('clasico-profesional').textContent = `${titulo || ''} - ${institucion || ''} - ${ano || ''}`;
            } else if (nivel && nivel.toLowerCase().includes('técnico')) {
                doc.getElementById('clasico-tecnico').textContent = `${titulo || ''} - ${institucion || ''} - ${ano || ''}`;
            } else if (nivel && nivel.toLowerCase().includes('bachiller')) {
                doc.getElementById('clasico-secundarios').textContent = `${titulo || ''} - ${institucion || ''} - ${ano || ''}`;
            }
        });
    }
    // Experiencia laboral
    const expDiv = doc.getElementById('clasico-experiencias');
    expDiv.innerHTML = '';
    if (data.experiencias && data.experiencias !== "No") {
        data.experiencias.split('.').forEach(exp => {
            const [empresa, tiempo, cargo, descripcion] = exp.split(',');
            const jobDiv = doc.createElement('div');
            jobDiv.className = 'job';
            jobDiv.innerHTML = `<h3>${cargo || ''} | ${empresa || ''}</h3>
                <p><strong>${tiempo || ''}</strong></p>
                <p>${descripcion || ''}</p>`;
            expDiv.appendChild(jobDiv);
        });
    }
    // Referencias
    const refDiv = doc.getElementById('clasico-referencias');
    refDiv.innerHTML = '';
    if (data.referencias && data.referencias !== "No") {
        data.referencias.split('.').forEach(ref => {
            const [nombre, telefono, profesion, email] = ref.split(',');
            const refItem = doc.createElement('div');
            refItem.className = 'reference';
            refItem.innerHTML = `<h3>${nombre || ''}</h3>
                <p>${profesion || ''}</p>
                <p>Teléfono: ${telefono || ''}</p>
                <p>E-mail: ${email || ''}</p>`;
            refDiv.appendChild(refItem);
        });
    }
}

function rellenarPlantillaActual(doc, data) {
    // Foto
    const fotoElement = doc.getElementById('actual-foto');
    if (fotoElement) fotoElement.src = data.foto || '';
    doc.getElementById('actual-nombre').textContent = data.nombre || '';
    doc.getElementById('actual-ocupacion').textContent = data.puesto || '';
    doc.getElementById('actual-telefono').textContent = data.telefono || '';
    doc.getElementById('actual-email').textContent = data.email || '';
    doc.getElementById('actual-identificacion').textContent = `${data.tipoiden || ''}: ${data.numeroiden || ''}`;
    doc.getElementById('actual-direccion').textContent = data.direccion || '';
    doc.getElementById('actual-sobremi').textContent = data.sobremi || '';
    // Experiencia
    const expDiv = doc.getElementById('actual-experiencias');
    expDiv.innerHTML = '';
    if (data.experiencias && data.experiencias !== "No") {
        data.experiencias.split('.').forEach(exp => {
            const [empresa, tiempo, cargo, descripcion] = exp.split(',');
            const jobDiv = doc.createElement('div');
            jobDiv.className = 'job';
            jobDiv.innerHTML = `<h3>${cargo || ''} | ${empresa || ''}</h3>
                <p>${descripcion || ''}</p>`;
            expDiv.appendChild(jobDiv);
        });
    }
    // Educación
    const eduDiv = doc.getElementById('actual-educacion');
    eduDiv.innerHTML = '';
    if (data.estudios) {
        data.estudios.split('.').forEach(estudio => {
            const [nivel, titulo, institucion, ano] = estudio.split(',');
            const eduItem = doc.createElement('div');
            eduItem.className = 'education-item';
            eduItem.innerHTML = `<h3>${titulo || ''}</h3>
                <p>${institucion || ''} - ${ano || ''}</p>`;
            eduDiv.appendChild(eduItem);
        });
    }
    // Habilidades
    const skillDiv = doc.getElementById('actual-habilidades');
    skillDiv.innerHTML = '';
    if (data.habilidades && data.habilidades.habilidad) {
        data.habilidades.habilidad.split(',').forEach(skill => {
            const span = doc.createElement('span');
            span.textContent = skill.trim();
            skillDiv.appendChild(span);
        });
    }
    // Idiomas
    const idiomasDiv = doc.getElementById('actual-idiomas');
    idiomasDiv.innerHTML = '';
    if (data.idiomas) {
        data.idiomas.split('.').forEach(idioma => {
            const [nombre, nivel] = idioma.split(',');
            const p = doc.createElement('p');
            p.textContent = `${nombre || ''} - ${nivel || ''}`;
            idiomasDiv.appendChild(p);
        });
    }
    // Referencias
    const refDiv = doc.getElementById('actual-referencias');
    refDiv.innerHTML = '';
    if (data.referencias && data.referencias !== "No") {
        data.referencias.split('.').forEach(ref => {
            const [nombre, telefono, profesion, email] = ref.split(',');
            const refItem = doc.createElement('div');
            refItem.className = 'reference';
            refItem.innerHTML = `<strong>${nombre || ''}</strong><br>
                <span>${profesion || ''} / ${telefono || ''}</span><br>
                <span>${email || ''}</span>`;
            refDiv.appendChild(refItem);
        });
    }
}

// Modificar la función cargarCVs para poblar el selector
async function cargarCVs() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            cvDataList = await response.json();
            poblarSelectorPersonas();
            console.log("Conexión con el backend establecida");
        }
    } catch (error) {
        console.error("Error al conectar con el backend:", error);
    }
}

// Poblar el selector de personas con CVs existentes
function poblarSelectorPersonas() {
    const selector = document.getElementById('personaSelect');
    const btnEditar = document.getElementById('btn-editar');
    const btnEliminar = document.getElementById('btn-eliminar');
    
    if (!selector) return;
    
    // Limpiar opciones excepto la primera
    while (selector.options.length > 1) {
        selector.remove(1);
    }
    
    // Agregar cada CV al selector
    cvDataList.forEach(cv => {
        const option = document.createElement('option');
        option.value = cv.id;
        option.textContent = cv.nombre || `CV ${cv.id}`;
        selector.appendChild(option);
    });
    
    // Habilitar o deshabilitar botones según si hay selección
    selector.addEventListener('change', function() {
        const hasSelection = this.value !== '';
        btnEditar.disabled = !hasSelection;
        btnEliminar.disabled = !hasSelection;
    });
}

// Cargar códigos telefónicos desde el CSV
async function cargarCodigosTelefonicos() {
    try {
        const response = await fetch('recursos/paises.csv');
        const text = await response.text();
        const lineas = text.trim().split('\n');
        const encabezados = lineas[0].split(',').map(h => h.trim().toLowerCase());
        
        // Encontrar índices de las columnas relevantes
        const nombreIndex = encabezados.indexOf('nombre');
        const phoneCodeIndex = encabezados.indexOf('phone_code');
        
        if (nombreIndex === -1 || phoneCodeIndex === -1) {
            throw new Error('Columnas necesarias no encontradas en el CSV');
        }
        
        // Procesar las líneas
        codigosTelefonicos = lineas.slice(1).map(linea => {
            const columnas = linea.split(',');
            // Manejar comillas en los valores
            const nombre = columnas[nombreIndex].replace(/"/g, '').trim();
            let phoneCode = columnas[phoneCodeIndex].replace(/"/g, '').trim();
            
            // Limpiar y formatear el código telefónico
            phoneCode = phoneCode.replace(/\s/g, ''); // Eliminar espacios
            if (phoneCode && !phoneCode.startsWith('+')) {
                phoneCode = '+' + phoneCode;
            }
            
            return { nombre, phoneCode };
        }).filter(pais => pais.phoneCode); // Filtrar países sin código
        
        llenarSelectCodigosPais();
    } catch (error) {
        console.error('Error al cargar códigos telefónicos:', error);
        // Cargar códigos por defecto en caso de error
        cargarCodigosPorDefecto();
    }
}

// Llenar el select con los códigos telefónicos
function llenarSelectCodigosPais() {
    const select = document.getElementById('codigoPais');
    if (!select) return;
    
    select.innerHTML = ''; // Limpiar opciones existentes
    
    // Ordenar alfabéticamente por nombre del país
    codigosTelefonicos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Agregar opción por defecto
    const optionDefault = document.createElement('option');
    optionDefault.value = '';
    optionDefault.textContent = 'Seleccione código de país';
    optionDefault.disabled = true;
    optionDefault.selected = true;
    select.appendChild(optionDefault);
    
    // Agregar opciones de países
    codigosTelefonicos.forEach(pais => {
        const option = document.createElement('option');
        option.value = pais.phoneCode;
        
        // Obtener código de bandera (simulado)
        const bandera = obtenerBanderaPorPais(pais.nombre);
        option.textContent = `${bandera} ${pais.phoneCode} (${pais.nombre})`;
        
        // Seleccionar Colombia por defecto
        if (pais.nombre === "Colombia") {
            option.selected = true;
        }
        
        select.appendChild(option);
    });
    
    // Inicializar funcionalidad de teléfono después de cargar los códigos
    inicializarTelefono();
}

// Función simulada para obtener banderas (en un caso real, usaría una API o un mapping)
function obtenerBanderaPorPais(nombrePais) {
    const banderas = {
        "Colombia": "🇨🇴",
        "Estados Unidos": "🇺🇸",
        "México": "🇲🇽",
        "España": "🇪🇸",
        "Argentina": "🇦🇷",
        "Brasil": "🇧🇷",
        "Chile": "🇨🇱",
        "Perú": "🇵🇪",
        "Venezuela": "🇻🇪",
        "Ecuador": "🇪🇨"
    };
    
    return banderas[nombrePais] || "🇺🇳";
}

// Cargar códigos por defecto en caso de error
function cargarCodigosPorDefecto() {
    codigosTelefonicos = [
        { nombre: "Colombia", phoneCode: "+57" },
        { nombre: "Estados Unidos", phoneCode: "+1" },
        { nombre: "México", phoneCode: "+52" },
        { nombre: "España", phoneCode: "+34" },
        { nombre: "Argentina", phoneCode: "+54" }
    ];
    
    llenarSelectCodigosPais();
}

// Inicializar funcionalidad de teléfono
function inicializarTelefono() {
    const codigoPais = document.getElementById('codigoPais');
    const telefono = document.getElementById('telefono');
    
    if (!codigoPais || !telefono) return;
    
    // Actualizar el placeholder según el código de país seleccionado
    codigoPais.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const match = selectedOption.textContent.match(/\(([^)]+)\)/);
        const countryName = match ? match[1] : '';
        
        // Establecer placeholder según el país
        if (countryName === "Colombia") {
            telefono.placeholder = '3001234567';
        } else {
            telefono.placeholder = 'Número de teléfono';
        }
    });
    
    // Disparar el evento change para establecer el placeholder inicial
    if (codigoPais.value) {
        codigoPais.dispatchEvent(new Event('change'));
    }
}

// Inicializar funcionalidad de dirección
function inicializarDireccion() {
    const tipoVia = document.getElementById('tipoVia');
    const numVia = document.getElementById('numVia');
    const sufijoVia = document.getElementById('sufijoVia');
    const numPlaca = document.getElementById('numPlaca');
    const apto = document.getElementById('apto');
    
    if (!tipoVia || !numVia) return;
    
    // Actualizar dirección completa cuando cambien los campos
    [tipoVia, numVia, sufijoVia, numPlaca, apto].forEach(input => {
        if (input) {
            input.addEventListener('change', actualizarDireccionCompleta);
            input.addEventListener('input', actualizarDireccionCompleta);
        }
    });
}

function actualizarDireccionCompleta() {
    const tipoVia = document.getElementById('tipoVia');
    const numVia = document.getElementById('numVia');
    const sufijoVia = document.getElementById('sufijoVia');
    const numPlaca = document.getElementById('numPlaca');
    const apto = document.getElementById('apto');
    const direccionCompleta = document.getElementById('direccion');
    
    if (!tipoVia || !numVia || !direccionCompleta) return;
    
    let direccion = '';
    if (tipoVia.value && numVia.value) {
        direccion += `${tipoVia.value} ${numVia.value}`;
        if (sufijoVia && sufijoVia.value) direccion += ` ${sufijoVia.value}`;
        if (numPlaca && numPlaca.value) direccion += ` # ${numPlaca.value}`;
        if (apto && apto.value) direccion += `, ${apto.value}`;
    }
    
    direccionCompleta.value = direccion;
}

// Inicializar funcionalidad de estudios
function inicializarEstudios() {
    const addEstudioBtn = document.getElementById("add-estudio-btn");
    if (!addEstudioBtn) return;
    
    addEstudioBtn.addEventListener('click', agregarEstudio);
}

function agregarEstudio() {
    if (estudiosCount >= MAX_ESTUDIOS) {
        mostrarNotificacion(`Solo se permiten un máximo de ${MAX_ESTUDIOS} estudios.`, 'error');
        return;
    }
    
    const container = document.getElementById('estudios-container');
    if (!container) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'estudio-item row g-2 mb-2';
    newItem.innerHTML = `
        <div class="col-md-3">
            <select class="form-select nivel-estudio" name="nivelEstudio[]">
                <option value="" disabled selected>Nivel de estudio</option>
                <option value="Bachiller">Bachiller</option>
                <option value="Técnico">Técnico</option>
                <option value="Tecnólogo">Tecnólogo</option>
                <option value="Profesional">Profesional</option>
                <option value="Especialización">Especialización</option>
                <option value="Maestría">Maestría</option>
                <option value="Doctorado">Doctorado</option>
                <option value="Curse">Curso/Certificación</option>
                <option value="Diplomado">Diplomado</option>
            </select>
        </div>
        <div class="col-md-4">
            <input type="text" class="form-control titulo-estudio" name="tituloEstudio[]" placeholder="Título obtenido">
        </div>
        <div class="col-md-3">
            <input type="text" class="form-control institucion-estudio" name="institucionEstudio[]" placeholder="Institución">
        </div>
        <div class="col-md-2">
            <div class="input-group">
                <input type="number" class="form-control ano-estudio" name="anoEstudio[]" placeholder="Año" min="1950" max="2030">
                <button type="button" class="btn btn-danger btn-sm remove-estudio"><i class="bi bi-dash"></i></button>
            </div>
        </div>
    `;
    
    container.appendChild(newItem);
    estudiosCount++;
    
    // Agregar evento al botón de eliminar
    const removeBtn = newItem.querySelector('.remove-estudio');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            newItem.remove();
            estudiosCount--;
        });
    }
    
    // Ocultar botón de agregar si llegamos al máximo
    if (estudiosCount >= MAX_ESTUDIOS) {
        addEstudioBtn.style.display = 'none';
    }
}

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


// Guardar o actualizar CV
async function guardarCV(e) {
    e.preventDefault();

    if (!validarFormulario()) return;

    // Obtener datos del formulario
    const estudios = obtenerEstudios();
    const experiencias = obtenerExperiencias();
    const idiomas = obtenerIdiomas();
    const referencias = obtenerReferencias();
    const telefono = obtenerTelefonoParaBackend();
    
    // Obtener habilidades seleccionadas
    const habilidadesSelect = document.getElementById('habilidades-select');
    const habilidades = Array.from(habilidadesSelect.selectedOptions).map(opt => opt.value).join(', ');

    // Obtener foto
    const fotoPreview = document.querySelector('.foto-preview');
    let foto = '';
    
    if (fotoPreview && fotoPreview.style.display !== 'none' && fotoPreview.src) {
        foto = fotoPreview.src;
    }

    if (!foto || !foto.startsWith('data:image/svg+xml')) {
        mostrarNotificacion("Debes subir una imagen en formato SVG antes de guardar.", "error");
        return;
    }
    
    // Usar el SVG original si está disponible
    if (fotoPreview.style.display !== 'none') {
        foto = fotoPreview.dataset.originalSvg || fotoPreview.src;
        
        // Si es una URL de objeto, convertirla a base64
        if (foto.startsWith('blob:')) {
            try {
                const blob = await response.blob();
                const response = await fetch(foto);
                foto = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Error procesando imagen:', error);
                foto = fotoPreview.src;
            }
        }
    }

    // Preparar datos para enviar
    const cvData = {
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        telefono: telefono,
        tipoiden: document.getElementById("tipoiden").value,
        numeroiden: document.getElementById("numeroiden").value,
        fechanac: document.getElementById("fechanac").value,
        genero: document.getElementById("genero").value,
        estadocivil: document.getElementById("estadocivil").value,
        ciudad: document.getElementById("ciudad").value,
        direccion: document.getElementById("direccion").value,
        ocupacion: document.getElementById("ocupacion").value,
        puesto: document.getElementById("puesto").value,
        nacionalidad: document.getElementById("pais").value,
        objetivo: document.getElementById("objetivo").value,
        perfil: document.getElementById("sobremi").value,
        foto: foto,
        referencias: referencias,
        habilidades: {
            habilidad: habilidades,
            educacion: estudios,
            experiencia: experiencias,
            idiomas: idiomas,
        }
    };

    // DEBUG: Mostrar datos que se enviarán
    console.log("Datos a enviar:", cvData);

    try {
        let response;
        if (editando) {
            const id = document.getElementById("cvId").value;
            response = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cvData)
            });
        } else {
            response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cvData)
            });
        }

        // Verificar si la respuesta fue exitosa
        if (response.ok) {
            const result = await response.json();
            console.log("Respuesta del servidor:", result);
            mostrarNotificacion(editando ? "CV actualizado correctamente" : "CV guardado correctamente");
            resetForm();
        } else {
            // Mostrar detalles del error
            const errorText = await response.text();
            console.error("Error del servidor:", response.status, errorText);
            mostrarNotificacion(`Error ${response.status}: ${errorText}`, "error");
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        mostrarNotificacion("Error de conexión con el servidor.", "error");
    }
}

// Función para resetear el formulario
function resetForm() {
    const cvForm = document.getElementById("cvForm");
    const cvIdInput = document.getElementById("cvId");
    const guardarBtn = document.getElementById("btnguardar");
    const cancelarBtn = document.getElementById("btncancelar");
    
    if (cvForm) cvForm.reset();
    if (cvIdInput) cvIdInput.value = "";
    editando = false;
    
    if (guardarBtn) guardarBtn.textContent = "Guardar";
    if (cancelarBtn) cancelarBtn.style.display = "none";
    
    // Reiniciar estudios
    const estudiosContainer = document.getElementById('estudios-container');
    if (estudiosContainer) {
        estudiosContainer.innerHTML = `
            <div class="estudio-item row g-2 mb-2">
                <div class="col-md-3">
                    <select class="form-select nivel-estudio" name="nivelEstudio[]" required>
                        <option value="" disabled selected>Nivel de estudio</option>
                        <option value="Bachiller">Bachiller</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Tecnólogo">Tecnólogo</option>
                        <option value="Profesional">Profesional</option>
                        <option value="Especialización">Especialización</option>
                        <option value="Maestría">Maestría</option>
                        <option value="Doctorado">Doctorado</option>
                        <option value="Curso">Curso/Certificación</option>
                        <option value="Diplomado">Diplomado</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control titulo-estudio" name="tituloEstudio[]" placeholder="Título obtenido" required>
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control institucion-estudio" name="institucionEstudio[]" placeholder="Institución" required>
                </div>
                <div class="col-md-2">
                    <div class="input-group">
                        <input type="number" class="form-control ano-estudio" name="anoEstudio[]" placeholder="Año" min="1950" max="2030" required>
                        <button type="button" class="btn btn-danger btn-sm remove-estudio"><i class="bi bi-dash"></i></button>
                    </div>
                </div>
            </div>
        `;
    }
    estudiosCount = 1;
    
    // Reiniciar experiencias
    const experienciasContainer = document.getElementById('experiencias-container');
    if (experienciasContainer) {
        experienciasContainer.innerHTML = '';
    }
    experienciasCount = 0;
    inicializarExperiencias();
    
    // Reiniciar idiomas
    const idiomasContainer = document.getElementById('idiomas-container');
    if (idiomasContainer) {
        idiomasContainer.innerHTML = `
            <div class="idioma-item row g-2 mb-2">
                <div class="col-md-5">
                    <select class="form-select idioma" name="idioma[]">
                        <option value="" disabled selected>Seleccione idioma</option>
                        <option value="Español">Español</option>
                        <option value="Inglés">Inglés</option>
                        <option value="Francés">Francés</option>
                        <option value="Alemán">Alemán</option>
                        <option value="Italiano">Italiano</option>
                        <option value="Portugués">Portugués</option>
                        <option value="Chino">Chino</option>
                        <option value="Japonés">Japonés</option>
                        <option value="Ruso">Ruso</option>
                        <option value="Árabe">Árabe</option>
                    </select>
                </div>
                <div class="col-md-5">
                    <select class="form-select nivel-idioma" name="nivelIdioma[]">
                        <option value="" disabled selected>Nivel</option>
                        <option value="Básico">Básico</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                        <option value="Nativo">Nativo</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-danger btn-sm remove-idioma"><i class="bi bi-dash"></i></button>
                </div>
            </div>
        `;
    }
    idiomasCount = 1;
    
    // Reiniciar referencias
    const referenciasContainer = document.getElementById('referencias-container');
    if (referenciasContainer) {
        referenciasContainer.innerHTML = '';
    }
    referenciasCount = 0;
    inicializarReferencias();
    
    // Reiniciar habilidades
    const habilidadesSelect = document.getElementById('habilidades-select');
    if (habilidadesSelect) {
        Array.from(habilidadesSelect.options).forEach(option => {
            option.selected = false;
        });
    }
    
    // Reiniciar foto
    const fotoPreview = document.querySelector('.foto-preview');
    if (fotoPreview) {
        fotoPreview.src = '';
        fotoPreview.style.display = 'none';
    }
    
    const fotoInput = document.getElementById('foto');
    if (fotoInput) {
        fotoInput.value = '';
    }
    
    // Mostrar botones de agregar
    const addEstudioBtn = document.getElementById("add-estudio-btn");
    if (addEstudioBtn) addEstudioBtn.style.display = 'block';
    
    const addIdiomaBtn = document.getElementById("add-idioma-btn");
    if (addIdiomaBtn) addIdiomaBtn.style.display = 'block';
    
    const addExperienciaBtn = document.getElementById("add-experiencia-btn");
    if (addExperienciaBtn) addExperienciaBtn.style.display = 'block';
    
    const addReferenciaBtn = document.getElementById("add-referencia-btn");
    if (addReferenciaBtn) addReferenciaBtn.style.display = 'block';
    
    // Mostrar contenedores
    document.getElementById('experiencias-container').style.display = 'block';
    document.getElementById('referencias-container').style.display = 'block';
    
    // Desmarcar checkboxes
    document.getElementById('sin-experiencia').checked = false;
    document.getElementById('sin-referencias').checked = false;
    document.getElementById('objetivo-sin-experiencia').style.display = 'none';
    
    cargarCVs();
}

// Editar CV
async function editarCV(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Error al cargar el CV");
        const cv = await response.json();

        const cvIdInput = document.getElementById('cvId');
        if (cvIdInput) cvIdInput.value = cv.id;
        
        // Llenar campos básicos
        document.getElementById("nombre").value = cv.nombre || "";
        document.getElementById("email").value = cv.email || "";
        
        // Separar código de país y número de teléfono
        if (cv.telefono) {
            // Buscar el código de país en la lista
            const codigoEncontrado = codigosTelefonicos.find(pais => 
                cv.telefono.startsWith(pais.phoneCode)
            );
            
            if (codigoEncontrado) {
                document.getElementById("codigoPais").value = codigoEncontrado.phoneCode;
                document.getElementById("telefono").value = cv.telefono.substring(codigoEncontrado.phoneCode.length);
            } else {
                // Intentar detectar el código (para compatibilidad con datos existentes)
                const codigoMatch = cv.telefono.match(/^\+\d+/);
                if (codigoMatch) {
                    document.getElementById("codigoPais").value = codigoMatch[0];
                    document.getElementById("telefono").value = cv.telefono.substring(codigoMatch[0].length);
                } else {
                    // Si no tiene código, usar Colombia por defecto
                    document.getElementById("codigoPais").value = "+57";
                    document.getElementById("telefono").value = cv.telefono;
                }
            }
        }
        
        document.getElementById("tipoiden").value = cv.tipoiden || "";
        document.getElementById("numeroiden").value = cv.numeroiden || "";
        document.getElementById("fechanac").value = cv.fechanac || "";
        document.getElementById("genero").value = cv.genero || "";
        document.getElementById("estadocivil").value = cv.estadocivil || "";
        document.getElementById("ciudad").value = cv.ciudad || "";
        document.getElementById("direccion").value = cv.direccion || "";
        document.getElementById("ocupacion").value = cv.ocupacion || "";
        document.getElementById("puesto").value = cv.puesto || "";
        document.getElementById("pais").value = cv.nacionalidad || "";
        document.getElementById("objetivo").value = cv.objetivo || "";
        document.getElementById("sobremi").value = cv.sobremi || "";
        
        // Establecer habilidades
        if (cv.habilidades) {
            const habilidades = cv.habilidades.habilidad.split(', ');
            const habilidadesSelect = document.getElementById('habilidades-select');
            Array.from(habilidadesSelect.options).forEach(option => {
                option.selected = habilidades.includes(option.value);
            });
        }
        
        // Establecer estudios
        if (cv.estudios) {
            establecerEstudios(cv.estudios);
        }
        
        // Establecer experiencias
        if (cv.experiencias && cv.experiencias !== "No") {
            establecerExperiencias(cv.experiencias);
        } else {
            document.getElementById('sin-experiencia').checked = true;
            document.getElementById('objetivo_sin_experiencia').value = cv.objetivo || '';
        }
        
        // Establecer idiomas
        if (cv.idiomas) {
            establecerIdiomas(cv.idiomas);
        }
        
        // Establecer referencias
        if (cv.referencias && cv.referencias !== "No") {
            establecerReferencias(cv.referencias);
        } else {
            document.getElementById('sin-referencias').checked = true;
        }
        
        // Establecer foto
        if (cv.foto) {
            const fotoPreview = document.querySelector('.foto-preview');
            fotoPreview.src = cv.foto;
            fotoPreview.style.display = 'block';
        }
        
        editando = true;
        const guardarBtn = document.getElementById("btnguardar");
        if (guardarBtn) guardarBtn.textContent = "Actualizar";
        
        const cancelarBtn = document.getElementById("btncancelar");
        if (cancelarBtn) cancelarBtn.style.display = "block";
        
        // Desplazar al formulario
        document.getElementById('cvForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error(error);
        mostrarNotificacion("Error al cargar el CV.", "error");
    }
}

// Establecer estudios desde base de datos
function establecerEstudios(estudiosStr) {
    if (!estudiosStr) return;
    
    const estudios = estudiosStr.split('.');
    estudiosCount = 0;
    const container = document.getElementById('estudios-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    estudios.forEach((estudio, index) => {
        if (index < MAX_ESTUDIOS) {
            const [nivel, titulo, institucion, ano] = estudio.split(',');
            agregarEstudio();
            const nuevosEstudios = document.querySelectorAll('.estudio-item');
            const lastEstudio = nuevosEstudios[nuevosEstudios.length - 1];
            
            if (lastEstudio) {
                const nivelSelect = lastEstudio.querySelector('.nivel-estudio');
                const tituloInput = lastEstudio.querySelector('.titulo-estudio');
                const institucionInput = lastEstudio.querySelector('.institucion-estudio');
                const anoInput = lastEstudio.querySelector('.ano-estudio');
                
                if (nivelSelect) nivelSelect.value = nivel;
                if (tituloInput) tituloInput.value = titulo;
                if (institucionInput) institucionInput.value = institucion;
                if (anoInput) anoInput.value = ano;
            }
        }
    });
}

// Establecer experiencias desde base de datos
function establecerExperiencias(experienciasStr) {
    if (!experienciasStr) return;
    
    const experiencias = experienciasStr.split('.');
    experienciasCount = 0;
    const container = document.getElementById('experiencias-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    experiencias.forEach((experiencia, index) => {
        if (index < MAX_EXPERIENCIAS) {
            const [empresa, tiempo, cargo, descripcion] = experiencia.split(',');
            agregarExperiencia();
            const nuevasExperiencias = document.querySelectorAll('.experiencia-item');
            const lastExperiencia = nuevasExperiencias[nuevasExperiencias.length - 1];
            
            if (lastExperiencia) {
                const empresaInput = lastExperiencia.querySelector('.empresa');
                const tiempoInput = lastExperiencia.querySelector('.tiempo');
                const cargoInput = lastExperiencia.querySelector('.cargo');
                const descripcionInput = lastExperiencia.querySelector('.descripcion');
                
                if (empresaInput) empresaInput.value = empresa;
                if (tiempoInput) tiempoInput.value = tiempo;
                if (cargoInput) cargoInput.value = cargo;
                if (descripcionInput) descripcionInput.value = descripcion;
            }
        }
    });
}

// Establecer idiomas desde base de datos
function establecerIdiomas(idiomasStr) {
    if (!idiomasStr) return;
    const idiomas = idiomasStr.split('.');
    idiomasCount = 0;
    const container = document.getElementById('idiomas-container');
    if (!container) return;
    container.innerHTML = '';
    idiomas.forEach((idioma, index) => {
        if (index < MAX_IDIOMAS) {
            const [nombre, nivel] = idioma.split(',');
            agregarIdioma();
            const items = container.querySelectorAll('.idioma-item');
            const item = items[index];
            if (item) {
                item.querySelector('.idioma').value = nombre || '';
                item.querySelector('.nivel-idioma').value = nivel || '';
            }
        }
    });
}

// Establecer referencias desde base de datos
function establecerReferencias(referenciasStr) {
    if (!referenciasStr || referenciasStr === "No") return;
    
    const referencias = referenciasStr.split('.');
    referenciasCount = 0;
    const container = document.getElementById('referencias-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    referencias.forEach((referencia, index) => {
        if (index < MAX_REFERENCIAS) {
            const [nombre, telefono, profesion, email] = referencia.split(',');
            agregarReferencia();
            const nuevasReferencias = document.querySelectorAll('.referencia-item');
            const lastReferencia = nuevasReferencias[nuevasReferencias.length - 1];
            
            if (lastReferencia) {
                const nombreInput = lastReferencia.querySelector('.referencia-nombre');
                const telefonoInput = lastReferencia.querySelector('.referencia-telefono');
                const profesionInput = lastReferencia.querySelector('.referencia-profesion');
                const emailInput = lastReferencia.querySelector('.referencia-email');
                
                if (nombreInput) nombreInput.value = nombre;
                if (telefonoInput) telefonoInput.value = telefono;
                if (profesionInput) profesionInput.value = profesion;
                if (emailInput) emailInput.value = email;
            }
        }
    });
}

// Eliminar CV
async function eliminarCV(id) {
    mostrarConfirmacion("¿Seguro que deseas eliminar este CV?", async (confirmado) => {
        if (confirmado) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                if (response.ok) {
                    mostrarNotificacion("CV eliminado correctamente");
                    cargarCVs();
                } else {
                    mostrarNotificacion("Error al eliminar el CV.", "error");
                }
            } catch (error) {
                console.error(error);
                mostrarNotificacion("Error al eliminar el CV.", "error");
            }
        }
    });
}

// Cargar datos desde CSV
async function cargarCSV(url, columna) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const lineas = text.trim().split('\n');
        const encabezados = lineas[0].split(',').map(h => h.trim().toLowerCase());
        const indice = encabezados.indexOf(columna.toLowerCase());

        if (indice === -1) {
            throw new Error(`La columna "${columna}" no existe en ${url}`);
        }

        return lineas.slice(1).map(linea => {
            const columnas = linea.split(',');
            return columnas[indice].replace(/"/g, '').trim();
        }).filter(item => item); // Filtrar elementos vacíos
    } catch (error) {
        console.error(`Error cargando ${url}:`, error);
        return [];
    }
}

function llenarDatalist(datalistId, opciones) {
    const datalist = document.getElementById(datalistId);
    if (!datalist) return;
    
    datalist.innerHTML = '';
    opciones.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        datalist.appendChild(option);
    });
}