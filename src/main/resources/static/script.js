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

const API_URL = "http://localhost:8080/api/cv";

const cvForm = document.getElementById("cvForm");
const listaCVs = document.getElementById("listaCVs");
const cvIdInput = document.getElementById("cvId");
const cancelarBtn = document.getElementById("btncancelar");
const guardarBtn = document.getElementById("btnguardar");

let editando = false;

// Cargar lista de CVs
async function cargarCVs() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        listaCVs.innerHTML = "";
        data.forEach(cv => {
            const item = document.createElement("tr");
            item.innerHTML = `
                <td>${cv.id}</td>
                <td>${cv.nombre}</td>
                <td>${cv.email}</td>
                <td>${cv.telefono}</td>
                <td>${cv.tipoiden}</td>
                <td>${cv.numeroiden}</td>
                <td>${cv.fechanac}</td>
                <td>${cv.genero}</td>
                <td>${cv.estadocivil}</td>
                <td>${cv.ciudad}</td>
                <td>${cv.direccion}</td>
                <td>${cv.ocupacion}</td>
                <td>${cv.puesto}</td>
                <td>${cv.nacionalidad}</td>
                <td>${cv.objetivo}</td>
                <td>${cv.habilidades.habilidad}</td>
                <td>${cv.habilidades.experiencia}</td>
                <td>${cv.habilidades.educacion}</td>
                <td>${cv.habilidades.idiomas}</td>
                <td>
                <button onclick="editarCV(${cv.id})">Editar</button>
                <button onclick="eliminarCV(${cv.id})">Eliminar</button>
                </td>
            `;
            listaCVs.appendChild(item);
        });

    } catch (error) {
        console.error("Error al cargar CVs:", error);
        mostrarNotificacion("Error al cargar los CVs.", "error");
    }
}

// Guardar o actualizar CV
cvForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return; // detener si falla validación

    const cvData = {
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        telefono: document.getElementById("telefono").value,
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
            educacion: document.getElementById("educacion").value,
            idiomas: document.getElementById("idiomas").value
        }
    };

    try {
        if (editando) {
            const id = cvIdInput.value;
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cvData)
            });
            mostrarNotificacion("CV actualizado correctamente");
        } else {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cvData)
            });
            mostrarNotificacion("CV guardado correctamente");
        }

        cvForm.reset();
        cvIdInput.value = "";
        editando = false;
        guardarBtn.textContent = "Guardar";
        cancelarBtn.style.display = "none";
        cargarCVs();
    } catch (error) {
        console.error("Error al guardar:", error);
        mostrarNotificacion("Error al guardar el CV.", "error");
    }
});

// Editar CV
async function editarCV(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Error al cargar el CV");
        const cv = await response.json();

        cvIdInput.value = cv.id;
        document.getElementById("nombre").value = cv.nombre;
        document.getElementById("email").value = cv.email;
        document.getElementById("telefono").value = cv.telefono;
        document.getElementById("tipoiden").value = cv.tipoiden;
        document.getElementById("numeroiden").value = cv.numeroiden;
        document.getElementById("fechanac").value = cv.fechanac;
        document.getElementById("genero").value = cv.genero;
        document.getElementById("estadocivil").value = cv.estadocivil;
        document.getElementById("ciudad").value = cv.ciudad;
        document.getElementById("direccion").value = cv.direccion;
        document.getElementById("ocupacion").value = cv.ocupacion;
        document.getElementById("puesto").value = cv.puesto;
        document.getElementById("pais").value = cv.nacionalidad;
        document.getElementById("objetivo").value = cv.objetivo;
        document.getElementById("habilidad").value = cv.habilidades.habilidad;
        document.getElementById("experiencia").value = cv.habilidades.experiencia;
        document.getElementById("educacion").value = cv.habilidades.educacion;
        document.getElementById("idiomas").value = cv.habilidades.idiomas;
        editando = true;
        guardarBtn.textContent = "Actualizar";
        cancelarBtn.style.display = "inline-block";
    } catch (error) {
        console.error(error);
        mostrarNotificacion("Error al cargar el CV.", "error");
    }
}

// Cancelar edición
cancelarBtn.addEventListener("click", () => {
    cvForm.reset();
    cvIdInput.value = "";
    editando = false;
    guardarBtn.textContent = "Guardar";
    cancelarBtn.style.display = "none";
});

// Eliminar CV
async function eliminarCV(id) {
    mostrarConfirmacion("¿Seguro que deseas eliminar este CV?", async (confirmado) => {
        if (confirmado) {
            try {
                await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                mostrarNotificacion("CV eliminado correctamente");
                cargarCVs();
            } catch (error) {
                console.error(error);
                mostrarNotificacion("Error al eliminar el CV.", "error");
            }
        }
    });
}

// --- VALIDACIONES DE CAMPOS ---
function validarFormulario() {
    let valido = true;

    // Validar nombre: solo letras y espacios
    const nombre = document.getElementById("nombre").value.trim();
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
        mostrarNotificacion("El nombre solo puede contener letras, espacios y tildes.", "error");
        valido = false;
    }

    // Validar email
    const email = document.getElementById("email").value.trim();
    if (!/^[^ ]{3,}@[^ ]+\.[a-z]{2,3}$/.test(email)) {
        mostrarNotificacion("El correo debe tener al menos 3 caracteres antes del @ y un formato válido.", "error");
        valido = false;
    }

    // Validar teléfono (solo números, 7-10 dígitos)
    const telefono = document.getElementById("telefono").value.trim();
    if (!/^\d{7,10}$/.test(telefono)) {
        mostrarNotificacion("El teléfono debe tener entre 7 y 10 dígitos.", "error");
        valido = false;
    }

    // Validar género
    if (!document.getElementById("genero").value) {
        mostrarNotificacion("Por favor, selecciona un género.", "error");
        valido = false;
    }

    // Validar fecha de nacimiento
    const fecha = document.getElementById("fechanac").value;
    if (!fecha) {
        mostrarNotificacion("Por favor, selecciona una fecha de nacimiento.", "error");
        valido = false;
    }

    // Validar todos los campos obligatorios vacíos
    const camposObligatorios = [
        "direccion", "ocupacion", "puesto", "estadocivil", "objetivo",
        "habilidad", "experiencia", "educacion", "idiomas", "tipoiden", "numeroiden"
    ];
    camposObligatorios.forEach(id => {
        const valor = document.getElementById(id).value.trim();
        if (!valor) {
            mostrarNotificacion(`El campo ${id} no puede estar vacío.`, "error");
            valido = false;
        }
    });

    return valido;
}

// Cargar datos iniciales de ciudades y países
let listaPaises = [];
let listaCiudades = [];

async function cargarCSV(url, columna) {
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
        return columnas[indice].trim();
    });
}

function llenarDatalist(datalistId, opciones) {
    const datalist = document.getElementById(datalistId);
    datalist.innerHTML = '';
    opciones.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        datalist.appendChild(option);
    });
}

function validarEntrada(inputId, lista) {
    const input = document.getElementById(inputId);
    input.addEventListener('change', () => {
        const valor = input.value.trim().toLowerCase();
        if (!lista.map(v => v.toLowerCase()).includes(valor)) {
            mostrarNotificacion(`Por favor selecciona un valor válido para ${inputId}.`, "error");
        }
    });
}

cargarCSV('pais.csv', 'Name')
    .then(data => {
        listaPaises = data;
        llenarDatalist('paises', listaPaises);
        validarEntrada('pais', listaPaises);
    })
    .catch(err => mostrarNotificacion(err.message, "error"));

cargarCSV('ciudad.csv', 'name')
    .then(data => {
        listaCiudades = data;
        llenarDatalist('ciudades', listaCiudades);
        validarEntrada('ciudad', listaCiudades);
    })
    .catch(err => mostrarNotificacion(err.message, "error"));

cargarCVs();
