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

function obtenerDiasHastaPartido(fechaPartido) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche
  
  const fecha = new Date(obtenerTimestamp(fechaPartido));
  fecha.setHours(0, 0, 0, 0); // Normalizar a medianoche
  
  const diferencia = fecha.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24));
}

function generarIniciales(nombre) {
  return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function crearTarjetaPartido(jugador, index) {
  const fechaPartido = obtenerTimestamp(jugador["Próximo Partido"]);
  const diasHasta = obtenerDiasHastaPartido(jugador["Próximo Partido"]);
  const esHoy = diasHasta === 0;
  const esProximo = index === 0;
  
  let etiquetaTiempo = '';
  if (diasHasta < 0) {
    etiquetaTiempo = '⏰ PASADO';
  } else if (esHoy) {
    etiquetaTiempo = '🔥 HOY';
  } else if (diasHasta === 1) {
    etiquetaTiempo = '⚡ MAÑANA';
  } else if (diasHasta <= 7) {
    etiquetaTiempo = `📅 En ${diasHasta} días`;
  } else {
    etiquetaTiempo = `📆 ${convertirFecha(jugador["Próximo Partido"])}`;
  }

  const iniciales = generarIniciales(jugador["Jugador"]);
  const clubActual = jugador["Club Actual"] || 'Club Desconocido';
  const proximoRival = jugador["Próximo Rival"] || 'Rival por definir';
  const posicion = jugador["Posición"] || 'Posición';

  return `
    <div class="partido-card ${esProximo ? 'partido-destacado' : ''}" data-dias="${diasHasta}">
      <div class="partido-header">
        <div class="jugador-avatar">${iniciales}</div>
        <div class="jugador-info">
          <h3>${jugador["Jugador"]}</h3>
          <div class="jugador-posicion">${posicion}</div>
        </div>
      </div>
      
      <div class="partido-info">
        <div class="fecha-partido">
          ${etiquetaTiempo}
        </div>
        
        <div class="equipos-container">
          <div class="equipo-info">
            <div class="equipo-nombre">${clubActual}</div>
            <div class="equipo-logo">
              <img src="img/${jugador["Escudo"]}" alt="Escudo ${clubActual}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
          </div>
          
          <div class="vs-separator">VS</div>
          
          <div class="equipo-info">
            <div class="equipo-nombre">${proximoRival}</div>
            <div class="equipo-logo">⚽</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Variables globales
let todosLosPartidos = [];
let partidosFiltrados = [];

document.addEventListener("DOMContentLoaded", () => {
  mostrarLoading(true);
  
  fetch('data.json?v=20250801v5')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(jugadores => {
      // Filtra solo los partidos que aún no se jugaron
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      todosLosPartidos = jugadores.filter(j => {
        const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
        const tieneRival = j["Próximo Rival"] && j["Próximo Rival"].trim() !== '';
        const esFuturo = fechaPartido >= hoy.getTime();
        
        return esFuturo && tieneRival;
      });

      // Aplica filtros iniciales
      aplicarFiltrosJS();
      
      mostrarLoading(false);
    })
    .catch(error => {
      console.error('Error al cargar los datos:', error);
      mostrarError(`Error al cargar los partidos: ${error.message}`);
      mostrarLoading(false);
    });
});

function aplicarFiltrosJS() {
  const buscador = document.getElementById('buscador-proximos')?.value.toLowerCase() || '';
  const filtroDias = document.getElementById('filtro-dias')?.value || '';
  const ordenFecha = document.getElementById('orden-fecha')?.value || 'asc';
  
  partidosFiltrados = todosLosPartidos.filter(jugador => {
    // Filtro de búsqueda
    const cumpleBusqueda = !buscador || 
      jugador["Jugador"].toLowerCase().includes(buscador) ||
      jugador["Club Actual"]?.toLowerCase().includes(buscador) ||
      jugador["Próximo Rival"]?.toLowerCase().includes(buscador);
    
    // Filtro de días
    let cumpleDias = true;
    if (filtroDias) {
      const diasHasta = obtenerDiasHastaPartido(jugador["Próximo Partido"]);
      cumpleDias = diasHasta <= parseInt(filtroDias);
    }
    
    return cumpleBusqueda && cumpleDias;
  });
  
  // Ordenamiento
  partidosFiltrados.sort((a, b) => {
    const fechaA = obtenerTimestamp(a["Próximo Partido"]);
    const fechaB = obtenerTimestamp(b["Próximo Partido"]);
    return ordenFecha === 'asc' ? fechaA - fechaB : fechaB - fechaA;
  });
  
  mostrarPartidos();
  actualizarContador(partidosFiltrados.length);
}

// Hacer la función disponible globalmente
window.aplicarFiltrosJS = aplicarFiltrosJS;

function mostrarPartidos() {
  const contenedor = document.getElementById("lista-proximos");
  const noPartidos = document.getElementById("no-partidos");
  
  if (!contenedor) return;
  
  if (partidosFiltrados.length === 0) {
    contenedor.style.display = 'none';
    if (noPartidos) noPartidos.style.display = 'flex';
    return;
  }
  
  if (noPartidos) noPartidos.style.display = 'none';
  contenedor.style.display = 'grid';
  
  contenedor.innerHTML = partidosFiltrados
    .map((jugador, index) => crearTarjetaPartido(jugador, index))
    .join('');
}

function mostrarError(mensaje) {
  const contenedor = document.getElementById("lista-proximos");
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>Error al cargar</h3>
        <p>${mensaje}</p>
      </div>
    `;
  }
}

// Hacer la función disponible globalmente
window.aplicarFiltrosJS = aplicarFiltrosJS;