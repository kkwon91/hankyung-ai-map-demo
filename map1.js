/* 집코노미 첫 화면 '부동산맵' 모듈 (실제 첫 화면 지도 자리 900×441 안에서만 동작)
 * 자료: map.js(window.HK_MAP) — 지역 시세·거래·매물, 최근 30일 실거래·직전 최고가, 동네뉴스맵 기사
 *       data.js(window.HK) — 송파 시안 단지의 단지 전문 중개사(예시)
 */
window.PMAP = (function () {
  const M = window.HK_MAP, H = window.HK;
  const R = M.reg;
  // 휴대폰에서는 패널이 지도 아래로 내려가므로 지도 왼쪽을 비워 둘 필요가 없다
  const PW = () => (window.matchMedia && matchMedia('(max-width:600px)').matches) ? 0 : 300;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const SEOUL = M.sd['서울'];
  const asof = M.asof.slice(0, 4) + '년 ' + (+M.asof.slice(5, 7)) + '월';
  const W0 = M.window[0].slice(5).replace('-', '.'), W1 = M.window[1].slice(5).replace('-', '.');

  /* ── 숫자 표기(신문 표기: 29억5000만원 / 짧게 29.5억) ── */
  const eok = v => { const e = Math.floor(v / 10000), m = Math.round(v % 10000); return e ? `${e}억${m ? m + '만' : ''}원` : `${m}만원`; };
  const eokS = v => v >= 10000 ? (v / 10000).toFixed(v >= 1000000 ? 0 : 1).replace(/\.0$/, '') + '억' : Math.round(v).toLocaleString() + '만';
  const pctS = v => v == null ? '–' : Math.abs(v) < 0.005 ? '보합' : (v > 0 ? '+' : '−') + Math.abs(v).toFixed(Math.abs(v) < 1 ? 2 : 1) + '%';
  const updn = v => v == null ? 'flat' : v > 0.004 ? 'up' : v < -0.004 ? 'down' : 'flat';
  const ch = (a, k) => { if (!a) return null; const n = a.length - 1; return a[n] && a[n - k] ? (a[n] / a[n - k] - 1) * 100 : null; };
  const last = a => a ? a[a.length - 1] : null;
  const pyeong = pa => Math.round(pa * 1.32 / 3.3058); // 전용→공급 평형(대략)

  /* ── 지역 파생값 ── */
  Object.entries(R).forEach(([code, r]) => {
    r.code = code;
    r.c1 = ch(r.m, 1); r.c3 = ch(r.m, 3); r.c12 = ch(r.m, 12);
    r.jr = r.m && last(r.m) && r.j && last(r.j) ? Math.round(last(r.j) / last(r.m) * 100) : null;
    r.o3 = r.o ? ch(r.o, 3) : null;
    r.short = r.lv === 'sgg' ? r.n.replace(/(시|군|구)$/, m => r.n.length > 2 ? '' : m) : r.n;
    if (r.lv === 'sgg' && /\s/.test(r.n)) r.short = r.n.split(' ').pop().replace(/구$/, '');
    if (r.lv === 'sgg' && r.sd === '인천' && /^(중|동|남|서)구$/.test(r.n)) r.short = '인천' + r.n;
  });
  const DJ = M.danji.map(a => ({id: a[0], n: a[1], la: a[2], ln: a[3], hh: a[4], cy: a[5] > 1900 ? a[5] : 0, code: a[6], sgg: a[7], emd: a[8], sd: a[9], nt: a[10], nh: a[11], t: a[12]}));
  const DJI = Object.fromEntries(DJ.map(d => [d.id, d]));
  // 시안 송파 10개 단지 = 단지 전문 중개사(예시) 연결
  const PARTNER = {};
  H.DANJI.forEach(d => { if (d.master && d.master.status === 'sold') PARTNER[d.id] = d.master; });
  const DEMO = Object.fromEntries(H.DANJI.map(d => [d.id, d]));
  H.DANJI.forEach(d => { if (!DJI[d.id]) { const x = {id: d.id, n: d.name, la: d.lat, ln: d.lng, hh: d.hh, cy: +d.built.slice(0, 4), code: '', sgg: '송파구', emd: d.dong, sd: '서울', t: [], nt: 0, nh: 0, demo: 1}; DJ.push(x); DJI[d.id] = x; } });
  const HIGHS = [];
  DJ.forEach(d => d.t.forEach(t => { if (t[4]) HIGHS.push({d, t}); }));
  HIGHS.sort((a, b) => (b.t[0] > a.t[0] ? 1 : b.t[0] < a.t[0] ? -1 : b.t[3] - a.t[3]));
  const NEWS = M.news.map(a => ({aid: a[0], title: a[1], img: a[2], url: a[3], la: a[4], ln: a[5], code: a[6], place: a[7], date: a[8], pay: a[10]}));
  const sggOf = code => code ? code.slice(0, 5) + '00000' : '';

  /* ── 색 단계: 한경 상승 #b50000 / 하락 #2853b2, 보합은 회색 ── */
  const DIV = {up: ['#f6d9d6', '#eaa59f', '#d4675f', '#b50000'], dn: ['#d9e1f2', '#a5b6de', '#6680c2', '#2853b2'], flat: '#eceef1'};
  const SEQ = ['#e8ecf3', '#c3cde0', '#8fa1c6', '#5a72a8', '#142c67'];
  const STEPS = {c1: [0.05, 0.3, 0.7, 1.2], c12: [1, 4, 8, 14]};
  function divColor(v, key) {
    if (v == null) return '#f3f3f3';
    const s = STEPS[key], a = Math.abs(v);
    if (a < s[0]) return DIV.flat;
    const i = a < s[1] ? 0 : a < s[2] ? 1 : a < s[3] ? 2 : 3;
    return (v > 0 ? DIV.up : DIV.dn)[i];
  }
  const seqColor = (v, cuts) => v == null || v === 0 ? '#f3f3f3' : SEQ[cuts.findIndex(c => v < c) === -1 ? 4 : cuts.findIndex(c => v < c)];

  /* ── 상태 ── */
  let map, el, layer = 'news', metric = 'c1', view = {k: 'home'}, polys = {}, gSgg, gEmd, labels, marks, hist = [];

  /* ── 틀 ── */
  function html() {
    return `<div class="pm" id="pm">
      <div class="pm-tick" id="pmTick"></div>
      <div class="pm-map" id="pmMap"></div>
      <aside class="pm-panel" id="pmPanel">
        <div class="pm-ph"><a class="pm-back" id="pmBack" hidden aria-label="이전">‹</a><b class="pm-ttl">부동산맵 <span>›</span></b>
          <select class="pm-sel" id="pmSel"><option value="all">수도권</option><option value="${SEOUL}">서울</option><option value="${M.sd['경기']}">경기</option><option value="${M.sd['인천']}">인천</option>
          <optgroup label="서울 25개 구">${Object.values(R).filter(r => r.lv === 'sgg' && r.sd === '서울').sort((a, b) => a.n.localeCompare(b.n)).map(r => `<option value="${r.code}">${r.n}</option>`).join('')}</optgroup></select></div>
        <div class="pm-search"><input id="pmQ" type="search" placeholder="단지·동네 검색 (예: 헬리오시티, 잠실동)" autocomplete="off"><ul class="hk-ac" id="pmQL" hidden></ul></div>
        <div class="pm-body" id="pmBody"></div>
      </aside>
      <div class="pm-layers" id="pmLayers" role="tablist">${[['news', '뉴스'], ['price', '시세'], ['trade', '실거래'], ['high', '신고가']].map(([k, t]) => `<button data-l="${k}" class="${k === layer ? 'on' : ''}">${t}</button>`).join('')}</div>
      <div class="pm-legend" id="pmLegend"></div>
      <div class="pm-zoom"><button data-z="1" aria-label="확대">+</button><button data-z="-1" aria-label="축소">−</button></div>
    </div>`;
  }

  function mount(container) {
    el = container; el.innerHTML = html();
    map = L.map('pmMap', {zoomControl: false, scrollWheelZoom: true, wheelDebounceTime: 60, wheelPxPerZoomLevel: 90, zoomSnap: 1, zoomAnimation: false, minZoom: 9, maxZoom: 17, attributionControl: true, preferCanvas: false});
    window.addBase(map, {gray: true, className: 'pm-tiles'});
    map.fitBounds([[37.36, 126.62], [37.72, 127.24]], {paddingTopLeft: [PW(), 40], paddingBottomRight: [10, 10]});
    gSgg = L.geoJSON({type: 'FeatureCollection', features: M.geo.sgg}, {style: f => style(R[f.properties.code]), onEachFeature: bindPoly});
    gEmd = L.geoJSON({type: 'FeatureCollection', features: M.geo.emd}, {style: f => style(R[f.properties.code]), onEachFeature: bindPoly});
    labels = L.layerGroup().addTo(map); marks = L.layerGroup().addTo(map);
    map.on('zoomend moveend', () => { syncPolys(); draw(); if (view.k === 'home') panel(); });
    el.querySelectorAll('.pm-layers button').forEach(b => b.onclick = () => setLayer(b.dataset.l));
    el.querySelectorAll('.pm-zoom button').forEach(b => b.onclick = () => map.setZoom(map.getZoom() + +b.dataset.z));
    $('#pmBack').onclick = back;
    $('#pmSel').onchange = e => { const v = e.target.value; if (v === 'all') { map.fitBounds([[37.36, 126.62], [37.72, 127.24]], {paddingTopLeft: [PW(), 40]}); go({k: 'home'}, true); } else openRegion(v, true); };
    syncPolys(); draw(); panel(); legend(); ticker();
    if (window.DJP) DJP.bindSearch($('#pmQ'), $('#pmQL'), r => {
      if (r.t === 'r') { openRegion(r.code, true); return; }
      if (DJI[r.id]) { openDanji(r.id); return; }
      const s = (window.HK_SEARCH || []).find(x => x[0] === r.id);
      if (s) map.setView([s[6], s[7]], 16);
      location.hash = 'd/' + r.id;
    });
  }
  function ticker() {
    const sd = ['서울', '경기', '인천'].map(n => R[M.sd[n]]);
    const gu = Object.values(R).filter(r => r.lv === 'sgg' && r.sd === '서울' && r.c1 != null).sort((a, b) => b.c1 - a.c1);
    const s = R[SEOUL], ul = s.u ? last(s.u) : null;
    const item = r => `<a data-reg="${r.code}"><b>${esc(r.lv === 'sd' ? r.n : r.n)}</b><span class="num">${last(r.m).toLocaleString()}</span><i class="num ${updn(r.c1)}">${Math.abs(r.c1) < 0.005 ? '보합' : (r.c1 > 0 ? '▲' : '▼') + Math.abs(r.c1).toFixed(2) + '%'}</i></a>`;
    const extra = `<span class="x"><b>수도권 신고가</b><span class="num up">${sd.reduce((a, r) => a + (r.h30 || 0), 0).toLocaleString()}건</span><em>30일</em></span>` +
      (ul != null ? `<span class="x"><b>서울 미분양</b><span class="num">${ul.toLocaleString()}호</span><em>${M.umonths[M.umonths.length - 1].slice(5)}월</em></span>` : '') +
      (R[M.sd['경기']].u ? `<span class="x"><b>경기 미분양</b><span class="num">${last(R[M.sd['경기']].u).toLocaleString()}호</span></span>` : '');
    const row = sd.map(item).join('') + extra + gu.map(item).join('');
    const t = $('#pmTick');
    t.innerHTML = `<span class="lb">아파트 시세판<small>평당 만원 · 1개월</small></span><div class="rail"><div class="mv">${row}${row}</div></div>`;
    t.querySelectorAll('[data-reg]').forEach(a => a.onclick = () => openRegion(a.dataset.reg, true));
  }

  /* ── 폴리곤 ── */
  function metricVal(r) {
    if (!r) return null;
    if (layer === 'price' || layer === 'news') return r[metric];
    if (layer === 'trade') return r.t30 || 0;
    if (layer === 'high') return r.t30 >= 5 ? r.h30 / r.t30 * 100 : null;
  }
  const TCUT = {sgg: [40, 100, 200, 350], emd: [8, 20, 40, 70]}, HCUT = {sgg: [2, 6, 12, 25], emd: [1, 2, 4, 8]};
  function fill(r) {
    const v = metricVal(r);
    if (layer === 'trade') return seqColor(v, TCUT[r.lv]);
    if (layer === 'high') { if (v == null) return '#f3f3f3'; const i = [8, 16, 24, 32].findIndex(c => v < c); return ['#f7e4e2', '#efc0bb', '#e0918a', '#c9564d', '#a01818'][i === -1 ? 4 : i]; }
    return divColor(v, metric);
  }
  function style(r) {
    const z = map ? map.getZoom() : 10, dim = z >= 12 ? .12 : layer === 'news' ? .28 : layer === 'high' ? .55 : .6; // 동 숫자가 보이는 단계에선 구 색을 옅게
    if (z >= 14) return {opacity: 0, fillOpacity: 0, weight: 0}; // 단지가 보이는 단계에선 경계를 숨김
    const sel = view.k === 'region' && view.code === r.code;
    return {color: sel ? '#121212' : '#fff', weight: sel ? 2.4 : r.lv === 'sgg' ? 1.2 : .7, fillColor: fill(r), fillOpacity: dim, opacity: 1};
  }
  function bindPoly(f, ly) {
    const r = R[f.properties.code]; polys[r.code] = ly;
    ly.on('mouseover', () => { if (!(view.k === 'region' && view.code === r.code)) ly.setStyle({weight: 2, color: '#121212'}); tip(r, ly); });
    ly.on('mouseout', () => { ly.setStyle(style(r)); ly.closeTooltip(); });
    ly.on('click', () => openRegion(r.code));
  }
  function tip(r, ly) {
    const v = layer === 'trade' ? `30일 실거래 ${r.t30 || 0}건` : layer === 'high' ? `30일 실거래 ${r.t30 || 0}건 중 신고가 ${r.h30 || 0}건${r.t30 >= 5 ? ` (${Math.round(r.h30 / r.t30 * 100)}%)` : ''}` : `평당 ${last(r.m) ? last(r.m).toLocaleString() + '만원' : '–'} · ${metric === 'c1' ? '1개월' : '1년'} <span class="${updn(r[metric])}">${pctS(r[metric])}</span>`;
    ly.bindTooltip(`<b>${r.sd === '서울' || r.lv === 'emd' ? '' : r.sd + ' '}${r.n}</b><br>${v}`, {sticky: true, className: 'pm-tip', direction: 'top', offset: [0, -6]}).openTooltip();
  }
  function syncPolys() {
    const z = map.getZoom();
    const wantEmd = false; // 동 경계는 그리지 않음(원본 자료가 거침)
    if (!map.hasLayer(gSgg)) gSgg.addTo(map);
    if (wantEmd && !map.hasLayer(gEmd)) gEmd.addTo(map);
    if (!wantEmd && map.hasLayer(gEmd)) map.removeLayer(gEmd);
    // 서울 구는 동 단계에서 숨김
    gSgg.eachLayer(ly => { const r = R[ly.feature.properties.code]; const hide = wantEmd && r.sd === '서울'; ly.setStyle(hide ? {fillOpacity: 0, opacity: 0, interactive: false} : style(r)); if (ly._path) ly._path.style.pointerEvents = hide ? 'none' : ''; });
    if (wantEmd) gEmd.eachLayer(ly => ly.setStyle(style(R[ly.feature.properties.code])));
  }
  const restyle = () => { gSgg.eachLayer(ly => ly.setStyle(style(R[ly.feature.properties.code]))); gEmd.eachLayer(ly => ly.setStyle(style(R[ly.feature.properties.code]))); syncPolys(); };

  /* ── 지도 위 표시: 라벨·뉴스 묶음·단지 핀 ── */
  function visibleRegions() {
    const z = map.getZoom(), b = map.getBounds().pad(-.02);
    return Object.values(R).filter(r => r.c && (r.lv === 'emd' ? z >= 12 : (r.lv === 'sgg' && (z < 12 || r.sd !== '서울'))) && b.contains(r.c));
  }
  function draw() {
    labels.clearLayers(); marks.clearLayers();
    const z = map.getZoom();
    if (z >= 14) { pins(); return; }
    if (layer === 'news') { newsClusters(); callouts(); return; }
    const occupied = [];
    visibleRegions().sort((a, b) => (b.lv === 'sgg' ? 1 : 0) - (a.lv === 'sgg' ? 1 : 0)).forEach(r => {
      const p = map.latLngToContainerPoint(r.c);
      if (p.x < PW()) return;
      const box = [p.x - 30, p.y - 14, p.x + 30, p.y + 14];
      if (occupied.some(o => !(box[2] < o[0] || box[0] > o[2] || box[3] < o[1] || box[1] > o[3]))) return;
      occupied.push(box);
      const v = metricVal(r);
      if ((layer === 'price' || layer === 'high') && v == null) return;
      const val = layer === 'price' ? `<em class="${updn(v)}">${pctS(v)}</em>` : layer === 'high' ? `<em class="up">${Math.round(v)}%</em>` : `<em>${(v || 0).toLocaleString()}건</em>`;
      labels.addLayer(L.marker(r.c, {interactive: false, icon: L.divIcon({className: '', html: `<div class="pm-lab"><b>${esc(r.short || r.n)}</b>${val}</div>`})}));
    });
    callouts();
    if (layer === 'high' && z >= 13) HIGHS.forEach(({d}) => { if (map.getBounds().contains([d.la, d.ln])) marks.addLayer(L.circleMarker([d.la, d.ln], {radius: 3.5, color: '#fff', weight: 1, fillColor: '#b50000', fillOpacity: 1}).on('click', () => openDanji(d.id))); });
  }
  function callouts() {
    if (!(layer === 'news' || layer === 'price') || map.getZoom() > 11.5) return;
    const b = map.getBounds();
    const top = HIGHS.filter(h => b.contains([h.d.la, h.d.ln]) && map.latLngToContainerPoint([h.d.la, h.d.ln]).x > PW() + 30).sort((a, c) => c.t[3] - a.t[3]);
    const used = [];
    top.forEach(h => {
      if (used.length >= 3 || used.some(u => u.id === h.d.id)) return;
      const p = map.latLngToContainerPoint([h.d.la, h.d.ln]);
      if (used.some(u => Math.abs(u.p.x - p.x) < 210 && Math.abs(u.p.y - p.y) < 60)) return;
      used.push({id: h.d.id, p});
      marks.addLayer(L.marker([h.d.la, h.d.ln], {zIndexOffset: 2000, icon: L.divIcon({className: '', html:
        `<div class="pm-call"><i></i><span><em>신고가</em><b>${esc(h.d.n.length > 8 ? h.d.n.slice(0, 8) + '…' : h.d.n)}</b> <b class="num">${eokS(h.t[3])}</b><small>전용 ${Math.round(h.t[1])}㎡ · ${h.t[0]}</small></span></div>`})}).on('click', () => openDanji(h.d.id)));
    });
  }
  function newsClusters() {
    const z = map.getZoom(), b = map.getBounds(), groups = {};
    NEWS.forEach(a => {
      if (!a.code || !b.contains([a.la, a.ln])) return;
      let k = sggOf(a.code);
      if (z >= 12 && R[a.code]) k = a.code;
      if (!R[k]) return;
      (groups[k] = groups[k] || []).push(a);
    });
    const occ = [];
    Object.entries(groups).sort((a, b) => b[1].length - a[1].length).forEach(([k, arr]) => {
      const r = R[k], p = map.latLngToContainerPoint(r.c);
      if (p.x < PW()) return;
      const box = [p.x - 24, p.y - 18, p.x + 24, p.y + 18];
      if (occ.some(o => !(box[2] < o[0] || box[0] > o[2] || box[3] < o[1] || box[1] > o[3]))) return;
      occ.push(box);
      const c = r[metric];
      marks.addLayer(L.marker(r.c, {icon: L.divIcon({className: '', html: `<div class="pm-news"><small>${esc(r.short || r.n)}</small><b>${arr.length}</b>${c == null ? '' : `<i class="${updn(c)}">${pctS(c)}</i>`}</div>`})}).on('click', () => openRegion(k, false, 'news')));
    });
  }
  const repT = d => d.t.length ? [...d.t].sort((a, b) => Math.abs(a[1] - 84) - Math.abs(b[1] - 84) || (b[0] > a[0] ? 1 : -1))[0] : null;
  function pins() {
    const b = map.getBounds(), z = map.getZoom();
    const list = DJ.filter(d => b.contains([d.la, d.ln]) && map.latLngToContainerPoint([d.la, d.ln]).x > PW())
      .filter(d => layer !== 'high' || d.nh).sort((a, b) => (PARTNER[b.id] ? 1e6 : 0) + b.hh - (PARTNER[a.id] ? 1e6 : 0) - a.hh);
    const occ = [];
    list.forEach(d => {
      const p = map.latLngToContainerPoint([d.la, d.ln]);
      const w = z >= 15 ? 110 : 60, box = [p.x - w / 2, p.y - 30, p.x + w / 2, p.y];
      const ovl = occ.some(o => !(box[2] < o[0] || box[0] > o[2] || box[3] < o[1] || box[1] > o[3]));
      if (ovl) { marks.addLayer(L.circleMarker([d.la, d.ln], {radius: 3, color: '#fff', weight: 1, fillColor: d.nh ? '#b50000' : '#5a6478', fillOpacity: .9}).on('click', () => openDanji(d.id))); return; }
      occ.push(box);
      const t = repT(d), sel = view.k === 'danji' && view.id === d.id, pt = PARTNER[d.id];
      const price = t ? eokS(t[3]) : DEMO[d.id] && DEMO[d.id].kbM ? DEMO[d.id].kbM.toFixed(1).replace(/\.0$/, '') + '억' : '신축';
      const name = z >= 15 ? `<span class="nm">${esc(d.n.length > 9 ? d.n.slice(0, 9) + '…' : d.n)}</span>` : '';
      marks.addLayer(L.marker([d.la, d.ln], {zIndexOffset: pt ? 500 : d.nh ? 300 : 0, icon: L.divIcon({className: '', html:
        `<div class="pm-pin ${d.nh ? 'hi' : ''} ${sel ? 'sel' : ''} ${pt ? 'pt' : ''}">${pt ? '<i class="pdot" title="단지 전문 중개사"></i>' : ''}${name}<b>${price}</b>${t && t[4] ? '<em>신고가</em>' : ''}</div>`})}).on('click', () => openDanji(d.id)));
    });
  }

  /* ── 패널 ── */
  let selLine = null;
  function outline() {
    if (selLine) { map.removeLayer(selLine); selLine = null; }
    if (view.k !== 'region') return;
    const f = M.geo.sgg.find(x => x.properties.code === view.code) || M.geo.emd.find(x => x.properties.code === view.code);
    if (f && map.getZoom() < 14) selLine = L.geoJSON(f, {interactive: false, style: {color: '#121212', weight: 2.5, fill: false}}).addTo(map);
  }
  function go(v, reset) { if (reset) hist = []; else if (view.k !== 'home' || v.k !== 'home') hist.push(view); view = v; panel(); restyle(); draw(); outline(); }
  function back() { view = hist.pop() || {k: 'home'}; panel(); restyle(); draw(); outline(); }
  function panel() {
    $('#pmBack').hidden = view.k === 'home';
    const body = $('#pmBody');
    body.innerHTML = view.k === 'region' ? regionCard(R[view.code], view.focus) : view.k === 'danji' ? danjiCard(DJI[view.id]) : home();
    body.scrollTop = 0;
    body.querySelectorAll('[data-reg]').forEach(a => a.onclick = e => { e.preventDefault(); openRegion(a.dataset.reg); });
    body.querySelectorAll('[data-dj]').forEach(a => a.onclick = e => { e.preventDefault(); openDanji(a.dataset.dj); });
    body.querySelectorAll('[data-metric]').forEach(a => a.onclick = () => { metric = a.dataset.metric; restyle(); draw(); panel(); legend(); });
  }
  function scopeRegion() {
    const c = map.getCenter(), z = map.getZoom();
    if (z < 11) return null;
    // 지도 가운데가 속한 구
    let best = null, bd = 1e9;
    Object.values(R).forEach(r => { if (r.lv === 'sgg' && r.c) { const d = (r.c[0] - c.lat) ** 2 + (r.c[1] - c.lng) ** 2; if (d < bd) { bd = d; best = r; } } });
    return best;
  }
  function kpis() {
    const s = R[SEOUL], sc = scopeRegion();
    const r = sc && sc.sd === '서울' ? sc : s;
    return `<div class="pm-kpi">
      <div><span>${r === s ? '서울' : r.n} 평당 매매</span><b class="num">${last(r.m).toLocaleString()}<small>만원</small></b><i class="${updn(r.c1)}">1개월 ${pctS(r.c1)}</i></div>
      <div><span>30일 실거래</span><b class="num">${(r.t30 || 0).toLocaleString()}<small>건</small></b><i>최근 한 달</i></div>
      <div><span>신고가</span><b class="num up">${(r.h30 || 0).toLocaleString()}<small>건</small></b><i>최고가 경신</i></div></div>`;
  }
  function inView(a) { return map.getBounds().contains([a.la, a.ln]); }
  function home() {
    const z = map.getZoom();
    if (layer === 'news') {
      const arts = NEWS.filter(inView).slice(0, PW() ? 30 : 10);
      return kpis() + `<div class="pm-sub">이 지도 안 기사 <b>${NEWS.filter(inView).length.toLocaleString()}</b>건</div>` + arts.map(newsRow).join('') + foot();
    }
    if (layer === 'price') {
      const rs = visibleRegions().filter(r => r[metric] != null).sort((a, b) => b[metric] - a[metric]);
      return `<div class="pm-h">지역별 아파트 시세 <span class="pm-seg">${[['c1', '1개월'], ['c12', '1년']].map(([k, t]) => `<button data-metric="${k}" class="${metric === k ? 'on' : ''}">${t}</button>`).join('')}</span></div>
        <div class="pm-sub">평당 매매가 · ${asof} · ${z >= 12 ? '동' : '시·군·구'} ${rs.length}곳</div><div class="pm-colh"><span>지역</span><span>최근 1년</span><span>평당가(만원)·변동</span></div>` +
        rs.slice(0, 40).map(r => `<a class="pm-rrow" data-reg="${r.code}"><span class="nm">${esc(r.lv === 'sgg' && r.sd !== '서울' ? r.n : r.n)}<small>${r.lv === 'emd' ? r.sgg : r.sd}</small></span>${spark(r.m.slice(-13), 54, 20)}<span class="v"><b class="num">${last(r.m).toLocaleString()}</b><i class="num ${updn(r[metric])}">${pctS(r[metric])}</i></span></a>`).join('') + foot();
    }
    if (layer === 'trade') {
      const rs = visibleRegions().sort((a, b) => (b.t30 || 0) - (a.t30 || 0));
      const ds = DJ.filter(d => inView({la: d.la, ln: d.ln}) && d.nt).sort((a, b) => b.nt - a.nt).slice(0, 6);
      return `<div class="pm-h">최근 30일 실거래</div><div class="pm-sub">${W0}~${W1} 계약 · 해제 거래 제외</div>
        <div class="pm-lbl">거래 많은 단지</div>` + ds.map(d => `<a class="pm-drow" data-dj="${d.id}"><span class="nm">${esc(d.n)}<small>${d.emd} · ${d.hh.toLocaleString()}세대</small></span><span class="v"><b class="num">${d.nt}건</b><i class="num">최근 ${eokS(d.t[0][3])}</i></span></a>`).join('') +
        `<div class="pm-lbl">지역별</div>` + rs.slice(0, 30).map(r => `<a class="pm-rrow" data-reg="${r.code}"><span class="nm">${esc(r.n)}<small>${r.lv === 'emd' ? r.sgg : r.sd}</small></span>${bars((r.v || []).slice(-13, -1), 54, 20)}<span class="v"><b class="num">${(r.t30 || 0).toLocaleString()}건</b><i class="num">${r.v ? '월평균 ' + Math.round(r.v.slice(-13, -1).reduce((a, b) => a + b, 0) / 12) : ''}</i></span></a>`).join('') + foot();
    }
    const hs = HIGHS.filter(h => inView({la: h.d.la, ln: h.d.ln})).sort((a, b) => b.t[3] - a.t[3]);
    const tv = DJ.filter(d => inView({la: d.la, ln: d.ln})).reduce((a, d) => a + d.nt, 0);
    return `<div class="pm-h"><span>신고가 <b class="up">${hs.length.toLocaleString()}</b>건</span><span class="pm-hr">실거래 ${tv.toLocaleString()}건 중 ${tv ? Math.round(hs.length / tv * 100) : 0}%</span></div><div class="pm-sub">${W0}~${W1} 계약 중 2017년 이후 최고가를 넘긴 거래 · 비싼 순</div>` +
      hs.slice(0, 40).map(({d, t}) => `<a class="pm-drow" data-dj="${d.id}"><span class="nm">${esc(d.n)}<small>${d.sgg} ${d.emd} · 전용 ${t[1]}㎡ · ${t[2]}층 · ${t[0]}</small></span><span class="v"><b class="num up">${eokS(t[3])}</b><i class="num">직전 ${eokS(t[5])}</i></span></a>`).join('') + foot();
  }
  const foot = () => `<a class="pm-foot" href="#s9">우리 단지 전문 중개사 찾기 <span>›</span></a>`;
  const newsRow = a => `<a class="pm-nrow" href="${a.url}" target="_blank" rel="noopener"><span class="th"><img src="${a.img}" alt="" loading="lazy"></span><span class="t">${a.pay ? '<i class="p9">PREMIUM</i>' : ''}${esc(a.title)}<small>${a.date} · ${esc(a.place)}</small></span></a>`;

  function spark(a, w = 60, h = 22, color) {
    const v = a.filter(x => x != null); if (v.length < 2) return '';
    const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
    const c = color || (v[v.length - 1] >= v[0] ? '#b50000' : '#2853b2');
    return `<svg class="spk" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${v.map((x, i) => `${(i / (v.length - 1) * w).toFixed(1)},${(h - 2 - (x - mn) / r * (h - 4)).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="1.5"/></svg>`;
  }
  function bars(a, w = 60, h = 22) {
    if (!a.length) return ''; const mx = Math.max(...a) || 1, bw = w / a.length;
    return `<svg class="spk" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${a.map((x, i) => `<rect x="${(i * bw + .5).toFixed(1)}" y="${(h - x / mx * h).toFixed(1)}" width="${(bw - 1.5).toFixed(1)}" height="${(x / mx * h).toFixed(1)}" fill="${i === a.length - 1 ? '#142c67' : '#b9c3d6'}"/>`).join('')}</svg>`;
  }
  function chart(r) {
    const a = r.m.slice(-25), w = 262, h = 92, L = 2, T = 10, B = 16;
    const v = a.filter(x => x != null), mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
    const x = i => L + i / (a.length - 1) * (w - L - 6), y = q => T + (1 - (q - mn) / rg) * (h - T - B);
    const lbl = M.months.slice(-25);
    let g = `<line x1="0" x2="${w}" y1="${h - B}" y2="${h - B}" stroke="#ddd"/>`;
    lbl.forEach((m, i) => { if (m.endsWith('-01') || i === a.length - 1) g += `<text x="${Math.min(x(i), w - 14)}" y="${h - 3}" font-size="10" fill="#888" text-anchor="middle">${i === a.length - 1 ? m.slice(2).replace('-', '.') : m.slice(0, 4)}</text>`; });
    const mxi = a.indexOf(mx);
    g += `<polyline points="${a.map((q, i) => q == null ? '' : `${x(i).toFixed(1)},${y(q).toFixed(1)}`).join(' ')}" fill="none" stroke="#121212" stroke-width="1.8"/>`;
    g += `<circle cx="${x(a.length - 1)}" cy="${y(last(a))}" r="3" fill="#121212"/>`;
    g += `<text x="${x(mxi)}" y="${y(mx) - 3}" font-size="10" fill="#585858" text-anchor="middle">최고 ${mx.toLocaleString()}</text>`;
    return `<svg width="100%" viewBox="0 0 ${w} ${h}" class="pm-chart">${g}</svg>`;
  }
  function volChart(a, ms) {
    const w = 262, h = 54, mx = Math.max(...a) || 1, bw = w / a.length;
    let g = '';
    a.forEach((v, i) => {
      const bh = v / mx * (h - 16), x = i * bw + 2;
      g += `<rect x="${x.toFixed(1)}" y="${(h - 12 - bh).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${bh.toFixed(1)}" fill="${i === a.length - 1 ? '#142c67' : '#c3cde0'}"/>`;
      if (i === 0 || i === a.length - 1 || ms[i].endsWith('-01')) g += `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${h - 1}" font-size="9.5" fill="#888" text-anchor="middle">${ms[i].slice(2).replace('-', '.')}</text>`;
    });
    g += `<text x="${w - 2}" y="9" font-size="10" fill="#142c67" font-weight="700" text-anchor="end">${a[a.length - 1].toLocaleString()}</text>`;
    return `<svg width="100%" viewBox="0 0 ${w} ${h}" class="pm-chart">${g}</svg>`;
  }
  function brief(r) {
    const glue = s => s.replace(/(\d)(%|억|만원|원|건|층|㎡|호|배)(?=[가-힣])/g, '$1$2⁠');
    const m = last(r.m), c1 = r.c1, c12 = r.c12, t = r.t30 || 0, h = r.h30 || 0, o3 = r.o3;
    const p = v => Math.abs(v).toFixed(Math.abs(v) < 1 ? 2 : 1) + '%';
    let head, used;
    if (t >= 10 && h / t >= .2) { head = `한 달 거래 ${t.toLocaleString()}건 중 ${h}건이 신고가`; used = 'h'; }
    else if (c1 != null && Math.abs(c1) >= .4) { head = `한 달 새 아파트값 ${p(c1)} ${c1 > 0 ? '상승' : '하락'}`; used = 'c1'; }
    else if (o3 != null && Math.abs(o3) >= 15) { head = `석 달 새 매물 ${Math.round(Math.abs(o3))}% ${o3 > 0 ? '증가' : '감소'}`; used = 'o'; }
    else if (c12 != null && Math.abs(c12) >= 5) { head = `1년 새 아파트값 ${p(c12)} ${c12 > 0 ? '상승' : '하락'}`; used = 'c12'; }
    else if (c1 != null && Math.abs(c1) >= .1) { head = `한 달 새 아파트값 ${p(c1)} ${c1 > 0 ? '상승' : '하락'}`; used = 'c1'; }
    else { head = m ? `평당 ${m.toLocaleString()}만원, 한 달 전과 비슷` : '시세 자료 없음'; used = 'm'; }
    const s = [];
    if (m && used !== 'm') s.push(`평당 ${m.toLocaleString()}만원${c12 != null && used !== 'c12' ? `으로 1년 전보다 ${p(c12)} ${c12 >= 0 ? '높다' : '낮다'}` : '이다'}.`);
    else if (c12 != null && used === 'm') s.push(`1년 전보다는 ${p(c12)} ${c12 >= 0 ? '높다' : '낮다'}.`);
    if (used !== 'h' && t) s.push(`최근 한 달 ${t.toLocaleString()}건이 거래됐고${h ? ` ${h}건이 신고가였다` : ' 신고가는 없었다'}.`);
    else if (used !== 'o' && o3 != null && Math.abs(o3) >= 10) s.push(`매물은 석 달 새 ${Math.round(Math.abs(o3))}% ${o3 > 0 ? '늘었다' : '줄었다'}.`);
    const u = r.u && last(r.u), u0 = r.u && r.u[0];
    if (r.lv !== 'emd' && u != null && u0 != null && (u || u0) && Math.abs(u - u0) >= Math.max(50, u0 * .2)) s.push(`미분양은 1년 새 ${u0.toLocaleString()}호에서 ${u.toLocaleString()}호로 ${u > u0 ? '늘었다' : '줄었다'}.`);
    return {head: glue(head), body: glue(s.slice(0, 2).join(' '))};
  }
  function regionCard(r, focus) {
    if (!r) return home();
    const arts = NEWS.filter(a => a.code && (r.lv === 'emd' ? a.code === r.code : r.lv === 'sgg' ? sggOf(a.code) === r.code : R[sggOf(a.code)] && R[sggOf(a.code)].sd === r.sd));
    const djs = DJ.filter(d => (r.lv === 'emd' ? d.code === r.code : r.lv === 'sgg' ? sggOf(d.code) === r.code || (d.demo && r.n === d.sgg && r.sd === '서울') : d.sd === r.sd));
    const hi = djs.filter(d => d.nh).sort((a, b) => b.t[0][3] - a.t[0][3]).slice(0, 3);
    const pts = djs.filter(d => PARTNER[d.id]);
    const newsBlock = `<div class="pm-lbl">이 지역 한경 기사 <span>${arts.length}건</span></div>${arts.slice(0, focus === 'news' ? 8 : 3).map(newsRow).join('') || '<div class="pm-empty">아직 이 지역 기사가 없습니다.</div>'}`;
    return `<div class="pm-rhead"><small>${r.lv === 'emd' ? `${r.sd} ${r.sgg}` : r.lv === 'sgg' ? r.sd : '광역'}</small><h3>${esc(r.n)}</h3></div>
      ${focus === 'news' ? newsBlock : ''}
      <div class="pm-big"><div><span>평당 매매</span><b class="num">${last(r.m) ? last(r.m).toLocaleString() : '–'}<small>만원</small></b></div>
        <div><span>1개월</span><b class="num ${updn(r.c1)}">${pctS(r.c1)}</b></div><div><span>1년</span><b class="num ${updn(r.c12)}">${pctS(r.c12)}</b></div></div>
      ${r.m ? chart(r) : ''}
      <div class="pm-facts"><div><span>평당 전세</span><b class="num">${last(r.j) ? last(r.j).toLocaleString() + '만원' : '–'}</b></div><div><span>전세가율</span><b class="num">${r.jr ?? '–'}%</b></div>
        <div><span>30일 실거래</span><b class="num">${(r.t30 || 0).toLocaleString()}건</b></div><div><span>신고가</span><b class="num up">${(r.h30 || 0).toLocaleString()}건</b></div>
        <div><span>미분양</span><b class="num">${r.u && last(r.u) != null ? last(r.u).toLocaleString() + '호' : '–'}</b></div><div><span>미분양 1년</span><b class="num">${r.u && r.u[0] != null && last(r.u) != null ? (last(r.u) - r.u[0] >= 0 ? '+' : '−') + Math.abs(last(r.u) - r.u[0]).toLocaleString() : '–'}</b></div>
        <div><span>매물</span><b class="num">${r.o ? (last(r.o) || 0).toLocaleString() + '건' : '–'}</b></div><div><span>매물 3개월</span><b class="num ${r.o3 > 0 ? 'down' : r.o3 < 0 ? 'up' : ''}">${pctS(r.o3)}</b></div></div>
      ${r.v ? `<div class="pm-vol"><div class="h"><span>월별 실거래</span><small>최근 12개월 · 건</small></div>${volChart(r.v.slice(-13, -1), M.vmonths.slice(-13, -1))}</div>` : ''}
      ${(B => `<div class="pm-brief"><b>숫자로 본 ${esc(r.n)}</b><strong>${esc(B.head)}</strong>${esc(B.body)}<small>${asof} 시세·실거래 기준 자동 작성</small></div>`)(brief(r))}
      ${hi.length ? `<div class="pm-lbl">이 지역 신고가</div>${hi.map(d => `<a class="pm-drow" data-dj="${d.id}"><span class="nm">${esc(d.n)}<small>전용 ${d.t.find(t => t[4])[1]}㎡ · ${d.t.find(t => t[4])[0]}</small></span><span class="v"><b class="num up">${eokS(d.t.find(t => t[4])[3])}</b><i class="num">직전 ${eokS(d.t.find(t => t[4])[5])}</i></span></a>`).join('')}` : ''}
      ${r.lead && r.lead.length ? `<div class="pm-lbl">대표 단지</div><div class="pm-chips">${r.lead.map(n => { const d = djs.find(x => x.n === n) || DJ.find(x => x.n === n); return d ? `<a data-dj="${d.id}">${esc(n)}</a>` : `<span>${esc(n)}</span>`; }).join('')}</div>` : ''}
      ${focus === 'news' ? '' : newsBlock}
      ${pts.length ? `<div class="pm-ad"><div class="pm-adh"><b>단지 전문 중개사</b><span class="ad">광고</span></div>${pts.slice(0, 3).map(d => partnerRow(d)).join('')}</div>` : ''}
      ${foot()}`;
  }
  function partnerRow(d) {
    const m = PARTNER[d.id];
    return `<a class="pm-prow" href="#s8"><img src="${H.FACE[m.name] || H.FACE['김OO']}" alt=""><span><b>${esc(m.office)}</b><small>${esc(d.n)} 전문 · ${m.name} 대표 · 거래 ${m.deals}건</small></span><em>상담</em></a>`;
  }
  function danjiCard(d) {
    if (!d) return home();
    const demo = DEMO[d.id], pt = PARTNER[d.id];
    const key = d.n.replace(/\(.*\)/, '').replace(/아파트$/, '');
    const named = NEWS.filter(a => a.title.includes(key) || a.place.includes(key));
    const near = named.length >= 3 ? [] : NEWS.filter(a => d.code && a.code === d.code && !named.includes(a));
    const arts = [...named, ...near].slice(0, 3);
    const artLbl = named.length ? '관련 한경 기사' : `${d.emd} 한경 기사`;
    const reg = R[d.code] || R[sggOf(d.code)] || Object.values(R).find(r => r.lv === 'sgg' && r.n === d.sgg && r.sd === d.sd);
    return `<div class="pm-rhead"><small>${d.sd} ${d.sgg} ${d.emd}</small><h3>${esc(d.n)}</h3><div class="note">${d.hh ? d.hh.toLocaleString() + '세대' : ''}${d.cy ? ' · ' + d.cy + '년 준공' : ''}${d.nh ? ' · <b class="up">신고가</b>' : ''}</div></div>
      ${demo && demo.photo ? `<div class="pm-photo"><img src="${demo.photo}" alt=""></div>` : ''}
      <div class="pm-lbl">최근 30일 실거래 <span>${d.nt}건</span></div>
      ${d.t.length ? `<table class="pm-tr"><thead><tr><th>계약</th><th>전용</th><th>층</th><th>가격</th></tr></thead><tbody>${d.t.slice(0, 6).map(t => `<tr><td>${t[0]}</td><td>${t[1]}㎡</td><td>${t[2]}</td><td class="num ${t[4] ? 'up' : ''}">${eok(t[3])}${t[4] ? '<i>신고가</i>' : ''}${t[6] ? '<i class="g">직거래</i>' : ''}</td></tr>`).join('')}</tbody></table>
         ${d.t.find(t => t[4]) ? `<div class="pm-sub">신고가: 직전 최고 ${eok(d.t.find(t => t[4])[5])}를 넘김</div>` : ''}`
      : `<div class="pm-empty">최근 한 달 거래 없음${demo && demo.kbM ? ` · ${demo.py}평 시세 ${demo.kbM}억원` : ''}</div>`}
      ${reg && reg.m ? `<div class="pm-lbl">${esc(reg.n)} 시세 흐름</div><div class="pm-mini"><span>평당 ${last(reg.m).toLocaleString()}만원</span><i class="${updn(reg.c1)}">1개월 ${pctS(reg.c1)}</i><i class="${updn(reg.c12)}">1년 ${pctS(reg.c12)}</i></div>` : ''}
      ${arts.length ? `<div class="pm-lbl">${artLbl}</div>${arts.map(newsRow).join('')}` : ''}
      <a class="pm-more" href="#d/${d.id}">평형별 시세·실거래 전체 보기 <span>›</span></a>
      ${pt ? `<div class="pm-ad"><div class="pm-adh"><b>이 단지 전문 중개사</b><span class="ad">광고</span></div>${partnerRow(d)}</div>`
        : `<div class="pm-open">전문 중개사 자리 비어 있음 · <a href="#d/${d.id}">중개사 신청 ›</a></div>`}`;
  }

  /* ── 동작 ── */
  function setLayer(l) {
    layer = l; el.querySelectorAll('.pm-layers button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
    if (view.k !== 'home') { hist = []; view = {k: 'home'}; outline(); }
    restyle(); draw(); panel(); legend();
  }
  function openRegion(code, fly, focus) {
    const r = R[code]; if (!r) return;
    if (fly) { const ly = polys[code]; if (ly) map.fitBounds(ly.getBounds(), {paddingTopLeft: [PW(), 30], paddingBottomRight: [20, 20], maxZoom: 13}); else if (r.c) map.setView(r.c, 14); }
    go({k: 'region', code, focus});
  }
  function openDanji(id) {
    const d = DJI[id]; if (!d) return;
    if (map.getZoom() < 14) map.setView([d.la, d.ln], 15); else map.panTo([d.la, d.ln]);
    go({k: 'danji', id});
  }
  function legend() {
    const lg = $('#pmLegend');
    if (layer === 'trade') lg.innerHTML = `<b>30일 실거래</b>${SEQ.map((c, i) => `<i style="background:${c}"></i>`).join('')}<span>적음 → 많음</span>`;
    else if (layer === 'high') lg.innerHTML = `<b>실거래 중 신고가 비율</b>${['#f7e4e2', '#efc0bb', '#e0918a', '#c9564d', '#a01818'].map(c => `<i style="background:${c}"></i>`).join('')}<span>8% · 16 · 24 · 32%</span>`;
    else lg.innerHTML = `<b>${layer === 'news' ? '바탕색' : '평당가'} ${metric === 'c1' ? '1개월' : '1년'} 변동</b>${[...DIV.dn].reverse().map(c => `<i style="background:${c}"></i>`).join('')}<i style="background:${DIV.flat}"></i>${DIV.up.map(c => `<i style="background:${c}"></i>`).join('')}<span>하락 · 상승</span>`;
    lg.innerHTML += `<em>${asof} 기준</em>`;
  }
  return {mount, openRegion, openDanji, setLayer, get map() { return map; }};
})();
