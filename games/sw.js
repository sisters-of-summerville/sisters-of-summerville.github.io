const CACHE = "sisters-chaos-arcade-v4";
const ASSETS = [
  "./", "index.html", "styles.css", "game.js", "manifest.webmanifest",
  "assets/living-room.webp", "assets/backyard.webp", "assets/acorn-green.webp", "assets/bootsie-search-room.webp",
  "assets/honey-roomba.webp", "assets/bootsie.webp", "assets/nimble-nut.webp",
  "assets/nimble-nut-squashed.webp", "assets/maggie-jean.webp", "assets/caddy-hack.webp",
  "assets/icon-192.png", "assets/icon-512.png"
];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
