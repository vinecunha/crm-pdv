const CACHE_NAME = 'pdv-cache-v1';
const API_CACHE_NAME = 'pdv-api-cache-v1';

// Recursos para cache offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logomarca.png'
];

// Instalar - Cache inicial
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativar - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Ativado!');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Estratégia para API do Supabase
  if (url.pathname.startsWith('/rest/v1/')) {
    event.respondWith(handleApiRequest(event.request));
  } 
  // Estratégia para recursos estáticos
  else {
    event.respondWith(handleStaticRequest(event.request));
  }
});

// Estratégia: Network First (tenta rede, fallback para cache)
async function handleApiRequest(request) {
  try {
    // Tentar buscar da rede primeiro
    const networkResponse = await fetch(request);
    
    // Salvar no cache para uso offline
    const cache = await caches.open(API_CACHE_NAME);
    await cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Offline - buscar do cache
    console.log('📴 Offline - usando cache para:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não tem cache, retornar erro amigável
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'Você está offline. Os dados serão sincronizados quando a conexão voltar.' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Estratégia: Cache First (cache primeiro, fallback para rede)
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Atualizar cache em background
    fetch(request).then((networkResponse) => {
      cache.put(request, networkResponse);
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  // Não tem cache - buscar da rede
  try {
    const networkResponse = await fetch(request);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Offline e sem cache - página offline
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-sales') {
    console.log('🔄 Sincronizando vendas pendentes...');
    event.waitUntil(syncPendingSales());
  }
});

async function syncPendingSales() {
  try {
    // Abrir IndexedDB e buscar vendas pendentes
    const db = await openDatabase();
    const pendingSales = await getPendingSales(db);
    
    console.log(`📊 ${pendingSales.length} vendas para sincronizar`);
    
    for (const sale of pendingSales) {
      try {
        const response = await fetch('/rest/v1/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale)
        });
        
        if (response.ok) {
          await markAsSynced(db, sale.id);
          console.log(`✅ Venda ${sale.id} sincronizada`);
        }
      } catch (error) {
        console.error(`❌ Erro ao sincronizar venda ${sale.id}:`, error);
      }
    }
    
    // Notificar cliente que sincronização terminou
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: pendingSales.length
      });
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Helpers para IndexedDB (simplificados)
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pdv-offline-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingSales')) {
        db.createObjectStore('pendingSales', { keyPath: 'id' });
      }
    };
  });
}

async function getPendingSales(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSales'], 'readonly');
    const store = transaction.objectStore('pendingSales');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function markAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSales'], 'readwrite');
    const store = transaction.objectStore('pendingSales');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}