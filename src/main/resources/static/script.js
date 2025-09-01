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
                <td>${cv.ciudad}</td>
                <td>${cv.direccion}</td>
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
    }
}

// Guardar o actualizar CV
cvForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cvData = {
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        telefono: document.getElementById("telefono").value,
        ciudad: document.getElementById("ciudad").value,
        direccion: document.getElementById("direccion").value,
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
            alert("CV actualizado correctamente");
        } else {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cvData)
            });
            alert("CV guardado correctamente");
        }

        cvForm.reset();
        cvIdInput.value = "";
        editando = false;
        guardarBtn.textContent = "Guardar";
        cancelarBtn.style.display = "none";
        cargarCVs();
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar el CV.");
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
        document.getElementById("ciudad").value = cv.ciudad;
        document.getElementById("direccion").value = cv.direccion || "";
        document.getElementById("habilidad").value = cv.habilidades.habilidad || "";
        document.getElementById("experiencia").value = cv.habilidades.experiencia || "";
        document.getElementById("educacion").value = cv.habilidades.educacion || "";
        document.getElementById("idiomas").value = cv.habilidades.idiomas || "";
        editando = true;
        guardarBtn.textContent = "Actualizar";
        cancelarBtn.style.display = "inline-block";
    } catch (error) {
        console.error(error);
        alert("Error al cargar el CV.");
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
    if (confirm("¿Seguro que deseas eliminar este CV?")) {
        try {
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            alert("CV eliminado correctamente");
            cargarCVs();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el CV.");
        }
    }
}

cargarCVs();
