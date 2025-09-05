// Variables globales
let selectedTemplate = "";
let cvDataList = [];
let listaPaises = [];
let listaCiudades = [];
let codigosTelefonicos = [];
let estudiosCount = 1;
const MAX_ESTUDIOS = 5;
const API_URL = "http://localhost:8080/api/cv";
let editando = false;

// Reemplazo de alert y confirm por alertify
function mostrarNotificacion(mensaje, tipo = 'success') {
    if (tipo === 'error') {
        alertify.error(mensaje);
    } else {
        alertify.success(mensaje);
    }
}

function mostrarConfirmacion(mensaje, callback) {
    alertify.confirm(mensaje, function () {
        callback(true);
    }, function () {
        callback(false);
    });
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarCVs();
    inicializarDireccion();
    inicializarEstudios();
    cargarCodigosTelefonicos();
    inicializarSelectorPlantillas();
    
    // Cargar datos iniciales de ciudades y países
    cargarCSV('paises.csv', 'nombre')
        .then(data => {
            listaPaises = data;
            llenarDatalist('paises', listaPaises);
            validarEntrada('pais', listaPaises);
        })
        .catch(err => console.log("Error cargando países:", err));

    cargarCSV('ciudad.csv', 'name')
        .then(data => {
            listaCiudades = data;
            llenarDatalist('ciudades', listaCiudades);
            validarEntrada('ciudad', listaCiudades);
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
});

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

// Validar formulario para vista previa (menos estricto que para guardar)
function validarFormularioParaVistaPrevia() {
    const nombre = document.getElementById("nombre")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    
    return nombre && email; // Solo requerimos nombre y email para vista previa
}

// Obtener datos del formulario para la vista previa
function obtenerDatosFormulario() {
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
        habilidades: {
            habilidad: document.getElementById("habilidad").value,
            experiencia: document.getElementById("experiencia").value,
            educacion: obtenerEstudios(),
            idiomas: document.getElementById("idiomas").value
        }
    };
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
        console.error("Error rellenando plantilla:", e);
    }
}

// Funciones específicas para cada plantilla
function rellenarPlantillaAntigua(doc, data) {
    // Rellenar datos personales en la tabla
    const tablaDatos = doc.querySelector('.container table');
    if (tablaDatos) {
        const celdas = tablaDatos.querySelectorAll('.input');
        
        // Nombre completo
        if (celdas[0]) celdas[0].textContent = data.nombre || '';
        
        // Documento de identificación
        if (data.tipoiden && data.numeroiden && celdas[1]) {
            celdas[1].textContent = `${data.tipoiden}: ${data.numeroiden}`;
        }
        
        // Género
        if (celdas[2]) celdas[2].textContent = data.genero || '';
        
        // Nacionalidad
        if (celdas[3]) celdas[3].textContent = data.nacionalidad || '';
        
        // País
        if (celdas[4]) celdas[4].textContent = data.nacionalidad || ''; // Usar nacionalidad como país
        
        // Fecha de nacimiento
        if (data.fechanac && celdas[5]) {
            celdas[5].textContent = new Date(data.fechanac).toLocaleDateString();
        }
        
        // Dirección
        if (celdas[6]) celdas[6].textContent = data.direccion || '';
        
        // Teléfono
        if (celdas[7]) celdas[7].textContent = data.telefono || '';
        
        // Email
        if (celdas[8]) celdas[8].textContent = data.email || '';
    }

    // Formación académica
    const tablaFormacion = doc.querySelectorAll('.container table')[1];
    if (tablaFormacion && data.habilidades && data.habilidades.educacion) {
        const estudios = data.habilidades.educacion.split('.');
        const filas = tablaFormacion.querySelectorAll('tr');
        
        // Empezar desde la segunda fila (índice 1) porque la primera es el encabezado
        for (let i = 1; i < filas.length && i - 1 < estudios.length; i++) {
            const [nivel, titulo] = estudios[i - 1].split(',');
            const celdas = filas[i].querySelectorAll('td');
            
            if (celdas[0]) celdas[0].textContent = nivel || '';
            if (celdas[1]) celdas[1].textContent = titulo || '';
        }
    }

    // Experiencia laboral
    const tablaExperiencia = doc.querySelectorAll('.container table')[2];
    if (tablaExperiencia && data.habilidades && data.habilidades.experiencia) {
        const expLines = data.habilidades.experiencia.split('\n');
        const filas = tablaExperiencia.querySelectorAll('tr');
        
        // Empezar desde la segunda fila (índice 1) porque la primera es el encabezado
        for (let i = 1; i < filas.length && i - 1 < expLines.length; i++) {
            const experiencia = expLines[i - 1];
            const celdas = filas[i].querySelectorAll('td');
            
            if (celdas[0]) celdas[0].textContent = experiencia || '';
            
            // Intentar extraer tiempo y cargo si está en un formato específico
            if (experiencia.includes('|')) {
                const partes = experiencia.split('|');
                if (partes.length >= 3) {
                    if (celdas[0]) celdas[0].textContent = partes[0].trim(); // Empresa
                    if (celdas[1]) celdas[1].textContent = partes[1].trim(); // Tiempo
                    if (celdas[2]) celdas[2].textContent = partes[2].trim(); // Cargo
                }
            }
        }
    }
}

function rellenarPlantillaClasico(doc, data) {
    // Encabezado con nombre
    const nombreElement = doc.getElementById('nombre');
    if (nombreElement) nombreElement.textContent = data.nombre || 'NOMBRE COMPLETO';
    
    // Datos personales
    if (data.tipoiden && data.numeroiden) {
        const docElement = doc.getElementById('documento');
        if (docElement) docElement.textContent = `${data.tipoiden}: ${data.numeroiden}`;
    }
    
    if (data.fechanac) {
        const fechaElement = doc.getElementById('nacimiento');
        if (fechaElement) fechaElement.textContent = new Date(data.fechanac).toLocaleDateString();
    }
    
    const lugarElement = doc.getElementById('lugar');
    if (lugarElement) lugarElement.textContent = data.ciudad || 'Ciudad';
    
    const estadoElement = doc.getElementById('estado');
    if (estadoElement) estadoElement.textContent = data.estadocivil || 'No especificado';
    
    const direccionElement = doc.getElementById('direccion');
    if (direccionElement) direccionElement.textContent = data.direccion || 'Dirección no especificada';
    
    if (data.telefono) {
        const telefonoElement = doc.getElementById('celular');
        if (telefonoElement) telefonoElement.textContent = data.telefono;
    }
    
    const emailElement = doc.getElementById('email');
    if (emailElement) emailElement.textContent = data.email || 'correo@ejemplo.com';
    
    // Formación académica
    if (data.habilidades && data.habilidades.educacion) {
        const estudios = data.habilidades.educacion.split('.');
        if (estudios.length > 0) {
            const profesionalElement = doc.getElementById('profesional');
            if (profesionalElement) profesionalElement.textContent = estudios[0].replace(',', ' - ');
        }
        if (estudios.length > 1) {
            const tecnicoElement = doc.getElementById('tecnico');
            if (tecnicoElement) tecnicoElement.textContent = estudios[1].replace(',', ' - ');
        }
    }
    
    // Experiencia laboral
    if (data.habilidades && data.habilidades.experiencia) {
        const expLines = data.habilidades.experiencia.split('\n');
        if (expLines.length > 0) {
            const puestoElement = doc.getElementById('puesto1');
            if (puestoElement) puestoElement.textContent = expLines[0];
            
            const descElement = doc.getElementById('desc1');
            if (descElement) descElement.textContent = expLines.slice(1).join(' ');
        }
    }
}

function rellenarPlantillaActual(doc, data) {
    // Panel izquierdo
    const emailElement = doc.getElementById('email');
    if (emailElement) emailElement.textContent = data.email || '';
    
    const telefonoElement = doc.getElementById('telefono');
    if (telefonoElement) telefonoElement.textContent = data.telefono || '';
    
    const direccionElement = doc.getElementById('direccion');
    if (direccionElement) direccionElement.textContent = data.direccion || '';
    
    const ciudadElement = doc.getElementById('ciudad');
    if (ciudadElement) ciudadElement.textContent = data.ciudad || '';
    
    if (data.habilidades) {
        const habilidadElement = doc.getElementById('habilidad');
        if (habilidadElement) habilidadElement.textContent = data.habilidades.habilidad || '';
        
        const objetivoElement = doc.getElementById('objetivo');
        if (objetivoElement) objetivoElement.textContent = data.objetivo || '';
    }
    
    // Panel derecho
    const nombreElement = doc.getElementById('nombre');
    if (nombreElement) nombreElement.textContent = data.nombre || 'Nombre Apellido';
    
    const ocupacionElement = doc.getElementById('ocupacion');
    if (ocupacionElement) ocupacionElement.textContent = data.puesto || 'Cargo Profesional';
    
    if (data.habilidades) {
        const idiomasElement = doc.getElementById('idiomas');
        if (idiomasElement) idiomasElement.textContent = data.habilidades.idiomas || '';
        
        // Educación
        if (data.habilidades.educacion) {
            const estudios = data.habilidades.educacion.split('.').map(est => {
                const [nivel, titulo] = est.split(',');
                return `${nivel}: ${titulo}`;
            }).join('\n');
            
            const educacionElement = doc.getElementById('educacion');
            if (educacionElement) educacionElement.textContent = estudios;
        }
        
        const experienciaElement = doc.getElementById('experiencia');
        if (experienciaElement) experienciaElement.textContent = data.habilidades.experiencia || '';
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
}

// Cargar códigos telefónicos desde el CSV
async function cargarCodigosTelefonicos() {
    try {
        const response = await fetch('paises.csv');
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
        option.textContent = `${pais.phoneCode} (${pais.nombre})`;
        
        // Seleccionar Colombia por defecto
        if (pais.nombre === "Colombia") {
            option.selected = true;
        }
        
        select.appendChild(option);
    });
    
    // Inicializar funcionalidad de teléfono después de cargar los códigos
    inicializarTelefono();
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
    
    // Mostrar botón de agregar en el primer estudio
    const firstAddBtn = document.querySelector('.add-estudio');
    if (firstAddBtn) {
        firstAddBtn.style.display = 'block';
        firstAddBtn.addEventListener('click', agregarEstudio);
    }
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
        <div class="col-md-4">
            <select class="form-select nivel-estudio" name="nivelEstudio[]">
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
                <option value="Otro">Otro</option>
            </select>
        </div>
        <div class="col-md-7">
            <input type="text" class="form-control titulo-estudio" name="tituloEstudio[]" placeholder="Título obtenido">
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-danger btn-sm remove-estudio"><i class="bi bi-dash"></i></button>
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
            
            // Si solo queda uno, mostrar el botón de agregar en el primero
            if (estudiosCount === 1) {
                const firstAddBtn = document.querySelector('.add-estudio');
                if (firstAddBtn) firstAddBtn.style.display = 'block';
            }
            
            // Mostrar el botón de agregar general si estamos por debajo del máximo
            const addEstudioBtn = document.getElementById("add-estudio-btn");
            if (estudiosCount < MAX_ESTUDIOS && addEstudioBtn) {
                addEstudioBtn.style.display = 'block';
            }
        });
    }
    
    // Ocultar botón de agregar si llegamos al máximo
    const addEstudioBtn = document.getElementById("add-estudio-btn");
    if (estudiosCount >= MAX_ESTUDIOS && addEstudioBtn) {
        addEstudioBtn.style.display = 'none';
    }
}

// Obtener estudios en formato para base de datos
function obtenerEstudios() {
    const niveles = document.querySelectorAll('.nivel-estudio');
    const titulos = document.querySelectorAll('.titulo-estudio');
    let estudios = [];
    
    for (let i = 0; i < niveles.length; i++) {
        if (niveles[i].value && titulos[i].value) {
            estudios.push(`${niveles[i].value},${titulos[i].value}`);
        }
    }
    
    return estudios.join('.');
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
        if (index === 0) {
            // Usar el primer elemento existente
            const [nivel, titulo] = estudio.split(',');
            const nivelSelect = document.querySelector('.nivel-estudio');
            const tituloInput = document.querySelector('.titulo-estudio');
            
            if (nivelSelect && tituloInput) {
                nivelSelect.value = nivel;
                tituloInput.value = titulo;
                estudiosCount++;
            }
        } else if (index < MAX_ESTUDIOS) {
            // Agregar nuevos elementos para los estudios adicionales
            const [nivel, titulo] = estudio.split(',');
            agregarEstudio();
            const nuevosEstudios = document.querySelectorAll('.estudio-item');
            const lastEstudio = nuevosEstudios[nuevosEstudios.length - 1];
            
            if (lastEstudio) {
                const nivelSelect = lastEstudio.querySelector('.nivel-estudio');
                const tituloInput = lastEstudio.querySelector('.titulo-estudio');
                
                if (nivelSelect && tituloInput) {
                    nivelSelect.value = nivel;
                    tituloInput.value = titulo;
                }
            }
        }
    });
}

// Guardar o actualizar CV
async function guardarCV(e) {
    e.preventDefault();

    if (!validarFormulario()) return;

    // Obtener número de teléfono completo
    const codigoPais = document.getElementById("codigoPais");
    const telefonoInput = document.getElementById("telefono");
    
    if (!codigoPais || !telefonoInput) {
        mostrarNotificacion("Error en los campos de teléfono.", "error");
        return;
    }
    
    const telefonoCompleto = codigoPais.value + telefonoInput.value;

    // Obtener estudios
    const estudios = obtenerEstudios();

    // Preparar datos para enviar (asegurando compatibilidad con el backend)
    const cvData = {
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        telefono: telefonoCompleto,
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
        habilidades: {
            habilidad: document.getElementById("habilidad").value,
            experiencia: document.getElementById("experiencia").value,
            educacion: estudios, // Usar la función para obtener estudios
            idiomas: document.getElementById("idiomas").value
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
    const container = document.getElementById('estudios-container');
    if (container) {
        container.innerHTML = `
            <div class="estudio-item row g-2 mb-2">
                <div class="col-md-4">
                    <select class="form-select nivel-estudio" name="nivelEstudio[]">
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
                <div class="col-md-7">
                    <input type="text" class="form-control titulo-estudio" name="tituloEstudio[]" placeholder="Título obtenido">
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-success btn-sm add-estudio" style="display: block;"><i class="bi bi-plus"></i></button>
                </div>
            </div>
        `;
    }
    estudiosCount = 1;
    inicializarEstudios();
    
    const addEstudioBtn = document.getElementById("add-estudio-btn");
    if (addEstudioBtn) addEstudioBtn.style.display = 'block';
    
    cargarCVs();
}

// Editar CV
async function editarCV(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Error al cargar el CV");
        const cv = await response.json();

        const cvIdInput = document.getElementById("cvId");
        if (cvIdInput) cvIdInput.value = cv.id;
        
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
        document.getElementById("habilidad").value = cv.habilidades?.habilidad || "";
        document.getElementById("experiencia").value = cv.habilidades?.experiencia || "";
        
        // Establecer estudios
        if (cv.habilidades?.educacion) {
            establecerEstudios(cv.habilidades.educacion);
        }
        
        document.getElementById("idiomas").value = cv.habilidades?.idiomas || "";
        
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

// --- VALIDACIONES MEJORADAS DE CAMPOS ---
function validarFormulario() {
    let valido = true;
    const errores = [];

    // Validar nombre
    const nombre = document.getElementById("nombre")?.value.trim();
    if (!nombre) {
        errores.push("El nombre no puede estar vacío.");
        valido = false;
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/.test(nombre)) {
        errores.push("El nombre solo puede contener letras, espacios, apóstrofes y tildes.");
        valido = false;
    } else {
        const palabras = nombre.split(/\s+/).filter(p => p.length >= 2);
        if (palabras.length < 2) {
            errores.push("El nombre debe tener al menos dos palabras de mínimo 2 letras cada una.");
            valido = false;
        }
        if (palabras.some(p => /(.)\1\1/.test(p))) {
            errores.push("Las palabras no pueden tener más de dos letras iguales seguidas.");
            valido = false;
        }
        if (nombre.split(/\s+/).length > 5) {
            errores.push("El nombre no puede tener más de 5 palabras.");
            valido = false;
        }
    }

    // Validar email
    const email = document.getElementById("email")?.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
        errores.push("El email no puede estar vacío.");
        valido = false;
    } else if (!emailRegex.test(email) || !(/\.(com|co|gov|org|edu|net|info)$/i.test(email))) {
        errores.push("El correo debe tener un formato válido y terminar en .com, .co, .org, .gov, .edu, .net o .info.");
        valido = false;
    }

    // Validar teléfono
    const codigoPais = document.getElementById("codigoPais")?.value;
    const telefono = document.getElementById("telefono")?.value.trim();
    if (!telefono) {
        errores.push("El teléfono no puede estar vacío.");
        valido = false;
    } else if (!codigoPais) {
        errores.push("Por favor, selecciona un código de país.");
        valido = false;
    } else if (!/^\d{7,15}$/.test(telefono)) {
        errores.push("El número de teléfono debe tener entre 7 y 15 dígitos.");
        valido = false;
    }

    // Validar género
    const genero = document.getElementById("genero")?.value;
    if (!genero) {
        errores.push("Por favor, selecciona un género.");
        valido = false;
    }

    // Validar fecha de nacimiento y mayor de 18 años
    const fechaNac = document.getElementById("fechanac")?.value;
    if (!fechaNac) {
        errores.push("Por favor, selecciona una fecha de nacimiento.");
        valido = false;
    } else {
        const fechaNacimiento = new Date(fechaNac);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
        const mes = hoy.getMonth() - fechaNacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
            edad--;
        }
        
        if (edad < 18) {
            errores.push("Debes tener al menos 18 años para registrar tu CV.");
            valido = false;
        } else if (edad > 70) {
            errores.push("La edad máxima permitida es 70 años.");
            valido = false;
        }
    }

    // Validar tipo de identificación
    const tipoIden = document.getElementById("tipoiden")?.value;
    if (!tipoIden) {
        errores.push("Por favor, selecciona un tipo de documento de identidad.");
        valido = false;
    }

    // Validar número de identificación según el tipo
    const numeroIden = document.getElementById("numeroiden")?.value.trim();
    if (!numeroIden) {
        errores.push("El número de identificación no puede estar vacío.");
        valido = false;
    } else if (!/^\d{6,12}$/.test(numeroIden)) {
        errores.push("El número de identificación debe contener entre 6 y 12 dígitos.");
        valido = false;
    }

    // Validar dirección
    const direccion = document.getElementById("direccion")?.value.trim();
    if (!direccion) {
        errores.push("La dirección no puede estar vacía.");
        valido = false;
    } else if (direccion.length < 10) {
        errores.push("La dirección debe tener al menos 10 caracteres.");
        valido = false;
    }

    // Validar estudios
    const niveles = document.querySelectorAll('.nivel-estudio');
    const titulos = document.querySelectorAll('.titulo-estudio');
    let estudiosValidos = 0;
    
    for (let i = 0; i < niveles.length; i++) {
        if (niveles[i].value && titulos[i].value) {
            estudiosValidos++;
        } else if (niveles[i].value || titulos[i].value) {
            errores.push("Completa ambos campos para cada estudio o elimina los incompletos.");
            valido = false;
            break;
        }
    }
    
    if (estudiosValidos === 0) {
        errores.push("Debe agregar al menos un estudio.");
        valido = false;
    }

    // Validar todos los campos obligatorios vacíos
    const camposObligatorios = [
        "ocupacion", "puesto", "estadocivil", "objetivo",
        "habilidad", "experiencia", "idiomas"
    ];
    
    camposObligatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            const valor = campo.value.trim();
            if (!valor) {
                errores.push(`El campo ${id} no puede estar vacío.`);
                valido = false;
            }
        }
    });

    // Mostrar todos los errores juntos
    if (errores.length > 0) {
        const mensajeError = errores.join('\n• ');
        mostrarNotificacion('Errores de validación:\n• ' + mensajeError, 'error');
    }

    return valido;
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