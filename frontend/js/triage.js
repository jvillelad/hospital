// ===================================
// TRIAJE - Registro y Asignación
// Adaptado para HTML clásico (formularios separados)
// ===================================

document.addEventListener("DOMContentLoaded", () => {
  const API = "/api";
  const token = localStorage.getItem("token");
  if (!token) return location.href = "login.html";

  document.getElementById("logout").addEventListener("click", e => {
    e.preventDefault();
    localStorage.clear();
    location.href = "login.html";
  });

  async function cargarClinicas() {
    const res = await fetch(`${API}/clinicas`, { headers: { "Authorization": `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) return alert("Error al cargar clínicas");
    document.getElementById("t_clinica").innerHTML = data.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");
  }

  async function cargarPacientes() {
    const res = await fetch(`${API}/pacientes`, { headers: { "Authorization": `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) return alert("Error al cargar pacientes");
    document.getElementById("t_paciente").innerHTML = data.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");
  }

  document.getElementById("pacienteForm").addEventListener("submit", async e => {
    e.preventDefault();
    const nombre = document.getElementById("p_nombre").value.trim();
    const edad = document.getElementById("p_edad").value.trim();
    const sintomas = document.getElementById("p_sintomas").value.trim();

    const res = await fetch(`${API}/pacientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ nombre, edad, sintomas })
    });
    const data = await res.json();
    alert(data.message || "Error al registrar paciente");
    cargarPacientes();
  });

document.getElementById("turnoForm").addEventListener("submit", async e => {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const paciente_id = document.getElementById("t_paciente").value;
  const clinica_id = document.getElementById("t_clinica").value;
  if (!paciente_id || !clinica_id) return alert("Selecciona paciente y clínica");

  const res = await fetch(`/api/turnos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ paciente_id, clinica_id })
  });

  const data = await res.json().catch(()=>({}));
  if (!res.ok) {
    alert(data?.message || "Error al crear turno");
    return;
  }

  alert("✅ Turno creado correctamente");
});

  cargarClinicas();
  cargarPacientes();
});
