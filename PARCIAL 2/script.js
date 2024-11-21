// Elementos del DOM
const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

// URL del endpoint de MockAPI
export const URL = 'https://66f5eb01436827ced97571c7.mockapi.io/tareas';

// Función para formatear fecha timestamp a formato legible
function formatearFecha(timestamp) {
    return new Date(timestamp).toLocaleString();
}

// Función para agregar nueva tarea
async function addTask() {
    if (inputBox.value === '') {
        alert("¡Debes escribir algo!");
        return;
    }

    try {
        // Crear objeto de nueva tarea
        const nuevaTarea = {
            titulo: inputBox.value,
            descripcion: "Nueva tarea",
            estado: "pendiente",
            fechacreacion: Date.now(),
            fechaconclusion: null
        };

        // Enviar tarea a MockAPI
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaTarea)
        });

        if (!response.ok) throw new Error('Error al crear la tarea');

        const tareaCreada = await response.json();
        agregarTareaAlDOM(tareaCreada);
        inputBox.value = "";
        
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo crear la tarea');
    }
}

// Función para crear elemento de tarea en el DOM
function agregarTareaAlDOM(tarea) {
    const li = document.createElement("li");
    li.setAttribute('data-id', tarea.id);
    li.innerHTML = `
        <div class="tarea-contenido">
            <p class="tarea-titulo">${tarea.titulo}</p>
            <small class="tarea-fecha">Creada: ${formatearFecha(tarea.fechacreacion)}</small>
        </div>
        <div class="tarea-acciones">
            <button class="btn-play" onclick="reproducirTarea('${tarea.id}')">▶️</button>
            <span class="btn-eliminar">\u00d7</span>
        </div>
    `;

    if (tarea.estado === 'finalizada') {
        li.classList.add('checked');
    }

    listContainer.appendChild(li);
}

// Event listener para manejar clics en las tareas
listContainer.addEventListener("click", async function(e) {
    const li = e.target.closest('li');
    if (!li) return;

    const tareaId = li.getAttribute('data-id');

    if (e.target.classList.contains('btn-eliminar')) {
        try {
            const response = await fetch(`${URL}/${tareaId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar la tarea');
            li.remove();

        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo eliminar la tarea');
        }
    } 
    else if (e.target.classList.contains('btn-play')) {
        reproducirTarea(tareaId);
    }
    else if (e.target.tagName === "LI" || e.target.closest('.tarea-contenido')) {
        try {
            const nuevoEstado = li.classList.contains('checked') ? 'pendiente' : 'finalizada';
            
            const response = await fetch(`${URL}/${tareaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: nuevoEstado,
                    fechaconclusion: nuevoEstado === 'finalizada' ? Date.now() : null
                })
            });

            if (!response.ok) throw new Error('Error al actualizar la tarea');
            li.classList.toggle("checked");

        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo actualizar el estado de la tarea');
        }
    }
});

// Función para reproducir tarea en audio
function reproducirTarea(tareaId) {
    fetch(`${URL}/${tareaId}`)
        .then(response => response.json())
        .then(tarea => {
            const speech = new SpeechSynthesisUtterance();
            speech.text = `Tarea: ${tarea.titulo}. Descripción: ${tarea.descripcion}`;
            speech.lang = 'es-ES';
            window.speechSynthesis.speak(speech);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('No se pudo reproducir la tarea');
        });
}

// Función para cargar tareas iniciales
async function cargarTareas() {
    try {
        const response = await fetch(URL);
        if (!response.ok) throw new Error('Error al cargar las tareas');

        const tareas = await response.json();
        
        // Ordenar tareas (no finalizadas primero, luego por fecha descendente)
        tareas.sort((a, b) => {
            if (a.estado === 'finalizada' && b.estado !== 'finalizada') return 1;
            if (a.estado !== 'finalizada' && b.estado === 'finalizada') return -1;
            return b.fechacreacion - a.fechacreacion;
        });

        // Limpiar contenedor
        listContainer.innerHTML = '';
        
        // Agregar cada tarea al DOM
        tareas.forEach(tarea => agregarTareaAlDOM(tarea));

    } catch (error) {
        console.error('Error:', error);
        listContainer.innerHTML = '<p class="error">Error al cargar las tareas</p>';
    }
}

// Cargar tareas al iniciar la aplicación
document.addEventListener('DOMContentLoaded', cargarTareas);