document.addEventListener("DOMContentLoaded", () => {
  let jugadores = [];
  let jugadoresFiltrados = [];
  let paginaActual = 1;
  let jugadoresPorPagina = 12; // Sincronizado con la opción seleccionada por defecto

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

  function convertirFechaProximoPartido(valor) {
    const numero = Number(valor);
    const fechaActual = new Date();
    let fechaPartido;

    // Convertir el valor a fecha
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      fechaPartido = new Date(valor);
    } else if (!isNaN(numero) && numero > 1_500_000_000_000) {
      fechaPartido = new Date(numero);
    } else if (!isNaN(numero) && numero > 30000 && numero < 60000) {
      fechaPartido = new Date((numero - 25569) * 86400 * 1000);
    } else {
      return valor;
    }

    // Si la fecha ya pasó, mostrar "A definir"
    if (fechaPartido < fechaActual) {
      return "A definir";
    }

    // Si la fecha es futura, mostrar la fecha formateada
    return fechaPartido.toLocaleDateString("es-AR", {
      day: "2-digit", month: "long", year: "numeric"
    });
  }

  function verificarProximoRival(rival, fechaPartido) {
    const numero = Number(fechaPartido);
    const fechaActual = new Date();
    let fechaPartidoDate;

    // Convertir el valor a fecha
    if (typeof fechaPartido === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaPartido)) {
      fechaPartidoDate = new Date(fechaPartido);
    } else if (!isNaN(numero) && numero > 1_500_000_000_000) {
      fechaPartidoDate = new Date(numero);
    } else if (!isNaN(numero) && numero > 30000 && numero < 60000) {
      fechaPartidoDate = new Date((numero - 25569) * 86400 * 1000);
    } else {
      return rival;
    }

    // Si la fecha ya pasó, mostrar "A definir"
    if (fechaPartidoDate < fechaActual) {
      return "A definir";
    }

    // Si la fecha es futura, mostrar el rival normal
    return rival;
  }

  function renderizar(jugadoresPaginados) {
    const contenedor = document.getElementById("contenedor-jugadores");
    contenedor.innerHTML = "";

    if (jugadoresPaginados.length === 0) {
      contenedor.innerHTML = '<p style="text-align: center; color: #ccc; grid-column: 1 / -1;">No se encontraron jugadores</p>';
      return;
    }

    jugadoresPaginados.forEach(j => {
      const div = document.createElement("div");
      div.className = "jugador";
      
      // Verificar si el próximo partido es realmente futuro
      const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día actual
      const esHoy = fechaPartido > 0 && new Date(fechaPartido).toDateString() === new Date().toDateString();
      const esFuturo = fechaPartido >= hoy.getTime();
      const tieneRival = j["Próximo Rival"] && j["Próximo Rival"] !== "-" && j["Próximo Rival"].trim() !== "";
      
      // Generar el HTML de próximo partido SOLO si es futuro y tiene rival
      let proximoPartidoHtml = '';
      if (tieneRival && esFuturo) {
        proximoPartidoHtml = `
          <div class="proximo-partido-info">
            <p class="proximo-partido-titulo"><strong>⚽ Próximo Partido</strong></p>
            <p class="proximo-rival">
              <span class="vs-icon">VS</span> ${j["Próximo Rival"]}
              ${esHoy ? '<span class="badge-hoy">HOY</span>' : ''}
            </p>
            <p class="proximo-fecha"><span class="fecha-icon">📆</span> ${convertirFechaProximoPartido(j["Próximo Partido"])}</p>
          </div>
        `;
      } else if (tieneRival && !esFuturo) {
        // Si tiene rival pero la fecha ya pasó, no mostrar nada (partido ya jugado)
        proximoPartidoHtml = `
          <div class="proximo-partido-info" style="background: #f5f5f5; border-color: #ccc;">
            <p class="proximo-partido-titulo" style="color: #888 !important;"><strong>📋 Último Partido</strong></p>
            <p class="proximo-rival" style="color: #666;">
              <span class="vs-icon" style="background: #888;">VS</span> ${j["Próximo Rival"]} (ya jugado)
            </p>
            <p class="proximo-fecha" style="color: #888 !important;"><span class="fecha-icon">�</span> ${convertirFechaProximoPartido(j["Próximo Partido"])}</p>
          </div>
        `;
      }
      
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
        ${proximoPartidoHtml}
      `;

      contenedor.appendChild(div);
    });

    actualizarInfoPaginacion();
    actualizarBotonesPaginacion();
  }

  function actualizarInfoPaginacion() {
    const info = document.getElementById('info-resultados');
    const totalJugadores = jugadoresFiltrados.length;
    const inicio = (paginaActual - 1) * jugadoresPorPagina + 1;
    const fin = Math.min(paginaActual * jugadoresPorPagina, totalJugadores);
    
    if (totalJugadores === 0) {
      info.textContent = 'No se encontraron jugadores';
    } else {
      info.textContent = `Mostrando ${inicio}-${fin} de ${totalJugadores} jugadores`;
    }
  }

  function actualizarBotonesPaginacion() {
    const totalPaginas = Math.ceil(jugadoresFiltrados.length / jugadoresPorPagina);
    const contenedorPaginacion = document.getElementById('paginacion');
    
    contenedorPaginacion.innerHTML = '';

    // Botón anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.innerHTML = '&laquo; Anterior';
    btnAnterior.className = 'btn-paginacion';
    btnAnterior.disabled = paginaActual === 1;
    btnAnterior.addEventListener('click', () => {
      if (paginaActual > 1) {
        paginaActual--;
        aplicarPaginacion();
      }
    });
    contenedorPaginacion.appendChild(btnAnterior);

    // Números de página
    let inicioNumeros = Math.max(1, paginaActual - 2);
    let finNumeros = Math.min(totalPaginas, paginaActual + 2);

    for (let i = inicioNumeros; i <= finNumeros; i++) {
      const btnNumero = document.createElement('button');
      btnNumero.textContent = i;
      btnNumero.className = 'btn-paginacion';
      if (i === paginaActual) {
        btnNumero.classList.add('activo');
      }
      btnNumero.addEventListener('click', () => {
        paginaActual = i;
        aplicarPaginacion();
      });
      contenedorPaginacion.appendChild(btnNumero);
    }

    // Botón siguiente
    const btnSiguiente = document.createElement('button');
    btnSiguiente.innerHTML = 'Siguiente &raquo;';
    btnSiguiente.className = 'btn-paginacion';
    btnSiguiente.disabled = paginaActual === totalPaginas || totalPaginas === 0;
    btnSiguiente.addEventListener('click', () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        aplicarPaginacion();
      }
    });
    contenedorPaginacion.appendChild(btnSiguiente);
  }

  function aplicarPaginacion() {
    const inicio = (paginaActual - 1) * jugadoresPorPagina;
    const fin = inicio + jugadoresPorPagina;
    const jugadoresPaginados = jugadoresFiltrados.slice(inicio, fin);
    
    renderizar(jugadoresPaginados);
  }

  function aplicarFiltros() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const posicion = document.getElementById("filtro-posicion").value;
    const orden = document.getElementById("orden").value;

    jugadoresFiltrados = jugadores.filter(j =>
      j["Jugador"].toLowerCase().includes(texto) &&
      (posicion === "" || j["Posición"] === posicion)
    );

    jugadoresFiltrados.sort((a, b) => {
      const nombreA = a["Jugador"].toLowerCase();
      const nombreB = b["Jugador"].toLowerCase();
      return orden === "az" ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
    });

    // Agregar clase cuando hay filtros activos
    const infoResultados = document.getElementById("info-resultados");
    const hayFiltros = texto !== "" || posicion !== "";
    
    if (hayFiltros) {
      infoResultados.parentElement.classList.add("has-filters");
    } else {
      infoResultados.parentElement.classList.remove("has-filters");
    }

    // Resetear a la primera página cuando se aplican filtros
    paginaActual = 1;
    aplicarPaginacion();
  }

  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      jugadores = data;
      jugadoresFiltrados = [...jugadores];

      // Generar resumen de próximos partidos
      generarResumenProximos();

      const posicionesUnicas = [...new Set(data.map(j => j["Posición"]))].sort();
      const filtroPosicion = document.getElementById("filtro-posicion");
      posicionesUnicas.forEach(pos => {
        const option = document.createElement("option");
        option.value = pos;
        option.textContent = pos;
        filtroPosicion.appendChild(option);
      });

      // Configurar el selector de jugadores por página
      const selectorPagina = document.getElementById("jugadores-por-pagina");
      selectorPagina.addEventListener("change", (e) => {
        const valor = e.target.value;
        jugadoresPorPagina = valor === "all" ? jugadoresFiltrados.length : parseInt(valor);
        paginaActual = 1;
        
        // Efecto visual de carga
        const contenedor = document.getElementById("contenedor-jugadores");
        contenedor.classList.add("loading");
        
        setTimeout(() => {
          aplicarPaginacion();
          contenedor.classList.remove("loading");
        }, 200);
      });

      aplicarPaginacion();

      // Agregar efectos visuales a los filtros
      const buscador = document.getElementById("buscador");
      const filtros = document.getElementById("filtros");
      
      buscador.addEventListener("focus", () => {
        filtros.style.transform = "scale(1.02)";
      });
      
      buscador.addEventListener("blur", () => {
        filtros.style.transform = "scale(1)";
      });

      document.getElementById("buscador").addEventListener("input", aplicarFiltros);
      filtroPosicion.addEventListener("change", aplicarFiltros);
      document.getElementById("orden").addEventListener("change", aplicarFiltros);
    })
    .catch(err => {
      console.error("Error al cargar data.json:", err);
      document.getElementById("contenedor-jugadores").innerHTML = 
        '<p style="text-align: center; color: #ff6b6b; grid-column: 1 / -1;">❌ Error al cargar los datos</p>';
    });

  // Función para generar resumen de próximos partidos
  function generarResumenProximos() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Inicio del día actual
    
    const proximosPartidos = jugadores.filter(j => {
      const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
      const tieneRival = j["Próximo Rival"] && j["Próximo Rival"] !== "-" && j["Próximo Rival"].trim() !== "";
      // SOLO partidos futuros con rival definido
      return fechaPartido >= hoy.getTime() && tieneRival;
    });

    const partidosHoy = proximosPartidos.filter(j => {
      const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
      return new Date(fechaPartido).toDateString() === new Date().toDateString();
    });

    const partidosEstaSemana = proximosPartidos.filter(j => {
      const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
      const diasHasta = Math.ceil((fechaPartido - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diasHasta <= 7;
    });

    // Crear div de resumen si no existe
    let resumenDiv = document.getElementById("resumen-proximos");
    if (!resumenDiv) {
      resumenDiv = document.createElement("div");
      resumenDiv.id = "resumen-proximos";
      resumenDiv.className = "resumen-proximos";
      
      const contenidoPrincipal = document.getElementById("contenido-principal");
      const filtros = document.getElementById("filtros");
      contenidoPrincipal.insertBefore(resumenDiv, filtros);
    }

    if (proximosPartidos.length > 0) {
      resumenDiv.innerHTML = `
        <div class="resumen-stats">
          <div class="stat-item">
            <span class="stat-numero">${proximosPartidos.length}</span>
            <span class="stat-texto">Próximos partidos</span>
          </div>
          <div class="stat-item destacado">
            <span class="stat-numero">${partidosHoy.length}</span>
            <span class="stat-texto">Hoy</span>
          </div>
          <div class="stat-item">
            <span class="stat-numero">${partidosEstaSemana.length}</span>
            <span class="stat-texto">Esta semana</span>
          </div>
        </div>
      `;
    } else {
      resumenDiv.innerHTML = `
        <div class="resumen-stats">
          <div class="stat-item">
            <span class="stat-numero">0</span>
            <span class="stat-texto">Sin próximos partidos confirmados</span>
          </div>
        </div>
      `;
    }
  }
});
