/* danji/chart.js — 단지 페이지의 '거래량 · 가격 · 손바뀜률' 3단 그래프 (단지페이지.py 가 danji/ 로 복사합니다)
   페이지마다 <script type="application/json" id="djd"> 에 분기별 숫자만 넣고, 그리는 일은 이 파일 하나가 합니다.
   d = {s:"2017-1"(첫 분기), v:[분기 거래 수], p:[주력 평형 분기 중앙값(백만원), 0=거래 없음],
        d:[[분기 위치, 가격(백만원)], ...] 주력 평형 거래 하나하나, t:[최근 4분기 거래÷세대수 %], h:세대수, ga:구 평균 %, pt:"주력 평형" } */
(function () {
  var el = document.getElementById("djc"), src = document.getElementById("djd");
  if (!el || !src) return;
  var D; try { D = JSON.parse(src.textContent); } catch (e) { return; }
  var n = D.v.length, y0 = +D.s.split("-")[0], q0 = +D.s.split("-")[1] - 1;
  var qlab = function (i) { var k = q0 + i; return (y0 + Math.floor(k / 4)) + "." + (k % 4 + 1) + "분기"; };
  var eok = function (m) { return m >= 100 ? (m / 100).toFixed(m >= 1000 ? 1 : 2).replace(/\.?0+$/, "") + "억" : m + "백만"; };
  var nice = function (v) { var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
  var tip = document.createElement("div"); tip.className = "djc-tip"; el.style.position = "relative";

  function draw() {
    var W = Math.max(300, el.clientWidth), L = 44, R = 10, hasT = D.t && D.t.length && D.h;
    var P1 = [20, 130], P2 = [P1[0] + P1[1] + 32, 90], P3 = [P2[0] + P2[1] + 32, 90];
    var BOT = hasT ? P3[0] + P3[1] : P2[0] + P2[1], H = BOT + 22;
    var X = function (i) { return L + (W - L - R) * (i + 0.5) / n; }, bw = Math.max(2, (W - L - R) / n * 0.7);
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block;font-size:11px;touch-action:pan-y">';
    var panel = function (y, h, t) { return '<text x="' + L + '" y="' + (y - 6) + '" fill="#4A4F55" font-weight="700">' + t + "</text>" +
      '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (y + h) + '" y2="' + (y + h) + '" stroke="#DCDCD6"/>'; };
    var axis = function (y, h, lo, hi, f) { var o = ""; [0, 0.5, 1].forEach(function (k) { var v = lo + (hi - lo) * k, yy = y + h - h * k;
      o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="#EFEFEA"/><text x="' + (L - 4) + '" y="' + (yy + 4) + '" text-anchor="end" fill="#8A9097">' + f(v) + "</text>"; }); return o; };
    // ① 가격 — 거래 점 + 분기 중앙값 선
    var ps = D.p.filter(function (v) { return v > 0; }).concat(D.d.map(function (x) { return x[1]; }));
    var lo = Math.min.apply(null, ps) * 0.95, hi = Math.max.apply(null, ps) * 1.03;
    var Y1 = function (v) { return P1[0] + P1[1] - P1[1] * (v - lo) / (hi - lo || 1); };
    s += panel(P1[0], P1[1], "가격 · " + D.pt) + axis(P1[0], P1[1], lo, hi, eok);
    D.d.forEach(function (x) { s += '<circle cx="' + (L + (W - L - R) * (x[0] + 0.5) / n).toFixed(1) + '" cy="' + Y1(x[1]).toFixed(1) + '" r="2.2" fill="#C9962B" opacity=".45"/>'; });
    var seg = [], segs = [];
    D.p.forEach(function (v, i) { if (v > 0) seg.push(X(i).toFixed(1) + "," + Y1(v).toFixed(1)); else if (seg.length > 1 && i > 0 && D.p[i - 1] > 0) { } });
    s += '<polyline fill="none" stroke="#16202E" stroke-width="2" points="' + seg.join(" ") + '"/>';
    // ② 거래량 (분기)
    var vhi = nice(Math.max(1, Math.max.apply(null, D.v)));
    var Y2 = function (v) { return P2[0] + P2[1] - P2[1] * v / vhi; };
    s += panel(P2[0], P2[1], "거래량 (분기 · 모든 평형)") + axis(P2[0], P2[1], 0, vhi, function (v) { return Math.round(v) + "건"; });
    D.v.forEach(function (v, i) { if (v) s += '<rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + Y2(v).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (P2[0] + P2[1] - Y2(v)).toFixed(1) + '" fill="#7AA7D8"/>'; });
    // ③ 손바뀜률 — 최근 4분기 거래 ÷ 세대수, 구 평균(점선)
    if (hasT) {
      var thi = nice(Math.max(0.5, Math.max.apply(null, D.t.concat([D.ga || 0])) * 1.1));
      var Y3 = function (v) { return P3[0] + P3[1] - P3[1] * v / thi; };
      s += panel(P3[0], P3[1], "손바뀜률 (최근 1년 거래 ÷ " + D.h.toLocaleString("ko-KR") + "세대)") + axis(P3[0], P3[1], 0, thi, function (v) { return v.toFixed(v < 10 ? 1 : 0) + "%"; });
      if (D.ga) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y3(D.ga) + '" y2="' + Y3(D.ga) + '" stroke="#B4441C" stroke-dasharray="5 4"/>' +
        '<text x="' + (W - R) + '" y="' + (Y3(D.ga) - 4) + '" text-anchor="end" fill="#B4441C">구 평균 ' + D.ga + "% (최근 1년)</text>";
      var tp = []; D.t.forEach(function (v, i) { if (v != null) tp.push(X(i).toFixed(1) + "," + Y3(v).toFixed(1)); });
      s += '<polyline fill="none" stroke="#3E9B8F" stroke-width="2.2" points="' + tp.join(" ") + '"/>';
    }
    for (var i = 0; i < n; i++) { var k = q0 + i; if (k % 4 === 0 && (y0 + Math.floor(k / 4)) % 2 === 0) s += '<text x="' + X(i) + '" y="' + (H - 4) + '" text-anchor="middle" fill="#8A9097">' + (y0 + Math.floor(k / 4)) + "</text>"; }
    s += '<line id="djx" x1="0" x2="0" y1="14" y2="' + BOT + '" stroke="#16202E" opacity="0"/></svg>';
    el.innerHTML = s; el.appendChild(tip);
    var svg = el.querySelector("svg"), cross = el.querySelector("#djx");
    var show = function (ev) {
      var p = svg.getBoundingClientRect(), t = ev.touches ? ev.touches[0] : ev, cx = t.clientX - p.left, cy = t.clientY - p.top;
      var i = Math.max(0, Math.min(n - 1, Math.floor((cx * W / p.width - L) / ((W - L - R) / n))));
      cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", ".35");
      var cnt = D.d.filter(function (x) { return Math.floor(x[0]) === i; }).length;
      tip.innerHTML = "<b>" + qlab(i) + "</b>" +
        '<div><i style="background:#fff"></i>' + D.pt.split("(")[0] + " 중앙값 <s>" + (D.p[i] ? eok(D.p[i]) : "거래 없음") + (cnt ? " (" + cnt + "건)" : "") + "</s></div>" +
        '<div><i style="background:#7AA7D8"></i>거래량 <s>' + D.v[i] + "건</s></div>" +
        (hasT && D.t[i] != null ? '<div><i style="background:#3E9B8F"></i>손바뀜률 <s>' + D.t[i] + "%</s></div>" : "");
      tip.style.display = "block";
      var tw = tip.offsetWidth, th = tip.offsetHeight, left = cx + 14;
      if (left + tw > p.width - 4) left = cx - tw - 14; if (left < 2) left = 2;
      tip.style.left = left + "px"; tip.style.top = Math.min(Math.max(4, cy - th / 2), p.height - th - 4) + "px";
    };
    svg.onmousemove = show; svg.ontouchstart = show; svg.ontouchmove = show;
    svg.onmouseleave = function () { tip.style.display = "none"; cross.setAttribute("opacity", "0"); };
  }
  draw();
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 200); });
})();
