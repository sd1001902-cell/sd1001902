// 离线缓存：有网时总是先拿最新版（顺手存一份），没网时用存下来的那份，游戏照样能打开。
// 只在自己的网址（GitHub Pages）上启用；claude.ai 链接里不会注册。
const CACHE = 'jiuyou-v1';
const CORE = ['data.js', 'story.js', 'quests.js', 'data2.js', 'maps.js', 'sprites.js', 'hero.js', 'vfx.js', 'gfx.js', 'engine.js', 'world.js', 'chapters.js', 'audio.js', 'ui.js'];
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'manifest-vi.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  ...CORE, ...CORE.map(f => 'vi/' + f), 'vi/zhn.js', 'vi/vi.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url), same = url.origin === location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await fetch(same ? new Request(req, { cache: 'no-cache' }) : req);
      if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('index.html') || await c.match('./') : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
