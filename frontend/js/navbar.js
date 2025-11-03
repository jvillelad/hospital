// frontend/js/navbar.js
(() => {
  const HIDE_PAGES = ["login.html", "display.html"]; // no mostrar nav aquí
  const path = window.location.pathname.toLowerCase();

  if (HIDE_PAGES.some(p => path.endsWith("/" + p) || path.includes("/" + p))) {
    // No inyectar navbar en login/display
    return;
  }

  const links = [
    { href: "triage.html",  label: "Registro de Pacientes",   id: "nav-triage" },
    { href: "dashboard.html", label: "Dashboard", id: "nav-dash" },
    { href: "display.html", label: "Display",  id: "nav-display" },
 ];

  // Construye HTML del navbar
  const nav = document.createElement("div");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-left">
        <div class="nav-links">
          ${links.map(l => `<a id="${l.id}" class="nav-link" href="${l.href}">${l.label}</a>`).join("")}
        </div>
      </div>
      <div class="nav-right">
        <button id="nav-logout" class="btn-ghost">Cerrar sesión</button>
      </div>
    </div>
  `;

  // Inserta al inicio del body
  document.body.prepend(nav);

  // Marca activo según la página actual
  const markActive = () => {
    const current = path.split("/").pop() || "";
    links.forEach(l => {
      const a = document.getElementById(l.id);
      if (!a) return;
      if (current === "" && l.href === "triage.html") {
        // si cargan "/" directo, considera triage como default
        a.classList.add("active");
      } else if (current === l.href) {
        a.classList.add("active");
      } else {
        a.classList.remove("active");
      }
    });
  };
  markActive();

  // Logout
  const btnLogout = document.getElementById("nav-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  // Opcional: empuja el contenido hacia abajo para no tapar la nav fija
  document.body.classList.add("has-nav");
})();
