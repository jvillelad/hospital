// ======================================
// DASHBOARD MÉDICO - Panel de Turnos
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const API = "/api";
  const token = localStorage.getItem("token");
  if (!token) return location.href = "login.html";

  document.getElementById("logout").addEventListener("click", e => {
    e.preventDefault();
    localStorage.clear();
    location.href = "login.html";
  });

  async function cargarTurnos() {
    const estados = ["Llamado", "En espera"];
    const cont = document.getElementById("lista-espera");
    cont.innerHTML = "";

    for (const estado of estados) {
      const res = await fetch(`${API}/turnos?estado=${encodeURIComponent(estado)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) continue;

      if (!Array.isArray(data) || data.length === 0) continue;
      cont.innerHTML += `<h3>${estado}</h3>` + data.map(t => `
        <div class="item">
          <div><strong>${t.paciente}</strong><br><small>${t.clinica}</small></div>
          <span class="badge ${estado === 'Llamado' ? 'call' : 'wait'}">${estado}</span>
          <div class="actions">
            ${estado === "En espera"
              ? `<button onclick="accionTurno(${t.id}, 'llamar')">Llamar</button>`
              : `<button onclick="accionTurno(${t.id}, 'finalizar')">Finalizar</button>
                 <button onclick="accionTurno(${t.id}, 'ausente')">Ausente</button>`}
          </div>
        </div>`).join("");
    }

    if (!cont.innerHTML)
      cont.innerHTML = `<p class="muted">No hay pacientes pendientes</p>`;
  }

  window.accionTurno = async function (id, tipo) {
    const res = await fetch(`${API}/turnos/${id}/${tipo}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message || "Error al actualizar turno");
    cargarTurnos();
  };

  cargarTurnos();
  setInterval(cargarTurnos, 5000);
});
