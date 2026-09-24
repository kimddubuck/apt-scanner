/* 아파트 매치 서비스워커 — build 202609240917
   자동 생성 파일입니다. 고치려면 build_all.py 의 _sw 를 고치세요. */
const V = "am-202609240917";
const KEEP = ["/offline.html", "/icon-192.png"];

self.addEventListener("install", e => {
  //  새 버전을 바로 쓰게 합니다(옛 워커가 남아 옛 화면을 주는 일 방지)
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => c.addAll(KEEP)).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    //  이번 버전이 아닌 캐시는 전부 삭제
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  //  화면 이동 요청만 다룹니다. 그 밖(데이터·이미지·R2)은 건드리지 않습니다.
  if (req.method !== "GET" || req.mode !== "navigate") return;
  e.respondWith((async () => {
    try {
      return await fetch(req);            // 항상 네트워크 먼저 = 늘 최신
    } catch (err) {
      const c = await caches.open(V);     // 끊겼을 때만 안내 페이지
      return (await c.match("/offline.html")) ||
             new Response("오프라인", { status: 503 });
    }
  })());
});
