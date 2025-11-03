// ===============================
// Conexión con backend (Socket.IO)
// ===============================
const socket = io("http://89.38.131.107:3000", {
  auth: { token: localStorage.getItem("token") }
});

// ===============================
// Renderización de turnos
// ===============================
function renderTurnos(turnos, contenedor) {
  contenedor.innerHTML = "";
  if (!turnos.length) {
    contenedor.innerHTML = `<p class="muted">Sin pacientes</p>`;
    return;
  }

  turnos.forEach(t => {
    const div = document.createElement("div");
    div.className = "ticket";
    div.innerHTML = `
      <h3>${t.paciente}</h3>
      <p>${t.clinica}</p>
      <p class="ticket-num">Ticket: <strong>${t.ticket || "-"}</strong></p>
    `;
    contenedor.appendChild(div);
  });
}

// ===============================
// Cargar listas desde backend
// ===============================
function cargarTurnos() {
  // En espera
  socket.emit("turnos:list", "En espera", (res) => {
    if (res.ok) renderTurnos(res.data, document.getElementById("en-espera"));
  });

  // En consulta (Llamado)
  socket.emit("turnos:list", "Llamado", (res) => {
    if (res.ok) renderTurnos(res.data, document.getElementById("en-consulta"));
  });
}

// ===============================
// Eventos de conexión y actualización
// ===============================
socket.on("connect", () => {
  console.log("✅ Conectado al servidor de turnos");
  cargarTurnos();
});

socket.on("turnos:changed", () => {
  console.log("🔄 Actualización recibida — recargando turnos");
  cargarTurnos();
});
