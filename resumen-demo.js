document.addEventListener("DOMContentLoaded", () => {
  // Datos de ejemplo embebidos para demostración
  const jugadores = [
    {
      "Jugador":"Axel Poza",
      "Posición":"Defensa central",
      "Club Actual":"CA Gimnasia y Esgrima (Mendoza)",
      "Desde":1736640000000,
      "Hasta":1798675200000,
      "Cargo":"NO",
      "Opción de Compra":"-",
      "Repesca":"NO",
      "Partidos Jugados":0,
      "Minutos Jugados":0,
      "Goles":0,
      "Asistencias":0,
      "Goles en Contra":0,
      "Imbatido":0,
      "Próximo Rival":"Colón",
      "Próximo Partido":1753574400000,
      "Escudo":"ca_gimnasia_y_esgrima_mendoza.png"
    },
    {
      "Jugador":"Agustín Quiroga",
      "Posición":"Defensa central",
      "Club Actual":"CA Chacarita Juniors",
      "Desde":1737158400000,
      "Hasta":1767139200000,
      "Cargo":"NO",
      "Opción de Compra":"NO",
      "Repesca":"NO",
      "Partidos Jugados":19,
      "Minutos Jugados":1493,
      "Goles":0,
      "Asistencias":0,
      "Goles en Contra":0,
      "Imbatido":0,
      "Próximo Rival":"Deportivo Morón",
      "Próximo Partido":1753488000000,
      "Escudo":"ca_chacarita_juniors.png"
    },
    {
      "Jugador":"Tomás Rambert",
      "Posición":"Extremo izquierdo",
      "Club Actual":"CA Los Andes",
      "Desde":1736640000000,
      "Hasta":1767139200000,
      "Cargo":"NO",
      "Opción de Compra":"$ 700.000 x el 50%",
      "Repesca":"NO",
      "Partidos Jugados":9,
      "Minutos Jugados":425,
      "Goles":2,
      "Asistencias":1,
      "Goles en Contra":0,
      "Imbatido":0,
      "Próximo Rival":"Estudiantes (RC)",
      "Próximo Partido":1753574400000,
      "Escudo":"ca_los_andes.png"
    },
    {
      "Jugador":"Nicolás Palavecino",
      "Posición":"Mediocentro ofensivo",
      "Club Actual":"CA Platense",
      "Desde":1723593600000,
      "Hasta":1767139200000,
      "Cargo":"NO",
      "Opción de Compra":"$ 3.000.000",
      "Repesca":"SI",
      "Partidos Jugados":15,
      "Minutos Jugados":889,
      "Goles":3,
      "Asistencias":2,
      "Goles en Contra":0,
      "Imbatido":0,
      "Próximo Rival":"Tigre",
      "Próximo Partido":1753401600000,
      "Escudo":"ca_platense.png"
    },
    {
      "Jugador":"Santiago López",
      "Posición":"Delantero centro",
      "Club Actual":"CA Independiente",
      "Desde":1720137600000,
      "Hasta":1751673600000,
      "Cargo":"NO",
      "Opción de Compra":"$ 5.000.000",
      "Repesca":"NO",
      "Partidos Jugados":22,
      "Minutos Jugados":1876,
      "Goles":8,
      "Asistencias":3,
      "Goles en Contra":0,
      "Imbatido":0,
      "Próximo Rival":"Boca Juniors",
      "Próximo Partido":1754006400000,
      "Escudo":"ca_independiente.png"
    },
    {
      "Jugador":"Marco Pellegrino",
      "Posición":"Defensa central",
      "Club Actual":"CA Independiente",
      "Desde":1704067200000,
      "Hasta":1735689600000,
      "Cargo":"NO",
      "Opción de Compra":"$ 8.000.000",
      "Repesca":"NO",
      "Partidos Jugados":28,
      "Minutos Jugados":2520,
      "Goles":1,
      "Asistencias":0,
      "Goles en Contra":0,
      "Imbatido":15,
      "Próximo Rival":"Racing Club",
      "Próximo Partido":1754352000000,
      "Escudo":"ca_independiente.png"
    }
  ];

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
      .slice(0, 3);

    // Top en partidos
    const topPartidos = [...jugadores]
      .filter(j => Number(j["Partidos Jugados"]) > 0)
      .sort((a, b) => Number(b["Partidos Jugados"]) - Number(a["Partidos Jugados"]))
      .slice(0, 3);

    // Top asistidores
    const topAsistencias = [...jugadores]
      .filter(j => Number(j["Asistencias"]) > 0)
      .sort((a, b) => Number(b["Asistencias"]) - Number(a["Asistencias"]))
      .slice(0, 3);

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
        `).join("") : '<div style="text-align: center; color: #666; padding: 20px;">Datos de ejemplo limitados</div>'}
      </div>
    `;
  }

  function generarProximosVencimientos() {
    const ahora = new Date();
    
    const proximosVencimientos = jugadores
      .map(j => ({
        ...j,
        fechaVencimiento: convertirFecha(j["Hasta"])
      }))
      .filter(j => j.fechaVencimiento > ahora)
      .sort((a, b) => a.fechaVencimiento - b.fechaVencimiento)
      .slice(0, 4);

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

  // Generar todas las secciones con datos de ejemplo
  console.log("Generando página de demostración con datos embebidos...");
  
  generarEstadisticasGenerales();
  generarJugadoresPorPosicion();
  generarMejoresRendimientos();
  generarProximosVencimientos();
  generarOpcionesCompra();
  generarMapaPaises();
  
  console.log("Página de demostración generada correctamente");
});
