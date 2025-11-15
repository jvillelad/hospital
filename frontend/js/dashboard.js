// ======================================
// DASHBOARD MÉDICO - Panel de Turnos
// Socket.IO version con separación por estado
// ======================================

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return location.href = "login.html";

  const socket = io("/", { auth: { token } });

  const contConsulta = document.getElementById("lista-consulta");
  const contEspera = document.getElementById("lista-espera");

  //document.getElementById("logout").addEventListener("click", e => {
   // e.preventDefault();
    //localStorage.clear();
    //location.href = "login.html";
  //});

  function renderTurnos(container, data, estado) {
    container.innerHTML = "";
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<p class="muted">No hay pacientes ${estado === "Llamado" ? "en consulta" : "en espera"}</p>`;
      return;
    }

    data.forEach(t => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div>
          <strong>${t.paciente}</strong><br>
          <small>${t.clinica}</small><br>
          <small>Ticket: <b>${t.ticket || "-"}</b></small>
        </div>
        <span class="badge ${estado === "Llamado" ? "call" : "wait"}">${estado}</span>
        <div class="actions">
          ${
            estado === "En espera"
              ? `<button onclick="accionTurno(${t.id}, 'llamar')">Llamar</button>`
              : `<button onclick="accionTurno(${t.id}, 'finalizar')">Finalizar</button>
                 <button onclick="accionTurno(${t.id}, 'ausente')">Ausente</button>`
          }
        </div>`;
      container.appendChild(div);
    });
  }

  async function cargarTurnos() {
    socket.emit("turnos:list", "Llamado", resp1 => {
      if (resp1.ok) renderTurnos(contConsulta, resp1.data, "Llamado");
    });
    socket.emit("turnos:list", "En espera", resp2 => {
      if (resp2.ok) renderTurnos(contEspera, resp2.data, "En espera");
    });
  }

  window.accionTurno = (id, tipo) => {
    socket.emit("turno:accion", { id, accion: tipo }, resp => {
      mostrarAlerta(resp.ok, resp.message);
      if (resp.ok) cargarTurnos();
    });
  };

  // REASIGNACION: Abrir Modal
  window.abrirReasignar = (id) => {
    turnoActual = id;
    document.getElementById("modalReasignar").style.display = "flex";

    socket.emit("clinicas:list", (res) => {
      const select = document.getElementById("nuevaClinica");
      select.innerHTML = "";
      res.data.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nombre;
        select.appendChild(opt);
      });
    });
  };
  // CONFIRMAR REASIGNACION
  window.confirmarReasignacion = () => {
    const clinica = document.getElementById("nuevaClinica").value;
    const motivo = document.getElementById("motivoReasignacion").value.trim();

    if (!motivo) return mostrarAlerta(false, "Debe ingresar un motivo");

    socket.emit("turno:reasignar",
      { id: turnoActual, nueva_clinica_id: clinica, motivo },
      (res) => {
        mostrarAlerta(res.ok, res.message);
        if (res.ok) {
          document.getElementById("modalReasignar").style.display = "none";
          document.getElementById("motivoReasignacion").value = "";
          cargarTurnos();
        }
      }
    );
  };

  socket.on("turnos:changed", () => cargarTurnos());
  cargarTurnos();

  // ---------- alertas visuales ----------
  const alerta = document.createElement("div");
  alerta.className = "alerta";
  document.body.appendChild(alerta);

  function mostrarAlerta(ok, msg) {
    alerta.textContent = msg;
    alerta.style.background = ok ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)";
    alerta.classList.add("show");
    setTimeout(() => alerta.classList.remove("show"), 2000);
  }
});
