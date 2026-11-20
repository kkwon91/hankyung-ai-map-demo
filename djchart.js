/* 단지 페이지 차트 — dataviz 기준(선 2px, 끝점 r4 + 흰 테두리 2px, 실선 머리카락 격자, 끝값만 표기, 마우스 기준선·말풍선, 글자는 글자색)
 * 색(검사 통과): 매매 #0d79c7 · 전세 #1f9e6e · 최고가 거래 #b50000
 */
window.DJC = (function () {
  const C = {m: '#0d79c7', j: '#1f9e6e', hi: '#b50000', grid: '#ececec', axis: '#888', ink: '#121212', ink2: '#585858'};
  const eokS = v => v == null ? '–' : v >= 10000 ? (v / 10000).toFixed(v >= 100000 ? 1 : 2).replace(/\.?0+$/, '') + '억' : Math.round(v).toLocaleString() + '만';
  const eok = v => { if (v == null) return '–'; const e = Math.floor(v / 10000), m = Math.round(v % 10000); return e ? `${e}억${m ? m + '만' : ''}원` : `${m}만원`; };
  const ns = 'http://www.w3.org/2000/svg';
  function niceStep(range, n) { const raw = range / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  const el = (tag, attrs, parent) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const txt = (parent, x, y, s, attrs = {}) => { const t = el('text', {x, y, ...attrs}, parent); t.textContent = s; return t; };

  /* 시세 선 + 실거래 점: t=[전용, 평형, 매매[], 전세[], 최고가], months=['YYYY-MM'..], trades=[['YY.MM.DD', 전용, 층, 가격, ...,최고가여부]] */
  function price(box, t, months, trades) {
    box.innerHTML = '';
    const W = box.clientWidth || 760, H = 260, L = 8, R = 58, T = 16, B = 26;
    const mm = t[2].map(v => v == null ? null : v * 100), jj = t[3].map(v => v == null ? null : v * 100);
    const mi = Object.fromEntries(months.map((m, i) => [m, i]));
    const pts = trades.map(r => { const ym = '20' + r[0].slice(0, 5).replace('.', '-'); const i = mi[ym]; return i == null ? null : {x: Math.min(months.length - 1, i + (+r[0].slice(6, 8) - 1) / 31), v: r[3], r}; }).filter(Boolean);
    const vals = [...mm, ...jj, ...pts.map(p => p.v)].filter(v => v != null);
    if (vals.length < 2) { box.innerHTML = '<div class="note" style="padding:30px 0;text-align:center">시세 자료가 아직 없습니다</div>'; return; }
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const st = niceStep(hi - lo || hi * .2, 5);
    lo = Math.max(0, Math.floor((lo - st * .3) / st) * st); hi = Math.ceil((hi + st * .3) / st) * st;
    const iw = W - L - R, ih = H - T - B;
    const X = i => L + i / (months.length - 1) * iw, Y = v => T + ih - (v - lo) / (hi - lo) * ih;
    const svg = el('svg', {viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, class: 'djc-svg', role: 'img', 'aria-label': `전용 ${t[0]}㎡ 매매·전세 시세와 실거래`}, box);
    const g = el('g', {}, svg);
    for (let v = lo; v <= hi + 1; v += st) { el('line', {x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: C.grid, 'stroke-width': 1}, g); txt(g, W - R + 14, Y(v) + 4, (v / 10000).toFixed(st < 10000 ? 1 : 0) + '억', {'font-size': 11, fill: C.axis}); }
    let lastLX = -1e9; months.forEach((m, i) => { if ((m.endsWith('-01') || m.endsWith('-07') || i === 0) && X(i) - lastLX >= 52 && (lastLX = X(i))) txt(g, X(i), H - 7, m.endsWith('-01') ? m.slice(0, 4) + '년' : m.endsWith('-07') ? '7월' : m.slice(2).replace('-', '.'), {'font-size': 11, fill: C.axis, 'text-anchor': i === 0 ? 'start' : 'middle'}); });
    // 최고가 기준선(가는 실선 + 글자)
    if (t[4] && t[4][0] >= lo && t[4][0] <= hi) { el('line', {x1: L, x2: W - R, y1: Y(t[4][0]), y2: Y(t[4][0]), stroke: C.hi, 'stroke-width': 1, opacity: .55}, g); txt(g, L + 2, Y(t[4][0]) - 5, `2017년 이후 최고 ${eokS(t[4][0])} (${t[4][1]})`, {'font-size': 11, fill: C.ink2}); }
    const path = arr => { let d = '', pen = false; arr.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); pen = true; }); return d; };
    // 매매 아래 옅은 면(10%)
    const fi = mm.findIndex(v => v != null), la = mm.length - 1 - [...mm].reverse().findIndex(v => v != null);
    if (fi >= 0) el('path', {d: path(mm) + `L${X(la)},${Y(lo)}L${X(fi)},${Y(lo)}Z`, fill: C.m, opacity: .08, class: 'djc-fade'}, g);
    el('path', {d: path(jj), fill: 'none', stroke: C.j, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, class: 'djc-ln'}, g);
    el('path', {d: path(mm), fill: 'none', stroke: C.m, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, class: 'djc-ln'}, g);
    // 실거래 점(흰 테두리 2px)
    const dots = el('g', {class: 'djc-dots'}, svg);
    pts.forEach(p => el('circle', {cx: X(p.x), cy: Y(p.v), r: p.r[6] ? 5 : 4, fill: p.r[6] ? C.hi : C.m, 'fill-opacity': p.r[6] ? 1 : .55, stroke: '#fff', 'stroke-width': 2}, dots));
    // 끝점·끝값(글자는 글자색, 옆 색점이 구분)
    const ends = [];
    if (mm[la] != null) ends.push({y: Y(mm[la]), v: mm[la], c: C.m, n: '매매'});
    const lj = jj.length - 1; if (jj[lj] != null) ends.push({y: Y(jj[lj]), v: jj[lj], c: C.j, n: '전세'});
    ends.forEach(e => el('circle', {cx: X(months.length - 1), cy: e.y, r: 4, fill: e.c, stroke: '#fff', 'stroke-width': 2}, svg));
    if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 16) { const mid = (ends[0].y + ends[1].y) / 2; ends[0].y = Math.min(ends[0].y, mid - 8); ends[1].y = Math.max(ends[1].y, mid + 8); }
    // 끝값은 오른쪽 축 글자와 겹치지 않게 그래프 안쪽 위에
    // 마우스 층
    const cross = el('line', {y1: T, y2: H - B, stroke: '#121212', 'stroke-width': 1, opacity: 0}, svg);
    const hm = el('circle', {r: 4, fill: C.m, stroke: '#fff', 'stroke-width': 2, opacity: 0}, svg), hj = el('circle', {r: 4, fill: C.j, stroke: '#fff', 'stroke-width': 2, opacity: 0}, svg);
    const tip = document.createElement('div'); tip.className = 'djc-tip'; box.appendChild(tip);
    const hit = el('rect', {x: L, y: T, width: iw, height: ih, fill: 'transparent', tabindex: 0}, svg);
    const show = (html, px, py) => { tip.innerHTML = html; tip.style.opacity = 1; const bw = box.clientWidth, tw = tip.offsetWidth; tip.style.left = Math.min(Math.max(px + 14, 0), bw - tw - 4) + 'px'; tip.style.top = Math.max(py - 10, 0) + 'px'; };
    const hide = () => { tip.style.opacity = 0; cross.setAttribute('opacity', 0); hm.setAttribute('opacity', 0); hj.setAttribute('opacity', 0); };
    const scale = () => box.clientWidth / W;
    function at(i) {
      i = Math.max(0, Math.min(months.length - 1, i));
      const x = X(i); cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('opacity', .25);
      if (mm[i] != null) { hm.setAttribute('cx', x); hm.setAttribute('cy', Y(mm[i])); hm.setAttribute('opacity', 1); } else hm.setAttribute('opacity', 0);
      if (jj[i] != null) { hj.setAttribute('cx', x); hj.setAttribute('cy', Y(jj[i])); hj.setAttribute('opacity', 1); } else hj.setAttribute('opacity', 0);
      const n = pts.filter(p => Math.floor(p.x) === i).length;
      show(`<div class="h">${months[i].slice(0, 4)}년 ${+months[i].slice(5)}월</div>
        <div class="r"><i style="background:${C.m}"></i><b>${eokS(mm[i])}</b><span>매매 시세</span></div>
        <div class="r"><i style="background:${C.j}"></i><b>${eokS(jj[i])}</b><span>전세 시세</span></div>
        ${mm[i] && jj[i] ? `<div class="s">전세가율 ${Math.round(jj[i] / mm[i] * 100)}%${n ? ` · 이 달 실거래 ${n}건` : ''}</div>` : ''}`, x * scale(), Math.min(Y(mm[i] || lo), Y(jj[i] || lo)) * scale());
    }
    hit.addEventListener('pointermove', e => { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) / scale(); const near = pts.find(p => Math.hypot(X(p.x) - x, Y(p.v) - (e.clientY - r.top) / scale()) < 9); if (near) { hide(); cross.setAttribute('opacity', 0); show(`<div class="h">20${near.r[0]} 실거래${near.r[6] ? ' · <em>최고가</em>' : ''}</div><div class="r"><i class="dot" style="background:${near.r[6] ? C.hi : C.m}"></i><b>${eok(near.v)}</b><span>${near.r[1]}㎡ · ${near.r[2]}층${near.r[5] ? ' · 직거래' : ''}</span></div>`, X(near.x) * scale(), Y(near.v) * scale()); return; } at(Math.round((x - L) / iw * (months.length - 1))); });
    hit.addEventListener('pointerleave', hide);
    let ki = months.length - 1;
    hit.addEventListener('focus', () => at(ki)); hit.addEventListener('blur', hide);
    hit.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); ki = Math.max(0, Math.min(months.length - 1, ki + (e.key === 'ArrowRight' ? 1 : -1))); at(ki); } });
    // 범례(2개 이상) + 끝값
    const lg = document.createElement('div'); lg.className = 'djc-legend';
    lg.innerHTML = `<span><i class="ln" style="background:${C.m}"></i>매매 시세 <b>${eokS(mm[la])}</b></span><span><i class="ln" style="background:${C.j}"></i>전세 시세 <b>${eokS(jj[lj])}</b></span>${pts.length ? `<span><i class="dt" style="background:${C.m};opacity:.6"></i>실거래 ${pts.length}건</span>` : ''}${pts.some(p => p.r[6]) ? `<span><i class="dt" style="background:${C.hi}"></i>최고가 거래</span>` : ''}`;
    box.insertBefore(lg, svg);
  }

  /* 월별 거래 건수 막대(폭 ≤24px, 끝 4px 둥글게, 바닥은 각지게, 값은 끝 막대·최대 막대만) */
  function volume(box, counts, months) {
    box.innerHTML = '';
    const W = box.clientWidth || 760, H = 120, L = 4, R = 4, T = 18, B = 22, iw = W - L - R, ih = H - T - B;
    const mx = Math.max(...counts, 1), slot = iw / counts.length, bw = Math.min(24, slot - 6);
    const svg = el('svg', {viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': '월별 실거래 건수'}, box);
    el('line', {x1: L, x2: W - R, y1: T + ih, y2: T + ih, stroke: '#d5d5d5', 'stroke-width': 1}, svg);
    const tip = document.createElement('div'); tip.className = 'djc-tip'; box.appendChild(tip);
    const imax = counts.indexOf(mx);
    let lastVX = -1e9;
    counts.forEach((c, i) => {
      const x = L + slot * i + (slot - bw) / 2, h = c / mx * ih, y = T + ih - h, rr = Math.min(4, h / 2, bw / 2);
      const last = i === counts.length - 1;
      if (c) el('path', {d: `M${x},${T + ih}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + bw - rr}Q${x + bw},${y} ${x + bw},${y + rr}V${T + ih}Z`, fill: last ? C.m : '#9ec3e4', class: 'djc-bar'}, svg);
      if (c && (last || i === imax)) txt(svg, x + bw / 2, y - 5, c + '건', {'font-size': 11, fill: C.ink, 'text-anchor': 'middle', 'font-weight': 700});
      if ((i === 0 || last || months[i].endsWith('-01')) && x + bw / 2 - lastVX >= 44 && (lastVX = x + bw / 2)) txt(svg, x + bw / 2, H - 6, months[i].slice(2).replace('-', '.'), {'font-size': 10.5, fill: C.axis, 'text-anchor': 'middle'});
      const h2 = el('rect', {x: L + slot * i, y: T, width: slot, height: ih, fill: 'transparent', tabindex: 0}, svg);
      const on = () => { const s = box.clientWidth / W; tip.innerHTML = `<div class="h">${months[i].slice(0, 4)}년 ${+months[i].slice(5)}월</div><div class="r"><b>${c}건</b><span>실거래${last ? ' · 19일까지 신고분' : ''}</span></div>`; tip.style.opacity = 1; tip.style.left = Math.min((x + bw + 6) * s, box.clientWidth - tip.offsetWidth - 4) + 'px'; tip.style.top = Math.max((y - 30) * s, 0) + 'px'; };
      h2.addEventListener('pointerenter', on); h2.addEventListener('focus', on);
      h2.addEventListener('pointerleave', () => tip.style.opacity = 0); h2.addEventListener('blur', () => tip.style.opacity = 0);
    });
  }

  /* 칸 안 작은 추세선(12개월, 흐린 선 + 마지막 점만 강조) */
  function spark(arr, w = 96, h = 26) {
    const v = arr.filter(x => x != null); if (v.length < 2) return '';
    const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
    const p = v.map((x, i) => [(i / (v.length - 1) * (w - 6) + 1).toFixed(1), (h - 4 - (x - mn) / r * (h - 8)).toFixed(1)]);
    const lp = p[p.length - 1];
    return `<svg class="djc-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${p.map(q => q.join(',')).join(' ')}" fill="none" stroke="#b7bdc8" stroke-width="1.5" stroke-linejoin="round"/><circle cx="${lp[0]}" cy="${lp[1]}" r="3" fill="${C.m}" stroke="#fff" stroke-width="1.5"/></svg>`;
  }
  return {price, volume, spark, C};
})();
