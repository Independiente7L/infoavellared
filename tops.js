function crearTabla(titulo, datos, campo, icono = "") {
  return `
    <div class="top-tabla">
      <h2>${icono} ${titulo}</h2>
      <table>
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Club</th>
            <th>${titulo}</th>
          </tr>
        </thead>
        <tbody>
          ${datos.map(j => `
            <tr>
              <td>${j["Jugador"]}</td>
              <td>
                <img 
                  src="img/${j["Escudo"]}" 
                  alt="Escudo ${j["Club Actual"]}" 
                  class="escudo-top"
                  title="${j["Club Actual"]}"
                >
              </td>
              <td>${j[campo]}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  fetch('data.json?v=20250801v5')
    .then(response => response.json())
    .then(jugadores => {
      // Top 10 por cada estadística
      const topGoles = [...jugadores].sort((a, b) => b["Goles"] - a["Goles"]).slice(0, 10);
      const topAsistencias = [...jugadores].sort((a, b) => b["Asistencias"] - a["Asistencias"]).slice(0, 10);
      const topPartidos = [...jugadores].sort((a, b) => b["Partidos Jugados"] - a["Partidos Jugados"]).slice(0, 10);
      const topMinutos = [...jugadores].sort((a, b) => b["Minutos Jugados"] - a["Minutos Jugados"]).slice(0, 10);

      // Solo arqueros
      const arqueros = jugadores.filter(j => j["Posición"].toLowerCase().includes("arquero") || j["Posición"].toLowerCase().includes("portero"));
      const topImbatidos = [...arqueros].sort((a, b) => b["Imbatido"] - a["Imbatido"]).slice(0, 10);
      const topGEC = [...arqueros].sort((a, b) => b["Goles en Contra"] - a["Goles en Contra"]).slice(0, 10);

      const container = document.getElementById("tops-container");
      container.innerHTML = `
        <div class="tops-grid">
          ${crearTabla("Top Goleadores", topGoles, "Goles", "⚽")}
          ${crearTabla("Top Asistencias", topAsistencias, "Asistencias", "🅰️")}
          ${crearTabla("Top Partidos Jugados", topPartidos, "Partidos Jugados", "📋")}
          ${crearTabla("Top Minutos Jugados", topMinutos, "Minutos Jugados", "⏱️")}
          ${crearTabla("Top Imbatidos", topImbatidos, "Imbatido", "🧤")}
          ${crearTabla("Top Goles en Contra", topGEC, "Goles en Contra", "🥅")}
        </div>
      `;
    });
});