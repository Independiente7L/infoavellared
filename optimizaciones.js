// ===============================================
// OPTIMIZACIONES AVANZADAS - INFOAVELLARED
// ===============================================

class OptimizacionesAvanzadas {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    this.searchHistory = this.loadSearchHistory();
    this.favoritos = this.loadFavoritos();
    this.initOptimizaciones();
  }

  // ===============================================
  // SISTEMA DE CACHE LOCAL
  // ===============================================
  
  // Guardar en cache con timestamp
  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    // Guardar también en localStorage para persistencia
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  // Obtener del cache
  getCache(key) {
    // Primero verificar cache en memoria
    let cached = this.cache.get(key);
    
    // Si no está en memoria, verificar localStorage
    if (!cached) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          cached = JSON.parse(stored);
          this.cache.set(key, cached);
        }
      } catch (e) {
        console.warn('Error al leer cache:', e);
        return null;
      }
    }

    if (!cached) return null;

    // Verificar si el cache expiró
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return cached.data;
  }

  // Limpiar cache expirado
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        localStorage.removeItem(`cache_${key}`);
      }
    }
  }

  // ===============================================
  // BÚSQUEDA AVANZADA CON DEBOUNCE
  // ===============================================
  
  // Debounce para optimizar búsquedas
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Búsqueda inteligente con cache
  busquedaInteligente(query, jugadores) {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Normalizar query para búsqueda
    const queryNormalized = this.normalizeText(query);
    const resultados = jugadores.filter(jugador => {
      return this.normalizeText(jugador["Jugador"]).includes(queryNormalized) ||
             this.normalizeText(jugador["Club Actual"]).includes(queryNormalized) ||
             this.normalizeText(jugador["Posición"]).includes(queryNormalized);
    });

    // Guardar en cache
    this.setCache(cacheKey, resultados);
    
    // Guardar en historial de búsqueda
    this.addToSearchHistory(query);
    
    return resultados;
  }

  // Normalizar texto para búsqueda
  normalizeText(text) {
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .replace(/[^\w\s]/gi, " ")
               .trim();
  }

  // ===============================================
  // HISTORIAL DE BÚSQUEDA
  // ===============================================
  
  loadSearchHistory() {
    try {
      return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    } catch {
      return [];
    }
  }

  addToSearchHistory(query) {
    if (!query || query.length < 2) return;
    
    // Remover duplicados y mantener solo los últimos 10
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    this.searchHistory.unshift(query);
    this.searchHistory = this.searchHistory.slice(0, 10);
    
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  // Mostrar sugerencias de búsqueda
  mostrarSugerencias(inputElement) {
    const container = document.createElement('div');
    container.className = 'search-suggestions';
    container.innerHTML = '';
    
    if (this.searchHistory.length === 0) return;
    
    this.searchHistory.forEach(item => {
      const suggestion = document.createElement('div');
      suggestion.className = 'suggestion-item';
      suggestion.textContent = item;
      suggestion.addEventListener('click', () => {
        inputElement.value = item;
        inputElement.dispatchEvent(new Event('input'));
        container.remove();
      });
      container.appendChild(suggestion);
    });

    // Posicionar sugerencias
    const rect = inputElement.getBoundingClientRect();
    container.style.position = 'absolute';
    container.style.top = rect.bottom + 'px';
    container.style.left = rect.left + 'px';
    container.style.width = rect.width + 'px';
    
    document.body.appendChild(container);
    
    // Remover al hacer click fuera
    setTimeout(() => {
      document.addEventListener('click', function removeContainer(e) {
        if (!container.contains(e.target) && e.target !== inputElement) {
          container.remove();
          document.removeEventListener('click', removeContainer);
        }
      });
    }, 100);
  }

  // ===============================================
  // SISTEMA DE FAVORITOS
  // ===============================================
  
  loadFavoritos() {
    try {
      return JSON.parse(localStorage.getItem('favoritos') || '[]');
    } catch {
      return [];
    }
  }

  toggleFavorito(jugadorNombre) {
    const index = this.favoritos.indexOf(jugadorNombre);
    if (index > -1) {
      this.favoritos.splice(index, 1);
    } else {
      this.favoritos.push(jugadorNombre);
    }
    localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
    this.updateFavoritoButtons();
  }

  isFavorito(jugadorNombre) {
    return this.favoritos.includes(jugadorNombre);
  }

  updateFavoritoButtons() {
    document.querySelectorAll('.btn-favorito').forEach(btn => {
      const jugadorNombre = btn.dataset.jugador;
      if (this.isFavorito(jugadorNombre)) {
        btn.classList.add('favorito-activo');
        btn.innerHTML = '⭐';
      } else {
        btn.classList.remove('favorito-activo');
        btn.innerHTML = '☆';
      }
    });
  }

  // ===============================================
  // LAZY LOADING DE IMÁGENES
  // ===============================================
  
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // ===============================================
  // PRELOAD DE DATOS CRÍTICOS
  // ===============================================
  
  preloadCriticalData() {
    // Precargar escudos más comunes
    const escudosComunes = [
      'ca_independiente.png',
      'ca_boca_juniors.png',
      'ca_river_plate.png'
    ];

    escudosComunes.forEach(escudo => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = `img/${escudo}`;
      document.head.appendChild(link);
    });
  }

  // ===============================================
  // OPTIMIZACIÓN DE RENDIMIENTO
  // ===============================================
  
  optimizePerformance() {
    // Reducir repaints con requestAnimationFrame
    this.throttledRender = this.throttle(this.renderOptimized.bind(this), 16);
    
    // Limpiar cache periódicamente
    setInterval(() => {
      this.clearExpiredCache();
    }, 60000); // cada minuto
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  renderOptimized(jugadores) {
    requestAnimationFrame(() => {
      this.renderJugadores(jugadores);
    });
  }

  // ===============================================
  // MÉTRICAS Y ANALYTICS
  // ===============================================
  
  trackUserAction(action, data = {}) {
    const event = {
      action: action,
      timestamp: Date.now(),
      data: data
    };
    
    // Guardar métricas localmente
    const metrics = JSON.parse(localStorage.getItem('userMetrics') || '[]');
    metrics.push(event);
    
    // Mantener solo las últimas 100 acciones
    const recentMetrics = metrics.slice(-100);
    localStorage.setItem('userMetrics', JSON.stringify(recentMetrics));
  }

  // ===============================================
  // INICIALIZACIÓN
  // ===============================================
  
  initOptimizaciones() {
    // Aplicar optimizaciones al cargar la página
    document.addEventListener('DOMContentLoaded', () => {
      this.preloadCriticalData();
      this.optimizePerformance();
      this.initLazyLoading();
      this.setupAdvancedSearch();
      this.setupFavoritos();
    });
  }

  setupAdvancedSearch() {
    const buscador = document.getElementById('buscador');
    if (!buscador) return;

    // Agregar debounce a la búsqueda
    const debouncedSearch = this.debounce((e) => {
      const query = e.target.value;
      this.trackUserAction('search', { query: query });
      
      // Aquí se integraría con la función de búsqueda existente
      if (window.filtrarJugadores) {
        window.filtrarJugadores();
      }
    }, 300);

    buscador.addEventListener('input', debouncedSearch);
    
    // Mostrar sugerencias al hacer focus
    buscador.addEventListener('focus', () => {
      this.mostrarSugerencias(buscador);
    });
  }

  setupFavoritos() {
    // Se ejecutará cuando se rendericen los jugadores
    document.addEventListener('jugadoresRendered', () => {
      this.addFavoritoButtons();
    });
  }

  addFavoritoButtons() {
    document.querySelectorAll('.jugador').forEach(card => {
      if (card.querySelector('.btn-favorito')) return; // Ya tiene botón
      
      const jugadorNombre = card.querySelector('h3').textContent;
      const btnFavorito = document.createElement('button');
      btnFavorito.className = 'btn-favorito';
      btnFavorito.dataset.jugador = jugadorNombre;
      btnFavorito.innerHTML = this.isFavorito(jugadorNombre) ? '⭐' : '☆';
      
      btnFavorito.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorito(jugadorNombre);
        this.trackUserAction('toggleFavorite', { jugador: jugadorNombre });
      });
      
      card.querySelector('h3').appendChild(btnFavorito);
    });
  }
}

// ===============================================
// ESTILOS CSS PARA LAS OPTIMIZACIONES
// ===============================================

function addOptimizationStyles() {
  const styles = `
    /* Sugerencias de búsqueda */
    .search-suggestions {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .suggestion-item {
      padding: 10px 15px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      transition: background 0.2s;
    }
    
    .suggestion-item:hover {
      background: #f5f5f5;
    }
    
    .suggestion-item:last-child {
      border-bottom: none;
    }
    
    /* Botones de favoritos */
    .btn-favorito {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      margin-left: 10px;
      transition: transform 0.2s;
      color: #ffc107;
    }
    
    .btn-favorito:hover {
      transform: scale(1.2);
    }
    
    .btn-favorito.favorito-activo {
      color: #ff9800;
    }
    
    /* Lazy loading placeholder */
    img.lazy {
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    img.lazy.loaded {
      opacity: 1;
    }
    
    /* Indicador de carga */
    .loading-indicator {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(179, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      display: none;
      z-index: 9999;
    }
    
    .loading-indicator.show {
      display: block;
    }
    
    /* Optimización de animaciones */
    * {
      will-change: auto;
    }
    
    .jugador {
      contain: layout;
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// ===============================================
// INICIALIZACIÓN GLOBAL
// ===============================================

// Crear instancia global
window.optimizaciones = new OptimizacionesAvanzadas();

// Agregar estilos
addOptimizationStyles();

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptimizacionesAvanzadas;
}
