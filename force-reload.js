// Forzar recarga completa sin caché
(function() {
  // Detectar recarga con F5
  if (performance.navigation.type === 1) {
    // Es una recarga - forzar limpieza total
    
    // Limpiar localStorage temporal (excepto configuraciones importantes)
    const tema = localStorage.getItem('theme');
    const favoritos = localStorage.getItem('favoritos');
    
    // Limpiar todo el caché
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Desregistrar service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Recargar CSS con timestamp
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = link.href.split('?')[0];
      link.href = `${href}?bust=${Date.now()}`;
    });
    
    // Operación silenciosa - sin notificaciones
    setTimeout(() => {
      // Restaurar configuraciones
      if (tema) localStorage.setItem('theme', tema);
      if (favoritos) localStorage.setItem('favoritos', favoritos);
    }, 1000);
  }
})();
