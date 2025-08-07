// Auto-actualización de cache silenciosa
(function() {
  // Solo ejecutar si es una recarga manual (F5)
  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry && navigationEntry.type === 'reload') {
    
    // Limpiar todos los caches silenciosamente
    if ('caches' in window) {
      caches.keys().then(function(names) {
        names.forEach(function(name) {
          caches.delete(name);
        });
      });
    }
  }
})();
