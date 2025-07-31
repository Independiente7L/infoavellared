// ===============================================
// SISTEMA DE NOTIFICACIONES Y FEEDBACK
// ===============================================

class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 3;
    this.defaultDuration = 4000;
    this.init();
  }

  init() {
    // Crear contenedor de notificaciones si no existe
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
  }

  show(message, type = 'info', duration = this.defaultDuration) {
    const notification = this.createNotification(message, type);
    const container = document.getElementById('notification-container');
    
    // Limitar número de notificaciones
    if (this.notifications.length >= this.maxNotifications) {
      this.removeOldest();
    }
    
    container.appendChild(notification);
    this.notifications.push(notification);
    
    // Mostrar animación
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // Auto-remover después del tiempo especificado
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }
    
    return notification;
  }

  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = this.getIcon(type);
    const closeBtn = '<button class="notification-close" onclick="window.notifications.remove(this.parentElement)">×</button>';
    
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        ${closeBtn}
      </div>
    `;
    
    return notification;
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  remove(notification) {
    if (!notification || !notification.parentElement) return;
    
    notification.classList.add('hiding');
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
      this.notifications = this.notifications.filter(n => n !== notification);
    }, 300);
  }

  removeOldest() {
    if (this.notifications.length > 0) {
      this.remove(this.notifications[0]);
    }
  }

  // Métodos de conveniencia
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// ===============================================
// SISTEMA DE MÉTRICAS Y ANALYTICS
// ===============================================

class AnalyticsSystem {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.events = [];
    this.init();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    // Trackear eventos básicos
    this.trackPageLoad();
    this.trackUserInteractions();
    this.trackPerformance();
  }

  trackEvent(eventName, data = {}) {
    const event = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      eventName: eventName,
      data: data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.events.push(event);
    this.saveToStorage();
    
    // Enviar a consola para debug
    console.log(`📊 Analytics: ${eventName}`, data);
  }

  trackPageLoad() {
    window.addEventListener('load', () => {
      const loadTime = Date.now() - this.startTime;
      this.trackEvent('page_load', {
        loadTime: loadTime,
        totalJugadores: document.querySelectorAll('.jugador').length
      });
    });
  }

  trackUserInteractions() {
    // Trackear búsquedas
    const buscador = document.getElementById('buscador');
    if (buscador) {
      let searchTimeout;
      buscador.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.trackEvent('search', {
            query: e.target.value,
            queryLength: e.target.value.length
          });
        }, 1000);
      });
    }

    // Trackear filtros
    document.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', (e) => {
        this.trackEvent('filter_change', {
          filterId: e.target.id,
          value: e.target.value
        });
      });
    });

    // Trackear paginación
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-paginacion')) {
        this.trackEvent('pagination', {
          page: e.target.textContent
        });
      }
    });
  }

  trackPerformance() {
    // Trackear Web Vitals si está disponible
    if ('web-vitals' in window) {
      // Implementar Web Vitals tracking
    }
    
    // Trackear errores JavaScript
    window.addEventListener('error', (e) => {
      this.trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
    });
  }

  saveToStorage() {
    try {
      // Mantener solo los últimos 100 eventos
      const recentEvents = this.events.slice(-100);
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    } catch (e) {
      console.warn('No se pudieron guardar los analytics:', e);
    }
  }

  getReport() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      totalEvents: this.events.length,
      events: this.events,
      summary: this.generateSummary()
    };
  }

  generateSummary() {
    const eventCounts = {};
    this.events.forEach(event => {
      eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
    });
    
    return {
      mostCommonEvents: eventCounts,
      searchQueries: this.events
        .filter(e => e.eventName === 'search')
        .map(e => e.data.query)
        .filter(q => q && q.length > 0)
    };
  }
}

// ===============================================
// SISTEMA DE AYUDA CONTEXTUAL
// ===============================================

class HelpSystem {
  constructor() {
    this.tips = {
      buscador: "💡 Tip: Puedes buscar por nombre de jugador, club o posición",
      filtros: "🔍 Usa los filtros para encontrar jugadores específicos más rápido",
      favoritos: "⭐ Haz clic en la estrella para agregar jugadores a favoritos",
      paginacion: "📄 Navega entre páginas para ver todos los jugadores"
    };
    this.shown = new Set();
  }

  showTip(elementId, force = false) {
    if (this.shown.has(elementId) && !force) return;
    
    const element = document.getElementById(elementId);
    const tipText = this.tips[elementId];
    
    if (!element || !tipText) return;
    
    const tooltip = this.createTooltip(tipText);
    this.positionTooltip(tooltip, element);
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => tooltip.classList.add('show'), 100);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      this.removeTooltip(tooltip);
    }, 5000);
    
    this.shown.add(elementId);
  }

  createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'help-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        ${text}
        <button class="tooltip-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="tooltip-arrow"></div>
    `;
    return tooltip;
  }

  positionTooltip(tooltip, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.top = (rect.bottom + 10) + 'px';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.zIndex = '10000';
  }

  removeTooltip(tooltip) {
    tooltip.classList.add('hiding');
    setTimeout(() => {
      if (tooltip.parentElement) {
        tooltip.parentElement.removeChild(tooltip);
      }
    }, 300);
  }

  showWelcomeTour() {
    const steps = [
      { element: 'buscador', delay: 1000 },
      { element: 'filtros', delay: 3000 },
      { element: 'paginacion', delay: 5000 }
    ];
    
    steps.forEach(step => {
      setTimeout(() => {
        this.showTip(step.element, true);
      }, step.delay);
    });
  }
}

// ===============================================
// INTEGRACIÓN CON EL SISTEMA PRINCIPAL
// ===============================================

// Crear instancias globales
window.notifications = new NotificationSystem();
window.analytics = new AnalyticsSystem();
window.help = new HelpSystem();

// Agregar estilos para notificaciones
function addNotificationStyles() {
  const styles = `
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    }
    
    .notification {
      background: linear-gradient(135deg, #b30000, #d32f2f);
      color: white;
      border-radius: 12px;
      margin-bottom: 10px;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: auto;
    }
    
    .notification.show {
      transform: translateX(0);
      opacity: 1;
    }
    
    .notification.hiding {
      transform: translateX(100%);
      opacity: 0;
    }
    
    .notification.success {
      background: linear-gradient(135deg, #4caf50, #66bb6a);
    }
    
    .notification.error {
      background: linear-gradient(135deg, #f44336, #e57373);
    }
    
    .notification.warning {
      background: linear-gradient(135deg, #ff9800, #ffb74d);
    }
    
    .notification.info {
      background: linear-gradient(135deg, #2196f3, #64b5f6);
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      gap: 12px;
    }
    
    .notification-icon {
      font-size: 18px;
      flex-shrink: 0;
    }
    
    .notification-message {
      flex: 1;
      font-weight: 500;
    }
    
    .notification-close {
      background: none;
      border: none;
      color: currentColor;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }
    
    .notification-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .help-tooltip {
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border-radius: 8px;
      padding: 0;
      max-width: 300px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      pointer-events: auto;
    }
    
    .help-tooltip.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    .help-tooltip.hiding {
      opacity: 0;
      transform: translateY(-10px);
    }
    
    .tooltip-content {
      padding: 12px 16px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    
    .tooltip-close {
      background: none;
      border: none;
      color: currentColor;
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      margin-left: auto;
      flex-shrink: 0;
    }
    
    .tooltip-arrow {
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 8px solid rgba(0, 0, 0, 0.9);
      position: absolute;
      top: -8px;
      left: 20px;
    }
    
    @media (max-width: 768px) {
      .notification-container {
        top: 10px;
        right: 10px;
        left: 10px;
      }
      
      .notification {
        min-width: auto;
        max-width: none;
      }
      
      .help-tooltip {
        max-width: calc(100vw - 40px);
      }
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  addNotificationStyles();
  
  // Mostrar notificación de bienvenida
  setTimeout(() => {
    window.notifications.success('¡Sistema de optimizaciones cargado! 🚀');
  }, 1000);
  
  // Mostrar tour de ayuda para nuevos usuarios
  if (!localStorage.getItem('tour_shown')) {
    setTimeout(() => {
      window.help.showWelcomeTour();
      localStorage.setItem('tour_shown', 'true');
    }, 2000);
  }
});

// Exportar sistemas
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NotificationSystem,
    AnalyticsSystem,
    HelpSystem
  };
}
