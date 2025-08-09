// Service Worker para PWA
const CACHE_NAME = 'info-avellared-v1';
const urlsToCache = [
  '/',
  '/Index.html',
  '/resumen.html',
  '/proximos.html',
  '/estilos.css',
  '/resumen.css',
  '/script.js',
  '/resumen.js',
  '/proximos.js',
  '/img/diablo_logo_pag.png'
];

// Instalación del service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver desde cache si está disponible
        if (response) {
          return response;
        }
        
        // Sino, hacer fetch a la red
          return fetch(event.request)
            .then(response => {
              // No cachear si la respuesta no es válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              // Clonar la respuesta
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            })
            .catch(error => {
              // Si falla la red, puedes devolver una página offline o simplemente nada
              // return caches.match('/offline.html'); // Si tienes una página offline
              return new Response('Sin conexión a internet', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
      })
  );
});

// Limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
