const CACHE_NAME = 'sleep-pwa-cache-v6';
const CORE_ASSETS = [
  // App Shell 与核心路由
  '/',
  '/settings',
  '/records',
  '/sleep',
  '/onboarding',
  '/ui-preview',

  // PWA 安装与图标
  '/manifest.json',
  '/icon_192.png',
  '/icon_512.png',

  // 其他静态资源
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
  '/version.json',
];

// 从页面 HTML 中解析并预缓存 Next 构建产物（/_next/static/...）
async function warmCacheFromHtml(cache, path) {
  try {
    const res = await fetch(path);
    if (!res || res.status !== 200) return;
    const html = await res.text();
    const assetUrls = Array.from(html.matchAll(/(?:src|href)="(\/[_]next\/static\/[^\"]+)"/g)).map(m => m[1]);
    const uniqueAssets = [...new Set(assetUrls)];
    await Promise.allSettled(uniqueAssets.map(async (u) => {
      try {
        const r = await fetch(u);
        if (r && r.status === 200) await cache.put(u, r.clone());
      } catch {}
    }));
    // 把页面本身也缓存（如果尚未缓存）
    await cache.put(path, new Response(html, { headers: { 'Content-Type': 'text/html' } }));
  } catch {}
}

self.addEventListener('install', (event) => {
  // 预缓存核心资源与路由
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 使用容错方式逐个添加，避免单个 404/失败导致整个安装失败
      await Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url)));
      // 解析并预热关键页面引用的构建资源，提升首装离线体验
      const pagesToWarm = ['/', '/settings', '/records', '/sleep', '/onboarding', '/ui-preview'];
      for (const p of pagesToWarm) {
        await warmCacheFromHtml(cache, p);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  // 清理旧版本缓存
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return; // 只处理GET

  // 导航请求（HTML）：离线优先（Cache First），找不到则回退首页
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url.pathname);
        if (cached) return cached;
        const home = await cache.match('/');
        return home || Response.error();
      })()
    );
    return;
  }

  // 同源静态资源：离线优先（Cache First），同时后台尝试更新缓存
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) {
          // 后台异步更新（不阻塞响应）
          fetch(req)
            .then((res) => {
              if (res && res.status === 200) cache.put(req, res.clone());
            })
            .catch(() => {});
          return cached;
        }
        // 首次访问未缓存时尝试网络获取并缓存
        try {
          const res = await fetch(req);
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      })()
    );
  }
});