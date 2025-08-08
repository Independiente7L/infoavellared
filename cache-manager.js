// Gestión optimizada de caché y recarga
(function() {
  const navigationEntry = performance.getEntriesByType('navigation')[0];
  const isReload = navigationEntry && navigationEntry.type === 'reload';
  
  if (isReload) {
    // Preservar configuraciones importantes
    const tema = localStorage.getItem('theme');
    const favoritos = localStorage.getItem('favoritos');
    
    // Limpiar caché de manera eficiente
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Recargar CSS con timestamp
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = link.href.split('?')[0];
      link.href = `${href}?bust=${Date.now()}`;
    });
    
    // Restaurar configuraciones después de la limpieza
    setTimeout(() => {
      if (tema) localStorage.setItem('theme', tema);
      if (favoritos) localStorage.setItem('favoritos', favoritos);
    }, 100);
  }
})();
