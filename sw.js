// キャッシュのバージョン。
// キャッシュの内容が変更されたときに更新する。
const VERSION = "v1";

// キャッシュの名前。
// バージョンを含めることで、古いキャッシュと区別できるようにする。
const CACHE_NAME = `pwa-mini-${VERSION}`;

// アプリが機能するために必要な静的リソース。
// これらのリソースは、インストールイベントでキャッシュに保存される。
const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/app.js",
  "/style.css",
  "/icons/maskable_icon_x48.png",
  "/icons/maskable_icon_x96.png",
  "/icons/maskable_icon_x192.png",
];

// インストールイベントで、アプリの静的リソースをキャッシュに保存する
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })(),
  );
});

// アクティベートイベントで、古いキャッシュを削除する
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
          return undefined;
        }),
      );
      await clients.claim();
    })(),
  );
});

// フェッチイベントで、サーバーへのリクエストをインターセプトし、
// ネットワークに行く代わりにキャッシュされたレスポンスで応答する 
self.addEventListener("fetch", (event) => {
  // As a single page app, direct app to always go to cached home page.
  if (event.request.mode === "navigate") {
    event.respondWith(caches.match("/"));
    return;
  }

  // ネットワークに行く前にキャッシュを確認する。
  // キャッシュにあればそれを返し、なければ404を返す。
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request.url);
      if (cachedResponse) {
        // キャッシュされたレスポンスが存在する場合は、それを返す。
        return cachedResponse;
      }
      // キャッシュにないリソースは404を返す。
      return new Response(null, { status: 404 });
    })(),
  );
});