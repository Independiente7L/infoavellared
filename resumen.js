document.addEventListener("DOMContentLoaded", () => {
  let jugadores = [];

  function convertirFecha(valor) {
    const numero = Number(valor);

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return new Date(valor);
    }

    if (!isNaN(numero) && numero > 1_500_000_000_000) {
      return new Date(numero);
    }

    if (!isNaN(numero) && numero > 30000 && numero < 60000) {
      return new Date((numero - 25569) * 86400 * 1000);
    }

    return new Date(valor);
  }

  function formatearFecha(fecha) {
    return fecha.toLocaleDateString("es-AR", {
      day: "2-digit", month: "long", year: "numeric"
    });
  }

  function detectarPais(club) {
    const paisesMap = {
      'argentina': ['CA ', 'Club Atlético', 'Círculo Deportivo', 'CSD ', 'CS ', 'Real Pilar'],
      'uruguay': ['Boston River', 'Liverpool FC Montevideo', 'Club Deportivo Maldonado'],
      'ecuador': ['Barcelona SC Guayaquil'],
      'mexico': ['Club Puebla'],
      'grecia': ['Volos NPS']
    };

    for (const [pais, indicadores] of Object.entries(paisesMap)) {
      if (indicadores.some(indicador => club.includes(indicador))) {
        return pais;
      }
    }
    return 'argentina'; // Por defecto
  }

  function obtenerBanderaPais(pais) {
    const banderas = {
      'argentina': '🇦🇷',
      'uruguay': '🇺🇾',
      'ecuador': '🇪🇨',
      'mexico': '🇲🇽',
      'grecia': '🇬🇷'
    };
    return banderas[pais] || '🏴';
  }

  function obtenerNombrePais(pais) {
    const nombres = {
      'argentina': 'Argentina',
      'uruguay': 'Uruguay',
      'ecuador': 'Ecuador',
      'mexico': 'México',
      'grecia': 'Grecia'
    };
    return nombres[pais] || 'Desconocido';
  }

  function obtenerIconoPosicion(posicion) {
    const iconos = {
      'Portero': '🥅',
      'Defensa central': '🛡️',
      'Lateral derecho': '➡️',
      'Lateral izquierdo': '⬅️',
      'Pivote': '⚙️',
      'Mediocentro': '🎯',
      'Mediocentro ofensivo': '🎨',
      'Extremo derecho': '🏃‍♂️',
      'Extremo izquierdo': '🏃‍♂️',
      'Delantero centro': '⚽'
    };
    return iconos[posicion] || '⚽';
  }

  function generarEstadisticasGenerales() {
    const totalJugadores = jugadores.length;
    const totalPartidos = jugadores.reduce((sum, j) => sum + Number(j["Partidos Jugados"] || 0), 0);
    const totalGoles = jugadores.reduce((sum, j) => sum + Number(j["Goles"] || 0), 0);
    const totalAsistencias = jugadores.reduce((sum, j) => sum + Number(j["Asistencias"] || 0), 0);
    const totalMinutos = jugadores.reduce((sum, j) => sum + Number(j["Minutos Jugados"] || 0), 0);
    const jugadoresActivos = jugadores.filter(j => Number(j["Partidos Jugados"]) > 0).length;
    const conOpcionCompra = jugadores.filter(j => j["Opción de Compra"] && j["Opción de Compra"] !== "NO" && j["Opción de Compra"] !== "-").length;
    const enRepesca = jugadores.filter(j => j["Repesca"] === "SI").length;

    const statsGrid = document.getElementById("stats-grid");
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <div class="stat-number">${totalJugadores}</div>
        <div class="stat-label">Total Jugadores</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🏃‍♂️</span>
        <div class="stat-number">${jugadoresActivos}</div>
        <div class="stat-label">Jugadores Activos</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⚽</span>
        <div class="stat-number">${totalPartidos}</div>
        <div class="stat-label">Partidos Jugados</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🥅</span>
        <div class="stat-number">${totalGoles}</div>
        <div class="stat-label">Goles</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🅰️</span>
        <div class="stat-number">${totalAsistencias}</div>
        <div class="stat-label">Asistencias</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⏱️</span>
        <div class="stat-number">${Math.round(totalMinutos / 60)}</div>
        <div class="stat-label">Horas Jugadas</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">💰</span>
        <div class="stat-number">${conOpcionCompra}</div>
        <div class="stat-label">Con Opción de Compra</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔄</span>
        <div class="stat-number">${enRepesca}</div>
        <div class="stat-label">En Repesca</div>
      </div>
    `;
  }

  function generarJugadoresPorPosicion() {
    const posiciones = {};
    
    jugadores.forEach(jugador => {
      const posicion = jugador["Posición"];
      if (!posiciones[posicion]) {
        posiciones[posicion] = [];
      }
      posiciones[posicion].push(jugador);
    });

    const container = document.getElementById("posiciones-container");
    container.innerHTML = "";

    Object.keys(posiciones).sort().forEach(posicion => {
      const jugadoresPosicion = posiciones[posicion];
      const div = document.createElement("div");
      div.className = "posicion-card";
      
      const jugadoresChips = jugadoresPosicion.map(j => 
        `<div class="jugador-chip">
          <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" class="jugador-escudo">
          ${j["Jugador"]}
        </div>`
      ).join("");

      div.innerHTML = `
        <div class="posicion-titulo">
          <span class="posicion-icono">${obtenerIconoPosicion(posicion)}</span>
          ${posicion} (${jugadoresPosicion.length})
        </div>
        <div class="jugadores-lista">
          ${jugadoresChips}
        </div>
      `;

      container.appendChild(div);
    });
  }

  function generarMejoresRendimientos() {
    // Top goleadores
    const topGoleadores = [...jugadores]
      .filter(j => Number(j["Goles"]) > 0)
      .sort((a, b) => Number(b["Goles"]) - Number(a["Goles"]))
      .slice(0, 5);

    // Top en partidos
    const topPartidos = [...jugadores]
      .filter(j => Number(j["Partidos Jugados"]) > 0)
      .sort((a, b) => Number(b["Partidos Jugados"]) - Number(a["Partidos Jugados"]))
      .slice(0, 5);

    // Top en minutos
    const topMinutos = [...jugadores]
      .filter(j => Number(j["Minutos Jugados"]) > 0)
      .sort((a, b) => Number(b["Minutos Jugados"]) - Number(a["Minutos Jugados"]))
      .slice(0, 5);

    // Top asistidores
    const topAsistencias = [...jugadores]
      .filter(j => Number(j["Asistencias"]) > 0)
      .sort((a, b) => Number(b["Asistencias"]) - Number(a["Asistencias"]))
      .slice(0, 5);

    const container = document.getElementById("rendimientos-grid");
    container.innerHTML = `
      <div class="rendimiento-categoria">
        <div class="categoria-titulo">🥅 Top Goleadores</div>
        ${topGoleadores.map((j, i) => `
          <div class="top-jugador">
            <div class="top-numero">${i + 1}</div>
            <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" class="top-escudo">
            <div class="top-info">
              <div class="top-nombre">${j["Jugador"]}</div>
              <div class="top-club">${j["Club Actual"]}</div>
            </div>
            <div class="top-valor">${j["Goles"]}</div>
          </div>
        `).join("")}
      </div>
      
      <div class="rendimiento-categoria">
        <div class="categoria-titulo">⚽ Más Partidos</div>
        ${topPartidos.map((j, i) => `
          <div class="top-jugador">
            <div class="top-numero">${i + 1}</div>
            <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" class="top-escudo">
            <div class="top-info">
              <div class="top-nombre">${j["Jugador"]}</div>
              <div class="top-club">${j["Club Actual"]}</div>
            </div>
            <div class="top-valor">${j["Partidos Jugados"]}</div>
          </div>
        `).join("")}
      </div>
      
      <div class="rendimiento-categoria">
        <div class="categoria-titulo">⏱️ Más Minutos</div>
        ${topMinutos.map((j, i) => `
          <div class="top-jugador">
            <div class="top-numero">${i + 1}</div>
            <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" class="top-escudo">
            <div class="top-info">
              <div class="top-nombre">${j["Jugador"]}</div>
              <div class="top-club">${j["Club Actual"]}</div>
            </div>
            <div class="top-valor">${Math.round(j["Minutos Jugados"] / 90)}PJ</div>
          </div>
        `).join("")}
      </div>
      
      <div class="rendimiento-categoria">
        <div class="categoria-titulo">🅰️ Top Asistidores</div>
        ${topAsistencias.length > 0 ? topAsistencias.map((j, i) => `
          <div class="top-jugador">
            <div class="top-numero">${i + 1}</div>
            <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" class="top-escudo">
            <div class="top-info">
              <div class="top-nombre">${j["Jugador"]}</div>
              <div class="top-club">${j["Club Actual"]}</div>
            </div>
            <div class="top-valor">${j["Asistencias"]}</div>
          </div>
        `).join("") : '<div style="text-align: center; color: #666; padding: 20px;">No hay asistencias registradas</div>'}
      </div>
    `;
  }

  function generarCronologia() {
    const prestamosPorAno = {};
    
    jugadores.forEach(jugador => {
      const fechaInicio = convertirFecha(jugador["Desde"]);
      const ano = fechaInicio.getFullYear();
      
      if (!prestamosPorAno[ano]) {
        prestamosPorAno[ano] = [];
      }
      
      prestamosPorAno[ano].push(jugador);
    });

    const container = document.getElementById("timeline-container");
    container.innerHTML = '<div class="timeline-line"></div>';
    
    const anos = Object.keys(prestamosPorAno).sort().reverse();
    
    anos.forEach(ano => {
      const jugadoresAno = prestamosPorAno[ano];
      const timelineItem = document.createElement("div");
      timelineItem.className = "timeline-item";
      
      const jugadoresHTML = jugadoresAno.map(j => `
        <div class="timeline-jugador">
          <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" style="width: 20px; height: 20px; border-radius: 50%;">
          <span><strong>${j["Jugador"]}</strong> → ${j["Club Actual"]}</span>
        </div>
      `).join("");
      
      timelineItem.innerHTML = `
        <div class="timeline-fecha">${ano}</div>
        <div class="timeline-content">
          <h4 style="margin-top: 0; color: #b30000;">Préstamos iniciados (${jugadoresAno.length})</h4>
          <div class="timeline-jugadores">
            ${jugadoresHTML}
          </div>
        </div>
      `;
      
      container.appendChild(timelineItem);
    });
  }

  function generarProximosVencimientos() {
    const ahora = new Date();
    const enTresMeses = new Date();
    enTresMeses.setMonth(enTresMeses.getMonth() + 3);
    
    const proximosVencimientos = jugadores
      .map(j => ({
        ...j,
        fechaVencimiento: convertirFecha(j["Hasta"])
      }))
      .filter(j => j.fechaVencimiento > ahora)
      .sort((a, b) => a.fechaVencimiento - b.fechaVencimiento)
      .slice(0, 8);

    const container = document.getElementById("vencimientos-container");
    container.innerHTML = "";

    proximosVencimientos.forEach(jugador => {
      const diasRestantes = Math.ceil((jugador.fechaVencimiento - ahora) / (1000 * 60 * 60 * 24));
      const esUrgente = diasRestantes <= 90;
      
      const div = document.createElement("div");
      div.className = `vencimiento-card ${esUrgente ? 'vencimiento-urgente' : ''}`;
      
      div.innerHTML = `
        <div class="vencimiento-fecha">
          <span>${esUrgente ? '⚠️' : '📅'}</span>
          ${formatearFecha(jugador.fechaVencimiento)}
          <small>(${diasRestantes} días)</small>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <img src="img/${jugador["Escudo"]}" alt="${jugador["Club Actual"]}" style="width: 40px; height: 40px; border-radius: 50%;">
          <div>
            <div style="font-weight: bold; font-size: 16px;">${jugador["Jugador"]}</div>
            <div style="color: #666; font-size: 14px;">${jugador["Club Actual"]}</div>
            <div style="color: #666; font-size: 12px;">${jugador["Posición"]}</div>
          </div>
        </div>
      `;
      
      container.appendChild(div);
    });
  }

  function generarOpcionesCompra() {
    const conOpciones = jugadores.filter(j => 
      j["Opción de Compra"] && 
      j["Opción de Compra"] !== "NO" && 
      j["Opción de Compra"] !== "-"
    );

    // Agrupar por valor de opción de compra
    const porValor = {};
    
    conOpciones.forEach(jugador => {
      const opcion = jugador["Opción de Compra"];
      if (!porValor[opcion]) {
        porValor[opcion] = [];
      }
      porValor[opcion].push(jugador);
    });

    const container = document.getElementById("compras-container");
    container.innerHTML = "";

    Object.keys(porValor).forEach(valor => {
      const jugadoresGrupo = porValor[valor];
      const div = document.createElement("div");
      div.className = "compra-card";
      
      const jugadoresHTML = jugadoresGrupo.map(j => `
        <div class="compra-jugador">
          <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" style="width: 30px; height: 30px; border-radius: 50%;">
          <div>
            <div style="font-weight: bold;">${j["Jugador"]}</div>
            <div style="font-size: 12px; color: #666;">${j["Club Actual"]} - ${j["Posición"]}</div>
          </div>
        </div>
      `).join("");
      
      div.innerHTML = `
        <div class="compra-titulo">
          <span>💰</span>
          Opción de Compra
        </div>
        <div class="compra-valor">${valor}</div>
        <div style="font-size: 14px; color: #2e7d32; margin-bottom: 15px;">
          ${jugadoresGrupo.length} jugador${jugadoresGrupo.length > 1 ? 'es' : ''}
        </div>
        ${jugadoresHTML}
      `;
      
      container.appendChild(div);
    });
  }

  function generarMapaPaises() {
    const porPais = {};
    
    jugadores.forEach(jugador => {
      const pais = detectarPais(jugador["Club Actual"]);
      if (!porPais[pais]) {
        porPais[pais] = [];
      }
      porPais[pais].push(jugador);
    });

    const container = document.getElementById("paises-container");
    container.innerHTML = "";

    Object.keys(porPais).sort().forEach(pais => {
      const jugadoresPais = porPais[pais];
      const div = document.createElement("div");
      div.className = "pais-card";
      
      const jugadoresHTML = jugadoresPais.map(j => `
        <div class="pais-jugador">
          <img src="img/${j["Escudo"]}" alt="${j["Club Actual"]}" style="width: 20px; height: 20px; border-radius: 50%;">
          <span><strong>${j["Jugador"]}</strong> - ${j["Club Actual"]}</span>
        </div>
      `).join("");
      
      div.innerHTML = `
        <div class="pais-bandera">${obtenerBanderaPais(pais)}</div>
        <div class="pais-nombre">${obtenerNombrePais(pais)}</div>
        <div class="pais-contador">${jugadoresPais.length} jugador${jugadoresPais.length > 1 ? 'es' : ''}</div>
        <div class="pais-jugadores">
          ${jugadoresHTML}
        </div>
      `;
      
      container.appendChild(div);
    });
  }

  // Cargar datos y generar todas las secciones
  fetch('data.json?v=2025-08-01-mobile')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      jugadores = data;
      
      generarEstadisticasGenerales();
      generarJugadoresPorPosicion();
      generarMejoresRendimientos();
      generarCronologia();
      generarProximosVencimientos();
      generarOpcionesCompra();
      generarMapaPaises();
    })
    .catch(err => {
      // Mostrar mensaje de error en la página
      document.getElementById("stats-grid").innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #ffebee; border-radius: 10px; color: #c62828;">
          <h3>Error al cargar los datos</h3>
          <p>No se pudieron cargar los datos de los jugadores.</p>
          <p>Error: ${err.message}</p>
          <p><strong>Solución:</strong> Asegúrate de estar ejecutando la página desde un servidor web local o abre las herramientas de desarrollador (F12) para ver más detalles del error.</p>
        </div>
      `;
    });
});
