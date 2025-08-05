document.addEventListener("DOMContentLoaded", () => {
  let jugadores = [];
  let jugadoresFiltrados = [];
  let paginaActual = 1;
  let jugadoresPorPagina = 12; // Sincronizado con la opción seleccionada por defecto

  function convertirFecha(valor) {
    const numero = Number(valor);

    // Formato DD/MM/YYYY (nuevo formato)
    if (typeof valor === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      const [dia, mes, año] = valor.split('/');
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
      return fecha.toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }

    // Formato YYYY-MM-DD
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return new Date(valor).toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }

    // Timestamp numérico
    if (!isNaN(numero) && numero > 1_500_000_000_000) {
      return new Date(numero).toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }

    // Número de serie de Excel
    if (!isNaN(numero) && numero > 30000 && numero < 60000) {
      const fecha = new Date((numero - 25569) * 86400 * 1000);
      return fecha.toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }

    return valor;
  }

  function convertirFechaProximoPartido(valor) {
    if (!valor || valor === "A definir") {
      return "A definir";
    }

    const fechaActual = new Date();
    let fechaPartido;

    // Nuevo formato: "miércoles, 06/08/2025 - 20:00"
    if (typeof valor === "string" && valor.includes(",") && valor.includes("-")) {
      const match = valor.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) {
        const fechaStr = match[1];
        const partes = fechaStr.split('/');
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const año = parseInt(partes[2], 10);
        fechaPartido = new Date(año, mes, dia);
      }
    }
    // Formato DD/MM/YYYY simple
    else if (typeof valor === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
      const partes = valor.split('/');
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const año = parseInt(partes[2], 10);
      fechaPartido = new Date(año, mes, dia);
    }
    // Formato YYYY-MM-DD
    else if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      fechaPartido = new Date(valor);
    }
    // Timestamp numérico
    else if (!isNaN(Number(valor)) && Number(valor) > 1_500_000_000_000) {
      fechaPartido = new Date(Number(valor));
    }
    // Número de serie de Excel
    else if (!isNaN(Number(valor)) && Number(valor) > 30000 && Number(valor) < 60000) {
      fechaPartido = new Date((Number(valor) - 25569) * 86400 * 1000);
    }
    else {
      return valor;
    }

    if (!fechaPartido || isNaN(fechaPartido.getTime())) {
      return "A definir";
    }

    // Calcular días hasta el partido
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaPartido.setHours(0, 0, 0, 0);
    const diferenciaDias = Math.ceil((fechaPartido.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

    // Si la fecha ya pasó
    if (diferenciaDias < 0) {
      return "A definir";
    }

    // Formato estético según cercanía
    if (diferenciaDias === 0) {
      return "🔥 HOY";
    } else if (diferenciaDias === 1) {
      return "⚡ MAÑANA";
    } else if (diferenciaDias <= 7) {
      return `📅 En ${diferenciaDias} días`;
    } else {
      return fechaPartido.toLocaleDateString("es-AR", {
        day: "2-digit", 
        month: "short", 
        year: "numeric"
      });
    }
  }

  function extraerHoraPartido(valor) {
    if (!valor || typeof valor !== "string") {
      return "";
    }

    // Buscar patrón de hora HH:MM
    const match = valor.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : "";
  }

  function verificarProximoRival(rival, fechaPartido) {
    // Si no hay rival definido o es A definir
    if (!rival || rival === "A definir" || rival === "") {
      return "A definir";
    }

    // Verificar si la fecha ya pasó
    const fechaConvertida = convertirFechaProximoPartido(fechaPartido);
    if (fechaConvertida === "A definir") {
      return "A definir";
    }

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
        <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
          <p><strong>⚔️ Próximo Rival:</strong> <span style="color: #e74c3c; font-weight: bold;">${verificarProximoRival(j["Próximo Rival"], j["Próximo Partido"])}</span></p>
          <p><strong>📅 Próximo Partido:</strong> <span style="color: #3498db; font-weight: bold;">${convertirFechaProximoPartido(j["Próximo Partido"])}</span></p>
        </div>
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

  fetch('data.json?v=20250801v5')
    .then(response => response.json())
    .then(data => {
      jugadores = data;
      jugadoresFiltrados = [...jugadores];

      const posicionesUnicas = [...new Set(data.map(j => j["Posición"]))].sort();
      const filtroPosicion = document.getElementById("filtro-posicion");
      posicionesUnicas.forEach(pos => {
        const option = document.createElement("option");
        option.value = pos;
        option.textContent = pos;
        filtroPosicion.appendChild(option);
      });

      // Aplicar filtros iniciales (orden A-Z por defecto)
      aplicarFiltros();

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
    });
});
