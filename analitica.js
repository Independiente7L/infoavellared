// JavaScript para la página de Analítica
document.addEventListener('DOMContentLoaded', function() {
  let jugadores = [];
  let categoriaActual = 'todos';
  let ordenActual = 'mejor';

  // Cargar datos de jugadores
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      jugadores = data;
      inicializarAnalitica();
      actualizarEstadisticasGenerales();
      actualizarAnalisisDetallado();
    })
    .catch(error => {
      console.error('Error al cargar datos:', error);
      mostrarError();
    });

  // Event listeners para filtros
  document.getElementById('filtro-categoria').addEventListener('change', function(e) {
    categoriaActual = e.target.value;
    actualizarVista();
  });

  document.getElementById('filtro-orden').addEventListener('change', function(e) {
    ordenActual = e.target.value;
    actualizarVista();
  });

  function inicializarAnalitica() {
    // Agregar animaciones de entrada
    const elementos = document.querySelectorAll('.stat-card, .analisis-categoria');
    elementos.forEach((elemento, index) => {
      elemento.style.animationDelay = `${index * 0.1}s`;
      elemento.classList.add('fade-in');
    });
  }

  function actualizarEstadisticasGenerales() {
    const stats = calcularEstadisticasGenerales();
    
    // Animación de conteo para los números
    animarNumero('total-goles', stats.totalGoles);
    animarNumero('total-asistencias', stats.totalAsistencias);
    animarNumero('total-minutos', stats.totalMinutos);
    animarNumero('total-partidos', stats.totalPartidos);
  }

  function calcularEstadisticasGenerales() {
    const stats = {
      totalGoles: 0,
      totalAsistencias: 0,
      totalMinutos: 0,
      totalPartidos: 0
    };

    jugadores.forEach(jugador => {
      stats.totalGoles += parseInt(jugador["Goles"]) || 0;
      stats.totalAsistencias += parseInt(jugador["Asistencias"]) || 0;
      stats.totalMinutos += parseInt(jugador["Minutos Jugados"]) || 0;
      stats.totalPartidos += parseInt(jugador["Partidos Jugados"]) || 0;
    });

    return stats;
  }

  function animarNumero(elementId, valorFinal) {
    const elemento = document.getElementById(elementId);
    const duracion = 2000; // 2 segundos
    const inicio = Date.now();
    
    function actualizar() {
      const ahora = Date.now();
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      const valorActual = Math.floor(progreso * valorFinal);
      
      elemento.textContent = valorActual.toLocaleString();
      
      if (progreso < 1) {
        requestAnimationFrame(actualizar);
      }
    }
    
    requestAnimationFrame(actualizar);
  }

  function actualizarAnalisisDetallado() {
    generarTopGoleadores();
    generarTopAsistencias();
    generarRendimientoMinutos();
    generarDistribucionClubes();
    generarAnalisisPosiciones();
    generarJugadoresDestacados();
  }

  function generarTopGoleadores() {
    const goleadores = jugadores
      .filter(jugador => parseInt(jugador["Goles"]) > 0)
      .sort((a, b) => parseInt(b["Goles"]) - parseInt(a["Goles"]))
      .slice(0, 5);

    const container = document.getElementById('top-goleadores');
    container.innerHTML = '';

    if (goleadores.length === 0) {
      container.innerHTML = '<div class="empty-state">📊 No hay datos de goles disponibles</div>';
      return;
    }

    goleadores.forEach((jugador, index) => {
      const item = document.createElement('div');
      item.className = 'ranking-item fade-in';
      item.style.animationDelay = `${index * 0.1}s`;
      
      item.innerHTML = `
        <div class="ranking-position">#${index + 1}</div>
        <div class="ranking-info">
          <div>
            <div class="jugador-nombre">${jugador["Jugador"]}</div>
            <div class="jugador-club">${jugador["Club Actual"]}</div>
          </div>
          <div class="ranking-valor">${jugador["Goles"]} ⚽</div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  function generarTopAsistencias() {
    const asistidores = jugadores
      .filter(jugador => parseInt(jugador["Asistencias"]) > 0)
      .sort((a, b) => parseInt(b["Asistencias"]) - parseInt(a["Asistencias"]))
      .slice(0, 5);

    const container = document.getElementById('top-asistencias');
    container.innerHTML = '';

    if (asistidores.length === 0) {
      container.innerHTML = '<div class="empty-state">📊 No hay datos de asistencias disponibles</div>';
      return;
    }

    asistidores.forEach((jugador, index) => {
      const item = document.createElement('div');
      item.className = 'ranking-item fade-in';
      item.style.animationDelay = `${index * 0.1}s`;
      
      item.innerHTML = `
        <div class="ranking-position">#${index + 1}</div>
        <div class="ranking-info">
          <div>
            <div class="jugador-nombre">${jugador["Jugador"]}</div>
            <div class="jugador-club">${jugador["Club Actual"]}</div>
          </div>
          <div class="ranking-valor">${jugador["Asistencias"]} 🎯</div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  function generarRendimientoMinutos() {
    const conMinutos = jugadores
      .filter(jugador => parseInt(jugador["Minutos Jugados"]) > 0)
      .sort((a, b) => parseInt(b["Minutos Jugados"]) - parseInt(a["Minutos Jugados"]))
      .slice(0, 5);

    const container = document.getElementById('rendimiento-minutos');
    container.innerHTML = '';

    if (conMinutos.length === 0) {
      container.innerHTML = '<div class="empty-state">📊 No hay datos de minutos disponibles</div>';
      return;
    }

    conMinutos.forEach((jugador, index) => {
      const minutos = parseInt(jugador["Minutos Jugados"]);
      const horas = Math.floor(minutos / 60);
      const minutosRestantes = minutos % 60;
      
      const item = document.createElement('div');
      item.className = 'ranking-item fade-in';
      item.style.animationDelay = `${index * 0.1}s`;
      
      item.innerHTML = `
        <div class="ranking-position">#${index + 1}</div>
        <div class="ranking-info">
          <div>
            <div class="jugador-nombre">${jugador["Jugador"]}</div>
            <div class="jugador-club">${jugador["Club Actual"]}</div>
          </div>
          <div class="ranking-valor">${horas}h ${minutosRestantes}m ⏱️</div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  function generarDistribucionClubes() {
    const clubesMap = {};
    
    jugadores.forEach(jugador => {
      const club = jugador["Club Actual"];
      if (!clubesMap[club]) {
        clubesMap[club] = {
          nombre: club,
          jugadores: 0,
          escudo: jugador["Escudo"] || 'logo-escudo.png'
        };
      }
      clubesMap[club].jugadores++;
    });

    const clubes = Object.values(clubesMap)
      .sort((a, b) => b.jugadores - a.jugadores);

    const container = document.getElementById('distribucion-clubes');
    container.innerHTML = '';

    clubes.forEach((club, index) => {
      const item = document.createElement('div');
      item.className = 'club-item fade-in';
      item.style.animationDelay = `${index * 0.1}s`;
      
      item.innerHTML = `
        <div class="club-logo">
          <img src="img/${club.escudo}" alt="${club.nombre}" style="width: 50px; height: 50px; border-radius: 50%;" />
        </div>
        <div class="club-nombre">${club.nombre}</div>
        <div class="club-jugadores">${club.jugadores} jugador${club.jugadores !== 1 ? 'es' : ''}</div>
      `;
      
      container.appendChild(item);
    });
  }

  function generarAnalisisPosiciones() {
    const posicionesMap = {};
    
    jugadores.forEach(jugador => {
      const posicion = jugador["Posición"];
      if (!posicionesMap[posicion]) {
        posicionesMap[posicion] = {
          nombre: posicion,
          jugadores: 0,
          goles: 0,
          asistencias: 0
        };
      }
      posicionesMap[posicion].jugadores++;
      posicionesMap[posicion].goles += parseInt(jugador["Goles"]) || 0;
      posicionesMap[posicion].asistencias += parseInt(jugador["Asistencias"]) || 0;
    });

    const posiciones = Object.values(posicionesMap)
      .sort((a, b) => b.jugadores - a.jugadores);

    const container = document.getElementById('analisis-posiciones');
    container.innerHTML = '';

    posiciones.forEach((posicion, index) => {
      const item = document.createElement('div');
      item.className = 'posicion-item fade-in';
      item.style.animationDelay = `${index * 0.1}s`;
      
      item.innerHTML = `
        <div class="posicion-nombre">${posicion.nombre}</div>
        <div class="posicion-stats">
          ${posicion.jugadores} jugadores<br>
          ${posicion.goles} goles • ${posicion.asistencias} asistencias
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  function generarJugadoresDestacados() {
    // Calcular jugadores destacados con diferentes criterios
    const destacados = [];
    
    // Máximo goleador
    const maxGoleador = jugadores.reduce((max, jugador) => 
      parseInt(jugador["Goles"]) > parseInt(max["Goles"]) ? jugador : max
    );
    if (parseInt(maxGoleador["Goles"]) > 0) {
      destacados.push({
        jugador: maxGoleador,
        logro: "Máximo Goleador",
        stats: {
          principal: maxGoleador["Goles"],
          secundario: maxGoleador["Partidos Jugados"],
          labels: ["Goles", "Partidos"]
        }
      });
    }

    // Máximo asistidor
    const maxAsistidor = jugadores.reduce((max, jugador) => 
      parseInt(jugador["Asistencias"]) > parseInt(max["Asistencias"]) ? jugador : max
    );
    if (parseInt(maxAsistidor["Asistencias"]) > 0) {
      destacados.push({
        jugador: maxAsistidor,
        logro: "Máximo Asistidor",
        stats: {
          principal: maxAsistidor["Asistencias"],
          secundario: maxAsistidor["Partidos Jugados"],
          labels: ["Asistencias", "Partidos"]
        }
      });
    }

    // Más minutos jugados
    const maxMinutos = jugadores.reduce((max, jugador) => 
      parseInt(jugador["Minutos Jugados"]) > parseInt(max["Minutos Jugados"]) ? jugador : max
    );
    if (parseInt(maxMinutos["Minutos Jugados"]) > 0) {
      destacados.push({
        jugador: maxMinutos,
        logro: "Más Activo",
        stats: {
          principal: Math.floor(parseInt(maxMinutos["Minutos Jugados"]) / 60),
          secundario: maxMinutos["Partidos Jugados"],
          labels: ["Horas", "Partidos"]
        }
      });
    }

    const container = document.getElementById('destacados-container');
    container.innerHTML = '';

    if (destacados.length === 0) {
      container.innerHTML = '<div class="empty-state">⭐ No hay jugadores destacados disponibles</div>';
      return;
    }

    destacados.forEach((destacado, index) => {
      const iniciales = destacado.jugador["Jugador"].split(' ')
        .map(nombre => nombre[0])
        .slice(0, 2)
        .join('');
      
      const item = document.createElement('div');
      item.className = 'destacado-card fade-in';
      item.style.animationDelay = `${index * 0.1}s`;
      
      item.innerHTML = `
        <div class="destacado-avatar">${iniciales}</div>
        <div class="destacado-nombre">${destacado.jugador["Jugador"]}</div>
        <div class="destacado-logro">${destacado.logro}</div>
        <div class="destacado-stats">
          <div class="destacado-stat">
            <span class="destacado-stat-number">${destacado.stats.principal}</span>
            <span class="destacado-stat-label">${destacado.stats.labels[0]}</span>
          </div>
          <div class="destacado-stat">
            <span class="destacado-stat-number">${destacado.stats.secundario}</span>
            <span class="destacado-stat-label">${destacado.stats.labels[1]}</span>
          </div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  function actualizarVista() {
    // Mostrar/ocultar categorías según el filtro
    const categorias = document.querySelectorAll('.analisis-categoria');
    
    categorias.forEach(categoria => {
      if (categoriaActual === 'todos') {
        categoria.style.display = 'block';
      } else {
        const id = categoria.id;
        if (id.includes(categoriaActual)) {
          categoria.style.display = 'block';
        } else {
          categoria.style.display = 'none';
        }
      }
    });
  }

  function mostrarError() {
    document.getElementById('contenido-principal').innerHTML = `
      <div class="error-container">
        <div class="error-icon">❌</div>
        <h3>Error al cargar datos</h3>
        <p>No se pudieron cargar las estadísticas. Por favor, recarga la página.</p>
      </div>
    `;
  }

  // Función para manejar el clic en elementos interactivos
  document.addEventListener('click', function(e) {
    if (e.target.closest('.ranking-item')) {
      const item = e.target.closest('.ranking-item');
      item.style.transform = 'scale(0.98)';
      setTimeout(() => {
        item.style.transform = '';
      }, 150);
    }
  });
});
