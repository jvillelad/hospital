// ======================================
// DISPLAY - Sala de Espera
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const API = "/api";
  const token = localStorage.getItem("token");
  if (!token) return location.href = "login.html";

  async function cargarDisplay() {
    const llamadosRes = await fetch(`${API}/turnos?estado=Llamado`, { headers: { "Authorization": `Bearer ${token}` } });
    const esperaRes = await fetch(`${API}/turnos?estado=En%20espera`, { headers: { "Authorization": `Bearer ${token}` } });

    const llamados = await llamadosRes.json();
    const espera = await esperaRes.json();

    const actuales = document.getElementById("actuales");
    actuales.innerHTML = Array.isArray(llamados) && llamados.length
      ? llamados.map(t => `<div class="ticket"><h3>${t.paciente}</h3><p>${t.clinica}</p></div>`).join("")
      : `<p class="muted">No hay pacientes llamados actualmente</p>`;

    const cola = document.getElementById("cola");
    cola.innerHTML = Array.isArray(espera) && espera.length
      ? espera.map(t => `<div class="item"><strong>${t.paciente}</strong> — ${t.clinica}</div>`).join("")
      : `<p class="muted">No hay pacientes en espera</p>`;
  }

  cargarDisplay();
  setInterval(cargarDisplay, 7000);
});
