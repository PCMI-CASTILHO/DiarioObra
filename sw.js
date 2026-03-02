// ======== SERVICE WORKER ========

// Nome do cache (mude a versão se alterar o HTML/CSS para forçar atualização)
const CACHE_NAME = 'version-v1';

// Lista de arquivos que devem ser acessíveis offline
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './sw.js'
];

// ======== INSTALAÇÃO: Salva os arquivos no cache ========
self.addEventListener('install', event => {
    console.log('🟢 SW: Instalando e salvando assets...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ======== ATIVAÇÃO: Limpa caches antigos ========
self.addEventListener('activate', event => {
    console.log('🔵 SW: Ativado.');
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

// ======== INTERCEPTAÇÃO (FETCH): Lógica de funcionamento offline ========
self.addEventListener('fetch', event => {
    // Apenas requisições GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se funcionar, salva uma cópia atualizada no cache
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => {
                // Se falhar (offline), tenta buscar no cache
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    
                    // Se for navegação de página e não achar, entrega o index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
