// ===============================
// Triaje: Registro y Asignación
// ===============================

// Conexión al socket
const token = localStorage.getItem("token");
const socket = io({ auth: { token } });

// ===============================
// Función Toasts
// ===============================
function pushToast(msg, type = "info") {
  const cont = document.getElementById("toast-container");
  if (!cont) return;
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = msg;
  cont.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function toastOk(msg) { pushToast(msg, "ok"); }
function toastWarn(msg) { pushToast(msg, "warn"); }
function toastErr(msg) { pushToast(msg, "err"); }

// ===============================
// ELEMENTOS DOM
// ===============================
const pacienteForm = document.getElementById("pacienteForm");
const turnoForm = document.getElementById("turnoForm");
const selectPacientes = document.getElementById("t_paciente");
const selectClinicas = document.getElementById("t_clinica");

// ===============================
// CARGAR CLÍNICAS Y PACIENTES
// ===============================
function cargarClinicas() {
  socket.emit("clinicas:list", (res) => {
    if (res?.ok) {
      selectClinicas.innerHTML = "";
      if (res.data.length === 0)
        selectClinicas.innerHTML = "<option disabled>(Sin clínicas)</option>";
      else
        res.data.forEach(c =>
          selectClinicas.innerHTML += `<option value="${c.id}">${c.nombre}</option>`
        );
    } else {
      toastErr(res?.message || "Error al cargar clínicas.");
    }
  });
}

function cargarPacientes() {
  socket.emit("pacientes:list", (res) => {
    if (res?.ok) {
      selectPacientes.innerHTML = "";
      if (res.data.length === 0)
        selectPacientes.innerHTML = "<option disabled>(Sin pacientes disponibles)</option>";
      else
        res.data.forEach(p =>
          selectPacientes.innerHTML += `<option value="${p.id}">${p.nombre}</option>`
        );
    } else {
      toastErr(res?.message || "Error al cargar pacientes.");
    }
  });
}

// ===============================
// FORMULARIO: NUEVO PACIENTE
// ===============================
pacienteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("p_nombre").value.trim();
  const edad = document.getElementById("p_edad").value.trim();
  const sintomas = document.getElementById("p_sintomas").value.trim();

  if (!nombre || !edad || !sintomas)
    return toastWarn("Completa todos los campos.");

  socket.emit("paciente:create", { nombre, edad, sintomas }, (res) => {
    if (res?.ok) {
      if (res.updated) {
        // Si fue reactivado o actualizado
        toastWarn(res.message || "Paciente reactivado correctamente");
      } else if (res.created) {
        // Si fue nuevo
        toastOk(res.message || "Paciente registrado correctamente");
      } else {
        // fallback si viene ok pero sin flags
        toastOk("Paciente procesado correctamente");
      }
      pacienteForm.reset();
      cargarPacientes();
    } else {
      toastErr(res?.message || "Error al guardar paciente.");
    }
  });
});

// ===============================
// FORMULARIO: CREAR TURNO
// ===============================
turnoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const paciente_id = selectPacientes.value;
  const clinica_id = selectClinicas.value;

  if (!paciente_id || !clinica_id)
    return toastWarn("Selecciona paciente y clínica.");

  socket.emit("turno:create", { paciente_id, clinica_id }, (res) => {
    if (res?.ok) {
      toastOk(`Turno creado correctamente (Ticket ${res.ticket})`);
      turnoForm.reset();
      cargarPacientes();
    } else {
      toastErr(res?.message || "Error al crear turno.");
    }
  });
});

// ===============================
// EVENTOS SOCKET
// ===============================
socket.on("connect", () => {
  cargarClinicas();
  cargarPacientes();
});

socket.on("turnos:changed", () => {
  cargarPacientes();
});

// ===============================
// LOGOUT
// ===============================
document.getElementById("logout").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "login.html";
});
