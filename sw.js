// ===============================================
// SERVICE WORKER - CACHE OFFLINE Y RENDIMIENTO
// ===============================================

const CACHE_NAME = 'infoavellared-v1.0';
const STATIC_CACHE = 'static-v1.0';
const DYNAMIC_CACHE = 'dynamic-v1.0';

// Recursos para cachear inmediatamente
const STATIC_ASSETS = [
  '/',
  '/Index.html',
  '/resumen.html',
  '/proximos.html',
  '/estilos.css',
  '/optimizaciones.css',
  '/script.js',
  '/optimizaciones.js',
  '/feedback-system.js',
  '/data.json',
  '/img/ca_independiente.png'
];

// Recursos para cachear dinámicamente
const DYNAMIC_ASSETS = [
  '/img/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/'
];

// ===============================================
// INSTALACIÓN DEL SERVICE WORKER
// ===============================================

self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Service Worker: Cacheando archivos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Error en instalación', error);
      })
  );
});

// ===============================================
// ACTIVACIÓN DEL SERVICE WORKER
// ===============================================

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Limpiar caches antiguos
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Limpiando cache antiguo', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activación completada');
        return self.clients.claim();
      })
  );
});

// ===============================================
// INTERCEPTACIÓN DE REQUESTS (FETCH)
// ===============================================

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar requests HTTP/HTTPS
  if (!request.url.startsWith('http')) return;
  
  // Estrategia de cache según el tipo de recurso
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (isImageRequest(request.url)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// ===============================================
// ESTRATEGIAS DE CACHE
// ===============================================

// Cache First - Para recursos estáticos
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📱 Cache hit:', request.url);
      return cachedResponse;
    }
    
    console.log('🌐 Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache First error:', error);
    return new Response('Recurso no disponible offline', { status: 503 });
  }
}

// Network First - Para APIs y datos dinámicos
async function networkFirst(request, cacheName = DYNAMIC_CACHE) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('🌐 Network success, cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📱 Network failed, trying cache:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Datos no disponibles offline', { 
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Offline', message: 'Datos no disponibles' })
    });
  }
}

// Stale While Revalidate - Para contenido que puede estar desactualizado
async function staleWhileRevalidate(request, cacheName = DYNAMIC_CACHE) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const networkPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Devolver cache inmediatamente si existe, sino esperar red
  if (cachedResponse) {
    console.log('📱 Stale cache served:', request.url);
    return cachedResponse;
  }
  
  console.log('🌐 No cache, waiting for network:', request.url);
  return networkPromise || new Response('Contenido no disponible', { status: 503 });
}

// ===============================================
// UTILIDADES
// ===============================================

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('.css') ||
         url.includes('.js') ||
         url.includes('.html');
}

function isAPIRequest(url) {
  return url.includes('/api/') ||
         url.includes('.json') ||
         url.includes('data.json');
}

function isImageRequest(url) {
  return url.includes('/img/') ||
         url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

// ===============================================
// EVENTOS DE BACKGROUND
// ===============================================

// Background Sync - Para cuando vuelve la conexión
self.addEventListener('sync', event => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Actualizar datos críticos cuando vuelve la conexión
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await fetch('/data.json');
    
    if (response.ok) {
      await cache.put('/data.json', response.clone());
      console.log('✅ Background sync: Datos actualizados');
      
      // Notificar a los clientes (silenciosamente)
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'DATA_UPDATED',
          message: 'Datos actualizados en background'
        });
      });
    }
  } catch (error) {
    console.error('❌ Background sync error:', error);
  }
}

// Push Notifications (para futuras notificaciones)
self.addEventListener('push', event => {
  console.log('📩 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/img/ca_independiente.png',
    badge: '/img/ca_independiente.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Info AvellaRED', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// ===============================================
// MENSAJES DESDE EL CLIENTE
// ===============================================

self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ cacheSize: size });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('📨 Unknown message type:', type);
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// ===============================================
// LOGGING Y DEBUGGING
// ===============================================

console.log('🔧 Service Worker cargado correctamente');
console.log('📦 Caches configurados:', { STATIC_CACHE, DYNAMIC_CACHE });
console.log('📋 Recursos estáticos:', STATIC_ASSETS.length);

// Reportar estado del Service Worker
self.addEventListener('install', () => {
  console.log('📊 Service Worker Stats:', {
    version: CACHE_NAME,
    staticAssets: STATIC_ASSETS.length,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

self.addEventListener('error', event => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
