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
        const tieneRival = j["Próximo Rival"] && j["Próximo Rival"] !== "-";
        // Solo muestra partidos desde hoy en adelante y que tengan rival definido
        return fechaPartido >= hoy.setHours(0,0,0,0) && tieneRival;
      });

      // Ordena por fecha más próxima
      jugadoresFuturos.sort((a, b) => obtenerTimestamp(a["Próximo Partido"]) - obtenerTimestamp(b["Próximo Partido"]));

      const contenedor = document.getElementById("lista-proximos");
      
      if (jugadoresFuturos.length === 0) {
        contenedor.innerHTML = `
          <h2 class="proximos-titulo">📅 Próximos partidos</h2>
          <div style="text-align: center; padding: 40px; color: #666;">
            <p style="font-size: 18px;">📭 No hay próximos partidos programados</p>
          </div>
        `;
        return;
      }

      contenedor.innerHTML = `
        <h2 class="proximos-titulo">📅 Próximos partidos (${jugadoresFuturos.length})</h2>
        <div class="proximos-grid">
          ${jugadoresFuturos.map((j, idx) => {
            const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
            const fechaActual = new Date();
            const fechaPartidoObj = new Date(fechaPartido);
            const esHoy = fechaPartidoObj.toDateString() === fechaActual.toDateString();
            const esMañana = fechaPartidoObj.toDateString() === new Date(fechaActual.getTime() + 24*60*60*1000).toDateString();
            
            // Calcular días hasta el partido
            const diasHasta = Math.ceil((fechaPartido - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
            
            let badgePartido = '';
            if (esHoy) {
              badgePartido = '<span class="badge-hoy">HOY</span>';
            } else if (esMañana) {
              badgePartido = '<span class="badge-manana">MAÑANA</span>';
            } else if (diasHasta <= 7) {
              badgePartido = `<span class="badge-esta-semana">EN ${diasHasta} DÍAS</span>`;
            }
            
            return `
              <div class="jugador-proximo${idx === 0 ? ' partido-proximo' : ''}${esHoy ? ' partido-hoy' : ''}">
                <div class="jugador-proximo-info">
                  <strong>${j["Jugador"]}</strong>
                  <div class="club-info">
                    <span style="color: #666; font-size: 13px;">${j["Club Actual"]}</span>
                  </div>
                  <div class="rival-info">
                    <span class="vs-icon">VS</span> <b>${j["Próximo Rival"]}</b>
                    ${badgePartido}
                  </div>
                  <div class="fecha-info">
                    <span class="fecha-icon">📆</span> ${convertirFecha(j["Próximo Partido"])}
                  </div>
                  <div class="stats-mini">
                    PJ: ${j["Partidos Jugados"]} | Goles: ${j["Goles"]} | Asist: ${j["Asistencias"]}
                  </div>
                </div>
                <img src="img/${j["Escudo"]}" alt="Escudo ${j["Club Actual"]}" class="escudo-club">
              </div>
            `;
          }).join("")}
        </div>
      `;
        });
    });