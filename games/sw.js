const CACHE = "sisters-chaos-arcade-v5";
const ASSETS = [
  "./", "index.html", "styles.css", "game.js", "manifest.webmanifest",
  "assets/living-room.webp", "assets/backyard.webp", "assets/acorn-green.webp", "assets/bootsie-search-room.webp",
  "assets/honey-roomba.webp", "assets/bootsie.webp", "assets/nimble-nut.webp",
  "assets/nimble-nut-squashed.webp", "assets/maggie-jean.webp", "assets/caddy-hack.webp",
  "assets/icon-192.png", "assets/icon-512.png"
];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate" || /\.(?:css|js)$/.test(new URL(event.request.url).pathname)) {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
