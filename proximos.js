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
    // Verificar si la hora está por definirse
    if (valor.toLowerCase().includes("por definirse") || valor.toLowerCase().includes("a definir")) {
      return "por definir";
    }

    // Buscar patrones de hora con AM/PM
    const matchAmPm = valor.match(/(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.|am|pm)/i);
    if (matchAmPm) {
      let hora = parseInt(matchAmPm[1]);
      const minutos = matchAmPm[2];
      const espm = matchAmPm[3].toLowerCase().includes('p');
      
      if (espm && hora !== 12) {
        hora += 12;
      } else if (!espm && hora === 12) {
        hora = 0;
      }
      
      return `${hora.toString().padStart(2, '0')}:${minutos}`;
    }

    // Buscar patrón de hora simple HH:MM
    const match24 = valor.match(/(\d{1,2}:\d{2})/);
    return match24 ? match24[1] : "";
  }
  return '';
}

function obtenerTimestamp(valor) {
  console.log(`obtenerTimestamp recibido: "${valor}"`);
  const numero = Number(valor);
  
  // Formatos del data.json actual
  // "mañana, 8:00 p.m." -> mañana
  if (typeof valor === "string" && valor.toLowerCase().includes("mañana")) {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    mañana.setHours(0, 0, 0, 0);
    console.log(`Detectado mañana: ${mañana.getTime()}`);
    return mañana.getTime();
  }

  // "hoy, 8:30 p.m." -> hoy
  if (typeof valor === "string" && valor.toLowerCase().includes("hoy")) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    console.log(`Detectado hoy: ${hoy.getTime()}`);
    return hoy.getTime();
  }

  // "23/8, Por definirse" -> extraer fecha sin hora
  const matchFechaSinHora = valor.match(/^(\d{1,2})\/(\d{1,2}),?\s*(por definirse|a definir)/i);
  if (matchFechaSinHora) {
    const [, dia, mes] = matchFechaSinHora;
    const año = new Date().getFullYear(); // Asumir año actual
    const fecha = new Date(año, parseInt(mes) - 1, parseInt(dia));
    fecha.setHours(0, 0, 0, 0);
    console.log(`Detectado fecha sin hora: ${dia}/${mes} -> ${fecha.getTime()}`);
    return fecha.getTime();
  }

  // "dom, 10/8, 8:00 p.m." -> extraer fecha
  const matchDiaFecha = valor.match(/(lun|mar|mié|jue|vie|sáb|dom),?\s*(\d{1,2})\/(\d{1,2}),?\s*(.*)/i);
  if (matchDiaFecha) {
    const [, diaAbrev, dia, mes] = matchDiaFecha;
    const año = new Date().getFullYear(); // Asumir año actual
    const fecha = new Date(año, parseInt(mes) - 1, parseInt(dia));
    fecha.setHours(0, 0, 0, 0);
    console.log(`Detectado formato día/fecha: ${diaAbrev} ${dia}/${mes} -> ${fecha.getTime()}`);
    return fecha.getTime();
  }

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
  
  console.log(`No se pudo procesar el valor: "${valor}", retornando 0`);
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

function formatearCargo(cargo) {
  // Si es "NO" o string no numérico, retornar tal como está
  if (!cargo || cargo === "NO" || isNaN(Number(cargo))) {
    return cargo;
  }

  // Si es numérico, formatear como pesos argentinos
  const numero = Number(cargo);
  if (numero === 0) {
    return "NO";
  }

  // Formatear con separador de miles
  return `$ ${numero.toLocaleString('es-AR')}`;
}

function formatearFechaBonita(valor) {
  // Formatos del data.json actual
  // "mañana, 8:00 p.m." -> "Mañana"
  if (typeof valor === "string" && valor.toLowerCase().includes("mañana")) {
    return "Mañana";
  }

  // "hoy, 8:30 p.m." -> "Hoy"
  if (typeof valor === "string" && valor.toLowerCase().includes("hoy")) {
    return "Hoy";
  }

  // "23/8, Por definirse" -> "23 ago (hora por definir)"
  const matchFechaSinHora = valor.match(/^(\d{1,2})\/(\d{1,2}),?\s*(por definirse|a definir)/i);
  if (matchFechaSinHora) {
    const [, dia, mes] = matchFechaSinHora;
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const mesAbrev = meses[parseInt(mes) - 1] || mes;
    return `${parseInt(dia)} ${mesAbrev} (hora por definir)`;
  }

  // "dom, 10/8, 8:00 p.m." -> "Dom 10 ago"
  const matchDiaFecha = valor.match(/(lun|mar|mié|jue|vie|sáb|dom),?\s*(\d{1,2})\/(\d{1,2}),?\s*(.*)/i);
  if (matchDiaFecha) {
    const [, diaAbrev, dia, mes] = matchDiaFecha;
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const mesAbrev = meses[parseInt(mes) - 1] || mes;
    return `${diaAbrev.charAt(0).toUpperCase() + diaAbrev.slice(1)} ${parseInt(dia)} ${mesAbrev}`;
  }

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
    if (horaPartido === "por definir") {
      etiquetaTiempo = `🔥 HOY (hora por definir)`;
    } else {
      etiquetaTiempo = `🔥 HOY${horaPartido ? ` - ${horaPartido}` : ''}`;
    }
  } else if (diasHasta === 1) {
    if (horaPartido === "por definir") {
      etiquetaTiempo = `⚡ MAÑANA (hora por definir)`;
    } else {
      etiquetaTiempo = `⚡ MAÑANA${horaPartido ? ` - ${horaPartido}` : ''}`;
    }
  } else if (diasHasta <= 7) {
    if (horaPartido === "por definir") {
      etiquetaTiempo = `📅 En ${diasHasta} días (hora por definir)`;
    } else {
      etiquetaTiempo = `📅 En ${diasHasta} días${horaPartido ? ` - ${horaPartido}` : ''}`;
    }
  } else {
    // Para fechas más lejanas, mostrar fecha bonita
    const fechaFormateada = formatearFechaBonita(jugador["Próximo Partido"]);
    if (horaPartido === "por definir") {
      etiquetaTiempo = `📆 ${fechaFormateada}`;
    } else {
      etiquetaTiempo = `📆 ${fechaFormateada}${horaPartido ? ` - ${horaPartido}` : ''}`;
    }
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
          console.log(`❌ ${j["Jugador"]}: sin partido (${j["Próximo Partido"]}) o rival (${j["Próximo Rival"]})`);
          return false;
        }
        
        // Verificar que sea futuro
        const fechaPartido = obtenerTimestamp(j["Próximo Partido"]);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const esFuturo = fechaPartido >= hoy.getTime();
        
        console.log(`Procesando ${j["Jugador"]}: "${j["Próximo Partido"]}" -> timestamp: ${fechaPartido}, hoy: ${hoy.getTime()}, esFuturo: ${esFuturo}`);
        
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
