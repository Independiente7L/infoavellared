document.addEventListener("DOMContentLoaded", () => {
  let jugadores = [];

  function convertirFecha(valor) {
    const numero = Number(valor);

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return new Date(valor).toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }

    if (!isNaN(numero) && numero > 1_500_000_000_000) {
      return new Date(numero).toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }

    if (!isNaN(numero) && numero > 30000 && numero < 60000) {
      const fecha = new Date((numero - 25569) * 86400 * 1000);
      return fecha.toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }

    return valor;
  }

  function renderizar(jugadoresFiltrados) {
    const contenedor = document.getElementById("contenedor-jugadores");
    contenedor.innerHTML = "";

    jugadoresFiltrados.forEach(j => {
      const div = document.createElement("div");
      div.className = "jugador";
      div.innerHTML = `
        <img src="img/${j["Escudo"]}" alt="Escudo ${j["Club Actual"]}" class="escudo-club" />
        <h3>${j["Jugador"]}</h3>
        <p><strong>Posición:</strong> ${j["Posición"]}</p>
        <p><strong>Club Actual:</strong> ${j["Club Actual"]}</p>
        <p><strong>Desde:</strong> ${convertirFecha(j["Desde"])} | <strong>Hasta:</strong> ${convertirFecha(j["Hasta"])}</p>
        <p><strong>Cargo:</strong> ${j["Cargo"]}</p>
        <p><strong>Opción de Compra:</strong> ${j["Opción de Compra"]}</p>
        <p><strong>Repesca:</strong> ${j["Repesca"]}</p>
        <p><strong>Estadísticas:</strong><br>
          PJ: ${j["Partidos Jugados"]} |
          Min: ${j["Minutos Jugados"]} |
          Goles: ${j["Goles"]} |
          Asistencias: ${j["Asistencias"]} |
          GEC: ${j["Goles en Contra"]} |
          Imbatido: ${j["Imbatido"]}
        </p>
        <p><strong>Próximo Rival:</strong> ${j["Próximo Rival"]}</p>
        <p><strong>Próximo Partido:</strong> ${convertirFecha(j["Próximo Partido"])}</p>
      `;

      contenedor.appendChild(div);
    });
  }

  function aplicarFiltros() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const posicion = document.getElementById("filtro-posicion").value;
    const orden = document.getElementById("orden").value;

    let filtrados = jugadores.filter(j =>
      j["Jugador"].toLowerCase().includes(texto) &&
      (posicion === "" || j["Posición"] === posicion)
    );

    filtrados.sort((a, b) => {
      const nombreA = a["Jugador"].toLowerCase();
      const nombreB = b["Jugador"].toLowerCase();
      return orden === "az" ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
    });

    renderizar(filtrados);
    mostrarResumen(filtrados);
  }

  function mostrarResumen(jugadores) {
    const totalGoles = jugadores.reduce((sum, j) => sum + Number(j["Goles"] || 0), 0);
    const totalPartidos = jugadores.reduce((sum, j) => sum + Number(j["Partidos Jugados"] || 0), 0);
    const totalAsistencias = jugadores.reduce((sum, j) => sum + Number(j["Asistencias"] || 0), 0);
    document.getElementById("resumen-estadisticas").innerHTML = `
      <span class="stat"><span class="stat-icon">⚽</span>Partidos: ${totalPartidos}</span>
      <span class="stat"><span class="stat-icon">🥅</span>Goles: ${totalGoles}</span>
      <span class="stat"><span class="stat-icon">🅰️</span>Asistencias: ${totalAsistencias}</span>
    `;
  }

  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      jugadores = data;

      const posicionesUnicas = [...new Set(data.map(j => j["Posición"]))].sort();
      const filtroPosicion = document.getElementById("filtro-posicion");
      posicionesUnicas.forEach(pos => {
        const option = document.createElement("option");
        option.value = pos;
        option.textContent = pos;
        filtroPosicion.appendChild(option);
      });

      renderizar(jugadores);
      mostrarResumen(jugadores);

      document.getElementById("buscador").addEventListener("input", aplicarFiltros);
      filtroPosicion.addEventListener("change", aplicarFiltros);
      document.getElementById("orden").addEventListener("change", aplicarFiltros);
    })
    .catch(err => {
      console.error("Error al cargar data.json:", err);
    });
});
