function convertirFecha(valor) {
  const numero = Number(valor);

  // Formato DD/MM/YYYY (nuevo formato) - ya está en formato legible
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

function extraerHoraPartido(valor) {
  if (typeof valor === "string") {
    const match = valor.match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  }
  return '';
}

function obtenerTimestamp(valor) {
  const numero = Number(valor);
  
  // Si es el nuevo formato "miércoles, 06/08/2025 - 20:00"
  if (typeof valor === "string" && valor.includes(' - ')) {
    const [fechaParte, horaParte] = valor.split(' - ');
    // Extraer solo la fecha DD/MM/YYYY
    const fechaMatch = fechaParte.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (fechaMatch) {
      const soloFecha = fechaMatch[1];
      const [dia, mes, año] = soloFecha.split('/');
      return new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia)).getTime();
    }
  }
  
  // Formato DD/MM/YYYY (nuevo formato)
  if (typeof valor === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [dia, mes, año] = valor.split('/');
    return new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia)).getTime();
  }
  
  // Formato YYYY-MM-DD
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return new Date(valor).getTime();
  }
  
  // Timestamp numérico
  if (!isNaN(numero) && numero > 1_500_000_000_000) {
    return numero;
  }
  
  // Número de serie de Excel
  if (!isNaN(numero) && numero > 30000 && numero < 60000) {
    return (numero - 25569) * 86400 * 1000;
  }
  
  return 0;
}

function obtenerDiasHastaPartido(fechaPartido) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  let timestamp = 0;
  
  // Si es el nuevo formato "miércoles, 06/08/2025 - 20:00"
  if (typeof fechaPartido === "string" && fechaPartido.includes(' - ')) {
    const [fechaParte, horaParte] = fechaPartido.split(' - ');
    const fechaMatch = fechaParte.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (fechaMatch) {
      const soloFecha = fechaMatch[1];
      const [dia, mes, año] = soloFecha.split('/');
      timestamp = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia)).getTime();
    }
  } else {
    timestamp = obtenerTimestamp(fechaPartido);
  }
  
  const fecha = new Date(timestamp);
  fecha.setHours(0, 0, 0, 0);
  
  const diferencia = fecha.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24));
}

function generarIniciales(nombre) {
  return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatearFechaBonita(valor) {
  if (typeof valor === "string" && valor.includes(' - ')) {
    const [fechaParte, horaParte] = valor.split(' - ');
    const fechaMatch = fechaParte.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (fechaMatch) {
      const soloFecha = fechaMatch[1];
      const [dia, mes, año] = soloFecha.split('/');
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
      const nombreMes = fecha.toLocaleDateString("es-AR", { month: "short" });
      return `${dia} ${nombreMes}`;
    }
  }
  return valor;
}

function crearTarjetaPartido(jugador, index) {
  const horaPartido = extraerHoraPartido(jugador["Próximo Partido"]);
  const esProximo = index === 0;
  const diasHasta = obtenerDiasHastaPartido(jugador["Próximo Partido"]);
  
  // Formato estético para la fecha
  let etiquetaTiempo = '';
  if (diasHasta === 0) {
    etiquetaTiempo = `🔥 HOY${horaPartido ? ` - ${horaPartido}` : ''}`;
  } else if (diasHasta === 1) {
    etiquetaTiempo = `⚡ MAÑANA${horaPartido ? ` - ${horaPartido}` : ''}`;
  } else if (diasHasta <= 7) {
    etiquetaTiempo = `📅 En ${diasHasta} días${horaPartido ? ` - ${horaPartido}` : ''}`;
  } else {
    // Para fechas más lejanas, mostrar fecha bonita
    const fechaFormateada = formatearFechaBonita(jugador["Próximo Partido"]);
    etiquetaTiempo = `📆 ${fechaFormateada}${horaPartido ? ` - ${horaPartido}` : ''}`;
  }

  const iniciales = generarIniciales(jugador["Jugador"]);
  const clubActual = jugador["Club Actual"] || 'Club Desconocido';
  const proximoRival = jugador["Próximo Rival"] || 'Rival por definir';
  const posicion = jugador["Posición"] || 'Posición';

  return `
    <div class="partido-card ${esProximo ? 'partido-destacado' : ''}">
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
  
  fetch('data.json?v=20250805v1')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(jugadores => {
      console.log('Datos cargados:', jugadores.length, 'jugadores');
      
      // Filtrar solo partidos futuros que tengan rival
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      todosLosPartidos = jugadores.filter(j => {
        const tienePartido = j["Próximo Partido"] && j["Próximo Partido"].trim() !== '';
        const tieneRival = j["Próximo Rival"] && j["Próximo Rival"].trim() !== '';
        
        if (!tienePartido || !tieneRival) {
          return false;
        }
        
        // Verificar que sea futuro
        const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
        const esFuturo = fechaPartido >= hoy.getTime();
        
        if (esFuturo) {
          console.log(`✅ ${j["Jugador"]}: ${j["Próximo Partido"]} vs ${j["Próximo Rival"]}`);
          return true;
        } else {
          console.log(`❌ ${j["Jugador"]}: partido pasado - ${j["Próximo Partido"]}`);
          return false;
        }
      });
      
      console.log('Total partidos futuros:', todosLosPartidos.length);

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

function mostrarLoading(mostrar) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = mostrar ? 'flex' : 'none';
  }
}

function actualizarContador(total) {
  const contador = document.getElementById('contador-partidos');
  if (contador) {
    contador.textContent = `${total} partido${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
  }
}
