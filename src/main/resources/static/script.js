const API_URL = "http://localhost:8080/api/cv";

const form = document.getElementById("cvForm");
const cvIdInput = document.getElementById("cvId");
const nombreInput = document.getElementById("nombre");
const emailInput = document.getElementById("email");
const telefonoInput = document.getElementById("telefono");
const ciudadInput = document.getElementById("ciudad");
const habilidadesInput = document.getElementById("habilidades");
const cancelarBtn = document.getElementById("btncancelar");
const guardarBtn = document.getElementById("btnguardar");
const listaCVs = document.getElementById("listaCVs");

let editando = false; // estado para saber si estamos editando

// Cargar todos los CVs
async function cargarCVs() {
    const response = await fetch(API_URL);
    const data = await response.json();

    listaCVs.innerHTML = "";
    data.forEach(cv => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${cv.id}</td>
            <td>${cv.nombre}</td>
            <td>${cv.email}</td>
            <td>${cv.telefono}</td>
            <td>${cv.ciudad}</td>
            <td>${cv.habilidades}</td>
            <td>
                <button onclick="editarCV(${cv.id})">Editar</button>
                <button onclick="eliminarCV(${cv.id})">Eliminar</button>
            </td>
        `;
        listaCVs.appendChild(row);
    });
}

// Guardar o actualizar CV
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cvData = {
        nombre: nombreInput.value,
        email: emailInput.value,
        telefono: telefonoInput.value,
        ciudad: ciudadInput.value,
        habilidades: [habilidadesInput.value]
    };

    if (editando) {
        // Modo edición → PUT
        const id = cvIdInput.value;
        await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cvData)
        });
        alert("CV actualizado correctamente");
    } else {
        // Modo creación → POST
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cvData)
        });
        alert("CV creado correctamente");
    }

    resetForm();
    cargarCVs();
});

// Editar CV
async function editarCV(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("No se pudo cargar el CV");
        const cv = await response.json();

        // Llenar formulario con datos del CV
        cvIdInput.value = cv.id;
        nombreInput.value = cv.nombre;
        emailInput.value = cv.email;
        telefonoInput.value = cv.telefono;
        ciudadInput.value = cv.ciudad;
        habilidadesInput.value = cv.habilidades;

        editando = true;
        guardarBtn.textContent = "Actualizar";
        cancelarBtn.style.display = "inline-block";
    } catch (error) {
        alert(`Error al cargar el CV: ${error.message}`);
    }
}

// Eliminar CV
async function eliminarCV(id) {
    if (confirm("¿Seguro que deseas eliminar este CV?")) {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        alert("CV eliminado correctamente");
        cargarCVs();
    }
}

// Cancelar edición
cancelarBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetForm();
});

function resetForm() {
    form.reset();
    cvIdInput.value = "";
    editando = false;
    guardarBtn.textContent = "Guardar";
    cancelarBtn.style.display = "none";
}

cargarCVs();
