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

function obtenerTimestamp(valor) {
  const numero = Number(valor);
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return new Date(valor).getTime();
  }
  if (!isNaN(numero) && numero > 1_500_000_000_000) {
    return numero;
  }
  if (!isNaN(numero) && numero > 30000 && numero < 60000) {
    return (numero - 25569) * 86400 * 1000;
  }
  return 0;
}

document.addEventListener("DOMContentLoaded", () => {
  fetch('data.json')
    .then(response => response.json())
    .then(jugadores => {
      // Filtra solo los partidos que aún no se jugaron
      const hoy = new Date();
      const jugadoresFuturos = jugadores.filter(j => {
        const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
        // Solo muestra partidos desde hoy en adelante
        return fechaPartido >= hoy.setHours(0,0,0,0);
      });

      // Ordena por fecha más próxima
      jugadoresFuturos.sort((a, b) => obtenerTimestamp(a["Próximo Partido"]) - obtenerTimestamp(b["Próximo Partido"]));

      const contenedor = document.getElementById("lista-proximos");
      contenedor.innerHTML = `
        <h2 class="proximos-titulo">Próximos partidos</h2>
        <div class="proximos-grid">
          ${jugadoresFuturos.map((j, idx) => {
            const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
            const esHoy = new Date(fechaPartido).toDateString() === hoy.toDateString();
            return `
              <div class="jugador-proximo${idx === 0 ? ' partido-proximo' : ''}">
                <div class="jugador-proximo-info">
                  <strong>${j["Jugador"]}</strong>
                  <div>
                    <span class="vs-icon">VS</span> <b>${j["Próximo Rival"]}</b>
                    ${esHoy ? '<span class="badge-hoy">HOY</span>' : ''}
                  </div>
                  <div><span class="fecha-icon">📆</span> ${convertirFecha(j["Próximo Partido"])}</div>
                </div>
                <img src="img/${j["Escudo"]}" alt="Escudo ${j["Club Actual"]}" class="escudo-club">
              </div>
            `;
          }).join("")}
        </div>
      `;
        });
    });