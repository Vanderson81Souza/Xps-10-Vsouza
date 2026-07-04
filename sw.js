// ==========================================================================
// PWA SERVICE WORKER - MOTOR DE CACHE OFFLINE E PRE-RENDERING (Vsouza)
// ==========================================================================

// Identificador único da versão do cache (atualize se modificar a interface)
const NOME_CACHE = 'xps10-mixer-v2';

// Lista de arquivos vitais que serão instalados localmente na memória do tablet
const ARQUIVOS_ESTATICOS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-1024.png'
];

/**
 * Evento de Instalação (INSTALL)
 * É disparado assim que o app é reconhecido. Baixa e armazena os arquivos no cache de disco.
 */
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(NOME_CACHE).then((cache) => {
            console.log('PWA: Gravando arquivos estáticos no cache local de armazenamento...');
            return cache.addAll(ARQUIVOS_ESTATICOS);
        }).then(() => self.skipWaiting()) // Força o Service Worker a se tornar ativo imediatamente
    );
});

/**
 * Evento de Ativação (ACTIVATE)
 * Limpa caches antigos de versões anteriores para evitar bugs de layout ou scripts velhos.
 */
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((chavesCache) => {
            return Promise.all(
                chavesCache.map((chave) => {
                    if (chave !== NOME_CACHE) {
                        console.log('PWA: Removendo cache antigo obsoleto:', chave);
                        return caches.delete(chave);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Assume o controle da página imediatamente
    );
});

/**
 * Evento de Interceptação de Rede (FETCH)
 * Intercepta as requisições do app. Se o arquivo estiver no cache do tablet, carrega do disco.
 * Se não estiver (ou se falhar), tenta buscar na rede HTTP.
 */
self.addEventListener('fetch', (evento) => {
    if (evento.request.method !== 'GET') return;

    evento.respondWith(
        caches.match(evento.request).then((respostaArmazenada) => {
            if (respostaArmazenada) {
                return respostaArmazenada;
            }

            return fetch(evento.request).then((respostaRede) => {
                if (!respostaRede || respostaRede.status !== 200 || !['basic', 'cors'].includes(respostaRede.type)) {
                    return respostaRede;
                }

                const respostaParaCache = respostaRede.clone();
                caches.open(NOME_CACHE).then((cache) => {
                    cache.put(evento.request, respostaParaCache);
                });

                return respostaRede;
            }).catch(() => {
                if (evento.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                console.log('PWA: Dispositivo sem conectividade. Rodando em modo 100% isolado.');
            });
        })
    );
});
