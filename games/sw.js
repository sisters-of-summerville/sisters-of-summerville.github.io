const CACHE = "sisters-chaos-arcade-v16";
const ASSETS = [
  "./", "index.html", "styles.css?v=16", "game.js?v=16", "manifest.webmanifest",
  "assets/living-room.webp", "assets/backyard.webp", "assets/acorn-green.webp", "assets/bootsie-search-room.webp",
  "assets/honey-roomba.webp", "assets/bootsie.webp", "assets/nimble-nut.webp",
  "assets/nimble-nut-squashed.webp", "assets/maggie-jean.webp", "assets/caddy-hack.webp", "assets/ace-forgetful.webp",
  "assets/icon-192.png", "assets/icon-512.png",
  "assets/pond-rescue.png", "assets/pond-props.png", "assets/wildlife-rescuer.png", "assets/radar.png", "assets/meemaw.png", "assets/beau.png", "assets/belle.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isCore = event.request.mode === "navigate" || /\/(?:games\/)?(?:index\.html|game\.js|styles\.css)$/.test(url.pathname);

  if (isCore) {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
