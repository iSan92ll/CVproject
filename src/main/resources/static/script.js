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
let editando = false;
let cropper;

function mostrarNotificacion(mensaje, tipo = 'success', tiempo = 5) {
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
    inicializarTelefonoIntl();

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
            if (columnas[1] === 'Colombia') {
                return columnas[0].replace(/"/g, '').trim();
            }
            return null;
        }).filter(name => name !== null);
    } catch (error) {
        console.error('Error al cargar ciudades de Colombia:', error);
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

    const empresaInput = newItem.querySelector('.empresa');
    const cargoInput = newItem.querySelector('.cargo');
    const descripcionInput = newItem.querySelector('.descripcion');
    
    if (empresaInput) {
        empresaInput.addEventListener('blur', function() {
            validarNombre(this);
        });
    }
    if (cargoInput) {
        cargoInput.addEventListener('blur', function() {
            validarPuesto(this);
        });
    }
    if (descripcionInput) {
        descripcionInput.addEventListener('blur', function() {
            validarDescripcionExperiencia(this);
        });
    }

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
            <input type="text" class="form-control referencia-telefono" id="referenciaTelefono${referenciasCount}" name="referenciaTelefono[]" placeholder="Teléfono de contacto" required>
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

    const nombreInput = newItem.querySelector('.referencia-nombre');
    const profesionInput = newItem.querySelector('.referencia-profesion');
    const emailInput = newItem.querySelector('.referencia-email');
    const telefonoRef = newItem.querySelector('.referencia-telefono');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validarEmail(this);
        });
    }
    if (nombreInput) {
        nombreInput.addEventListener('blur', function() {
            validarNombre(this);
        });
    }
    if (profesionInput) {
        profesionInput.addEventListener('blur', function() {
            validarOcupacion(this);
        });
    }

if (telefonoRef) {
        inicializarTelefonoIntl(telefonoRef.id);
    }
    
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
        telefono: obtenerTelefonoParaBackend(),
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

function obtenerEstudios() {
    const niveles = document.querySelectorAll('.nivel-estudio');
    const titulos = document.querySelectorAll('.titulo-estudio');
    const instituciones = document.querySelectorAll('.institucion-estudio');
    const anos = document.querySelectorAll('.ano-estudio');
    let estudios = [];
    
    for (let i = 0; i < niveles.length; i++) {
        estudios.push([
            niveles[i].value,
            titulos[i].value,
            instituciones[i].value,
            anos[i].value
        ].join(','));
    }
    return estudios.join(';');
}

function obtenerExperiencias() {
    const empresas = document.querySelectorAll('.empresa');
    const tiempos = document.querySelectorAll('.tiempo');
    const cargos = document.querySelectorAll('.cargo');
    const descripciones = document.querySelectorAll('.descripcion');
    let experiencias = [];
    
    for (let i = 0; i < empresas.length; i++) {
        experiencias.push([
            empresas[i].value,
            tiempos[i].value,
            cargos[i].value,
            descripciones[i].value
        ].join(','));
    }
    return experiencias.join(';');
}

function obtenerIdiomas() {
    const idiomas = document.querySelectorAll('.idioma');
    const niveles = document.querySelectorAll('.nivel-idioma');
    let idiomasData = [];
    
    for (let i = 0; i < idiomas.length; i++) {
        idiomasData.push([
            idiomas[i].value,
            niveles[i].value
        ].join(','));
    }
    return idiomasData.join(';');
}

function obtenerReferencias() {
    const nombres = document.querySelectorAll('.referencia-nombre');
    const telefonos = document.querySelectorAll('.referencia-telefono');
    const profesiones = document.querySelectorAll('.referencia-profesion');
    const emails = document.querySelectorAll('.referencia-email');
    let referencias = [];
    
    for (let i = 0; i < nombres.length; i++) {
        referencias.push([
            nombres[i].value,
            telefonos[i].value,
            profesiones[i].value,
            emails[i].value
        ].join(','));
    }
    const sinReferencias = document.getElementById('sin-referencias').checked;
    if (sinReferencias || referencias.length === 0) {
        return "No";
    }
    return referencias.join(';');
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

    // Estudios: mostrar todos los títulos separados por coma
    let estudiosNombres = '';
    if (data.habilidades.educacion) {
        estudiosNombres = data.habilidades.educacion.split(';').map(estudio => {
            const partes = estudio.split(',');
            return partes[1] || ''; // Título
        }).filter(Boolean).join(', ');
    }
    doc.getElementById('antigua-nivel_estudios').textContent = estudiosNombres;

    // Idiomas
    let idiomasStr = '';
    if (data.habilidades.idiomas) {
        idiomasStr = data.habilidades.idiomas.split(';').map(idioma => {
            const partes = idioma.split(',');
            return partes[0] ? `${partes[0]} (${partes[1] || ''})` : '';
        }).filter(Boolean).join(', ');
    }
    doc.getElementById('antigua-idiomas').textContent = idiomasStr;

    doc.getElementById('antigua-objetivo').textContent = data.objetivo || '';

    // Foto
    const fotoTd = doc.getElementById('antigua-foto');
    fotoTd.innerHTML = data.foto ? `<img src="${data.foto}" alt="Foto" style="width:100px;height:120px;">` : '';

    // Experiencia
    const expList = doc.getElementById('antigua-exp-list');
    expList.innerHTML = '';
    if (data.habilidades.experiencia && data.habilidades.experiencia !== "No") {
        data.habilidades.experiencia.split(';').forEach(exp => {
            const partes = exp.split(',');
            const empresa = partes[0] || '';
            const tiempo = partes[1] || '';
            const cargo = partes[2] || '';
            const li = doc.createElement('li');
            li.innerHTML = `<span>${empresa}</span><span>${tiempo}</span><span>${cargo}</span>`;
            expList.appendChild(li);
        });
    }
}

function rellenarPlantillaClasico(doc, data) {
    // Foto
    const fotoBox = doc.getElementById('clasico-foto');
    if (fotoBox) fotoBox.innerHTML = data.foto ? `<img src="${data.foto}" alt="Foto" style="width:100%;height:100%;object-fit:cover;">` : '';

    // Nombre
    if (doc.getElementById('clasico-nombre')) doc.getElementById('clasico-nombre').textContent = data.nombre || '';

    // Información personal
    if (doc.getElementById('clasico-documento')) doc.getElementById('clasico-documento').textContent = `${data.tipoiden || ''}: ${data.numeroiden || ''}`;
    if (doc.getElementById('clasico-nacimiento')) doc.getElementById('clasico-nacimiento').textContent = data.fechanac || '';
    if (doc.getElementById('clasico-lugar')) doc.getElementById('clasico-lugar').textContent = data.ciudad || '';
    if (doc.getElementById('clasico-estado')) doc.getElementById('clasico-estado').textContent = data.estadocivil || '';
    if (doc.getElementById('clasico-direccion')) doc.getElementById('clasico-direccion').textContent = data.direccion || '';
    if (doc.getElementById('clasico-celular')) doc.getElementById('clasico-celular').textContent = data.telefono || '';
    if (doc.getElementById('clasico-email')) doc.getElementById('clasico-email').textContent = data.email || '';

    // Perfil (incluye habilidades)
    let perfilText = (data.sobremi || data.perfil || '');
    if (data.habilidades && data.habilidades.habilidad) {
        perfilText += perfilText ? "\n\n" : "";
        perfilText += "Habilidades: " + data.habilidades.habilidad;
    }
    if (doc.getElementById('clasico-perfil')) doc.getElementById('clasico-perfil').textContent = perfilText;

    // Formación Académica
    const eduDiv = doc.getElementById('clasico-educacion');
    eduDiv.innerHTML = '';
    if (data.habilidades.educacion) {
        data.habilidades.educacion.split(';').forEach(estudio => {
            const partes = estudio.split(',');
            const titulo = partes[1] || '';
            const institucion = partes[2] || '';
            const ano = partes.slice(3).join(',') || '';
            const eduItem = doc.createElement('div');
            eduItem.className = 'education-item';
            eduItem.innerHTML = `<p><strong>${titulo}</strong></p>
                <p>${institucion} - ${ano}</p>`;
            eduDiv.appendChild(eduItem);
        });
    }

    // Experiencia Laboral
    const expDiv = doc.getElementById('clasico-experiencias');
    if (expDiv) {
        expDiv.innerHTML = '';
        if (data.habilidades && data.habilidades.experiencia && data.habilidades.experiencia !== "No") {
            data.habilidades.experiencia.split(';').forEach(exp => {
                const partes = exp.split(',');
                const empresa = partes[0] || '';
                const tiempo = partes[1] || '';
                const cargo = partes[2] || '';
                const descripcion = partes.slice(3).join(',') || '';
                const jobDiv = doc.createElement('div');
                jobDiv.className = 'job';
                jobDiv.innerHTML = `<h3>Cargo: ${cargo} | Empresa: ${empresa} | Tiempo: ${tiempo}</h3>
                    <p><strong>Descripción del cargo</strong></p>
                    <p>${descripcion}</p>`;
                expDiv.appendChild(jobDiv);
            });
        }
    }

    // Referencias
    const refDiv = doc.getElementById('clasico-referencias');
    if (refDiv) {
        refDiv.innerHTML = '';
        if (data.referencias && data.referencias !== "No") {
            data.referencias.split(';').forEach(ref => {
                const partes = ref.split(',');
                const nombre = partes[0] || '';
                const telefono = partes[1] || '';
                const profesion = partes[2] || '';
                const email = partes.slice(3).join(',') || '';
                const refItem = doc.createElement('div');
                refItem.className = 'reference';
                refItem.innerHTML = `<strong>${nombre}</strong><br>
                    <span>${profesion} / ${telefono}</span><br>
                    <span>${email}</span>`;
                refDiv.appendChild(refItem);
            });
        }
    }

    // Idiomas (agrega al final de la sección de formación académica)
    if (data.habilidades && data.habilidades.idiomas) {
        let idiomasHtml = "<div><strong>Idiomas:</strong> ";
        idiomasHtml += data.habilidades.idiomas.split(';').map(idioma => {
            const partes = idioma.split(',');
            return partes[0] ? `${partes[0]} (${partes[1] || ''})` : '';
        }).filter(Boolean).join(', ');
        idiomasHtml += "</div>";
        if (formacionSection) formacionSection.innerHTML += idiomasHtml;
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
    doc.getElementById('actual-sobremi').textContent = data.perfil || '';

    // Experiencia
    const expDiv = doc.getElementById('actual-experiencias');
    expDiv.innerHTML = '';
    if (data.habilidades.experiencia && data.habilidades.experiencia !== "No") {
        data.habilidades.experiencia.split(';').forEach(exp => {
            const partes = exp.split(',');
            const empresa = partes[0] || '';
            const tiempo = partes[1] || '';
            const cargo = partes[2] || '';
            const descripcion = partes.slice(3).join(',') || '';
            const jobDiv = doc.createElement('div');
            jobDiv.className = 'job';
            jobDiv.innerHTML = `<h3>${cargo} | ${empresa}</h3>
                <p>${descripcion}</p>`;
            expDiv.appendChild(jobDiv);
        });
    }

    // Educación
    const eduDiv = doc.getElementById('actual-educacion');
    eduDiv.innerHTML = '';
    if (data.habilidades.educacion) {
        data.habilidades.educacion.split(';').forEach(estudio => {
            const partes = estudio.split(',');
            const nivel = partes[0] || '';
            const titulo = partes[1] || '';
            const institucion = partes[2] || '';
            const ano = partes.slice(3).join(',') || '';
            const eduItem = doc.createElement('div');
            eduItem.className = 'education-item';
            eduItem.innerHTML = `<h3>${titulo}</h3>
                <p>${institucion} - ${ano}</p>`;
            eduDiv.appendChild(eduItem);
        });
    }

    // Habilidades
    const skillDiv = doc.getElementById('actual-habilidades');
    skillDiv.innerHTML = '';
    if (data.habilidades.habilidad && data.habilidades.habilidad) {
        data.habilidades.habilidad.split(',').forEach(skill => {
            const span = doc.createElement('span');
            span.textContent = skill.trim();
            skillDiv.appendChild(span);
        });
    }

    // Idiomas
    const idiomasDiv = doc.getElementById('actual-idiomas');
    idiomasDiv.innerHTML = '';
    if (data.habilidades.idiomas) {
        data.habilidades.idiomas.split(';').forEach(idioma => {
            const partes = idioma.split(',');
            const nombre = partes[0] || '';
            const nivel = partes.slice(1).join(',') || '';
            const p = doc.createElement('p');
            p.textContent = `${nombre} - ${nivel}`;
            idiomasDiv.appendChild(p);
        });
    }

    // Referencias
    const refDiv = doc.getElementById('actual-referencias');
    refDiv.innerHTML = '';
    if (data.referencias && data.referencias !== "No") {
        data.referencias.split(';').forEach(ref => {
            const partes = ref.split(',');
            const nombre = partes[0] || '';
            const telefono = partes[1] || '';
            const profesion = partes[2] || '';
            const email = partes.slice(3).join(',') || '';
            const refItem = doc.createElement('div');
            refItem.className = 'reference';
            refItem.innerHTML = `<strong>${nombre}</strong><br>
                <span>${profesion} / ${telefono}</span><br>
                <span>${email}</span>`;
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
        
        codigosTelefonicos = lineas.slice(1).map(linea => {
            const columnas = linea.split(',');
            // Manejar comillas en los valores
            const nombre = columnas[nombreIndex].replace(/"/g, '').trim();
            let phoneCode = columnas[phoneCodeIndex].replace(/"/g, '').trim();
            
            phoneCode = phoneCode.replace(/\s/g, ''); // Eliminar espacios
            if (phoneCode && !phoneCode.startsWith('+')) {
                phoneCode = '+' + phoneCode;
            }
            
            return { nombre, phoneCode };
        }).filter(pais => pais.phoneCode); // Filtrar países sin código
    } catch (error) {
        console.error('Error al cargar códigos telefónicos:', error);
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
                <input type="number" class="form-control ano-estudio" name="anoEstudio[]" placeholder="Año" min="1965" max="2025">
                <label class="form-label">&nbsp;</label>
                <button type="button" class="btn btn-danger btn-sm remove-estudio"><i class="bi bi-dash"></i></button>
            </div>
        </div>
        </div>
    `;
    
    container.appendChild(newItem);
    estudiosCount++;

    const tituloInput = newItem.querySelector('.titulo-estudio');
    const institucionInput = newItem.querySelector('.institucion-estudio');
    
    if (tituloInput) {
        tituloInput.addEventListener('blur', function() {
            validarTituloEstudio(this);
        });
    }
    if (institucionInput) {
        institucionInput.addEventListener('blur', function() {
            validarInstitucionEstudio(this);
        });
    }
    
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

// Inicializar funcionalidad de teléfono internacional
function inicializarTelefonoIntl(id) {
    if (!id) id = 'telefono';
    const input = document.getElementById(id);
    if (!input) return;

    if (!input.classList.contains('iti-initialized')) {
        window.intlTelInput(input, {
            initialCountry: "co",
            preferredCountries: ["co", "us", "mx", "es", "ar", "gb", "de"],
            geoIpLookup: function(callback) {
                fetch("https://ipapi.co/json")
                    .then(res => res.json())
                    .then(data => callback(data.country_code))
                    .catch(() => callback("us"));
            },
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js"
        });
        input.classList.add('iti-initialized');
    }

    input.addEventListener("blur", function() {
    const iti = window.intlTelInputGlobals.getInstance(input);
    if (iti.isValidNumber()) {
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
    } else {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        mostrarNotificacion("Número de teléfono no válido para el país seleccionado.", "error", 4);
    }
});
}

function obtenerTelefonoParaBackend() {
    const telefonoInput = document.getElementById('telefono');
    if (!telefonoInput) return '';
    const iti = window.intlTelInputGlobals.getInstance(telefonoInput);
    return iti.getNumber();
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
    console.log(cvDataList);
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Error al cargar el CV");
        const cv = await response.json();
        
        const cvIdInput = document.getElementById('cvId');
        if (cvIdInput) cvIdInput.value = cv.id;
        
        // Llenar campos básicos
        document.getElementById("nombre").value = cv.nombre || "";
        document.getElementById("email").value = cv.email || "";
        // Establecer el teléfono en el input usando intl-tel-input
        if (cv.telefono) {
            const telefonoInput = document.getElementById("telefono");
            if (telefonoInput) {
            // Usar intl-tel-input para establecer el número completo
            const iti = window.intlTelInputGlobals.getInstance(telefonoInput);
            if (iti) {
                iti.setNumber(cv.telefono);
            } else {
                telefonoInput.value = cv.telefono;
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
        document.getElementById("sobremi").value = cv.perfil || "";
        
        // Habilidades
        if (cv.habilidades && cv.habilidades.habilidad) {
            const habilidades = cv.habilidades.habilidad.split(', ');
            const habilidadesSelect = document.getElementById('habilidades-select');
            Array.from(habilidadesSelect.options).forEach(option => {
                option.selected = habilidades.includes(option.value);
            });
        }

        // Estudios
        if (cv.habilidades && cv.habilidades.educacion) {
            establecerEstudios(cv.habilidades.educacion);
        }

        // Experiencias
        if (cv.habilidades && cv.habilidades.experiencia && cv.habilidades.experiencia !== "No") {
            establecerExperiencias(cv.habilidades.experiencia);
        } else {
            document.getElementById('sin-experiencia').checked = true;
            document.getElementById('objetivo-sin-experiencia').value = cv.objetivo || '';
        }

        // Idiomas
        if (cv.habilidades && cv.habilidades.idiomas) {
            establecerIdiomas(cv.habilidades.idiomas);
        }

        // Referencias
        if (cv.referencias && cv.referencias !== "No") {
            establecerReferencias(cv.referencias);
        } else {
            document.getElementById('sin-referencias').checked = true;
        }
        
        // Establecer foto
        if (cv.foto) {
            const fotoPreview = document.querySelector('.foto-preview');
            if (fotoPreview) {
                fotoPreview.src = cv.foto;
                fotoPreview.style.display = 'block';
            }
        } else {
            const fotoPreview = document.querySelector('.foto-preview');
            if (fotoPreview) {
                fotoPreview.src = '';
                fotoPreview.style.display = 'none';
            }
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

function establecerEstudios(estudiosStr) {
    if (!estudiosStr) return;
    const estudios = estudiosStr.split(';');
    estudiosCount = 0;
    const container = document.getElementById('estudios-container');
    if (!container) return;
    container.innerHTML = '';
    estudios.forEach((estudio, index) => {
        if (index < MAX_ESTUDIOS) {
            const partes = estudio.split(',');
            const nivel = partes[0] || '';
            const titulo = partes[1] || '';
            const institucion = partes[2] || '';
            const ano = partes.slice(3).join(',') || '';
            agregarEstudio();
            const items = container.querySelectorAll('.estudio-item');
            const item = items[index];
            if (item) {
                item.querySelector('.nivel-estudio').value = nivel;
                item.querySelector('.titulo-estudio').value = titulo;
                item.querySelector('.institucion-estudio').value = institucion;
                item.querySelector('.ano-estudio').value = ano;
            }
        }
    });
}

function establecerExperiencias(experienciasStr) {
    if (!experienciasStr) return;
    const experiencias = experienciasStr.split(';');
    experienciasCount = 0;
    const container = document.getElementById('experiencias-container');
    if (!container) return;
    container.innerHTML = '';
    experiencias.forEach((experiencia, index) => {
        if (index < MAX_EXPERIENCIAS) {
            const partes = experiencia.split(',');
            const empresa = partes[0] || '';
            const tiempo = partes[1] || '';
            const cargo = partes[2] || '';
            const descripcion = partes.slice(3).join(',') || '';
            agregarExperiencia();
            const items = container.querySelectorAll('.experiencia-item');
            const item = items[index];
            if (item) {
                item.querySelector('.empresa').value = empresa;
                item.querySelector('.tiempo').value = tiempo;
                item.querySelector('.cargo').value = cargo;
                item.querySelector('.descripcion').value = descripcion;
            }
        }
    });
}

function establecerIdiomas(idiomasStr) {
    if (!idiomasStr) return;
    const idiomas = idiomasStr.split(';');
    idiomasCount = 0;
    const container = document.getElementById('idiomas-container');
    if (!container) return;
    container.innerHTML = '';
    idiomas.forEach((idioma, index) => {
        if (index < MAX_IDIOMAS) {
            const partes = idioma.split(',');
            const nombre = partes[0] || '';
            const nivel = partes.slice(1).join(',') || '';
            agregarIdioma();
            const items = container.querySelectorAll('.idioma-item');
            const item = items[index];
            if (item) {
                item.querySelector('.idioma').value = nombre;
                item.querySelector('.nivel-idioma').value = nivel;
            }
        }
    });
}

function establecerReferencias(referenciasStr) {
    if (!referenciasStr || referenciasStr === "No") return;
    const referencias = referenciasStr.split(';');
    referenciasCount = 0;
    const container = document.getElementById('referencias-container');
    if (!container) return;
    container.innerHTML = '';
    referencias.forEach((referencia, index) => {
        if (index < MAX_REFERENCIAS) {
            const partes = referencia.split(',');
            const nombre = partes[0] || '';
            const telefono = partes[1] || '';
            const profesion = partes[2] || '';
            const email = partes.slice(3).join(',') || '';
            agregarReferencia();
            const items = container.querySelectorAll('.referencia-item');
            const item = items[index];
            if (item) {
                item.querySelector('.referencia-nombre').value = nombre;
                item.querySelector('.referencia-telefono').value = telefono;
                item.querySelector('.referencia-profesion').value = profesion;
                item.querySelector('.referencia-email').value = email;
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

