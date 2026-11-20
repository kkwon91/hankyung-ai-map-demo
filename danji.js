/* 단지 페이지 — 수도권 모든 아파트 단지(주소 #d/단지아이디)
 * 자료: data/search.js(HK_SEARCH 단지 목록) + data/d/{시군구5자리}.js(HK_SHARD 단지 상세) + map.js(지역·기사)
 * 파일로 열어도 되도록 fetch 대신 <script> 로 불러온다.
 */
window.DJP = (function () {
  const M = window.HK_MAP, H = window.HK;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const SH = {}, waits = {};
  window.HK_SHARD = (code, obj) => { SH[code] = obj; (waits[code] || []).forEach(f => f()); delete waits[code]; };
  function load(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error(src)); document.head.appendChild(s); }); }
  let searchP = null;
  const loadSearch = () => searchP || (searchP = window.HK_SEARCH ? Promise.resolve() : load('data/search.js'));
  function loadShard(code) {
    if (SH[code]) return Promise.resolve(SH[code]);
    return new Promise((ok, no) => { (waits[code] = waits[code] || []).push(() => ok(SH[code])); if (waits[code].length === 1) load(`data/d/${code}.js`).catch(no); });
  }
  const IDX = () => { if (!window._hkIdx) { window._hkIdx = {}; (window.HK_SEARCH || []).forEach(r => window._hkIdx[r[0]] = r); } return window._hkIdx; };

  /* 표기 */
  const eok = v => { if (v == null) return '–'; const e = Math.floor(v / 10000), m = Math.round(v % 10000); return e ? `${e}억${m ? m + '만' : ''}원` : `${m}만원`; };
  const eokS = v => v == null ? '–' : v >= 10000 ? (v / 10000).toFixed(v >= 100000 ? 1 : 2).replace(/\.?0+$/, '') + '억' : Math.round(v).toLocaleString() + '만';
  const pctS = v => v == null ? '–' : Math.abs(v) < 0.05 ? '보합' : (v > 0 ? '▲' : '▼') + Math.abs(v).toFixed(1) + '%';
  const ud = v => v == null ? '' : v > 0.04 ? 'up' : v < -0.04 ? 'down' : 'flat';
  const last = a => { if (!a) return null; for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i]; return null; };
  const at = (a, back) => a && a.length > back ? a[a.length - 1 - back] : null;
  const chg = (a, k) => { const x = last(a), y = at(a, k); return x && y ? (x / y - 1) * 100 : null; };
  const pyeongOf = pa => Math.round(pa * 1.33 / 3.3058);
  const sggOf = code => code ? code.slice(0, 5) + '00000' : '';

  /* 시안 송파 10개 단지(사진·전문 중개사 예시) */
  const DEMO = Object.fromEntries((H.DANJI || []).map(d => [d.id, d]));
  const partnerOf = id => { const d = DEMO[id]; return d && d.master && d.master.status === 'sold' ? d.master : null; };

  /* 대표 평형 = 84㎡ 에 가장 가까운 것(없으면 거래 많은 것) */
  function repType(x) {
    if (!x.types.length) return null;
    return [...x.types].sort((a, b) => Math.abs(a[0] - 84) - Math.abs(b[0] - 84))[0];
  }

  function chart(t, months, w = 760, h = 230) {
    const mm = t[2].map(v => v == null ? null : v * 100), jj = t[3].map(v => v == null ? null : v * 100);
    const all = [...mm, ...jj].filter(v => v != null);
    if (all.length < 2) return '<div class="note" style="padding:30px 0;text-align:center">시세 자료가 아직 없습니다</div>';
    let mn = Math.min(...all), mx = Math.max(...all);
    const pad = (mx - mn) * .12 || mx * .05; mn = Math.max(0, mn - pad); mx += pad;
    const L = 50, R = 70, T = 14, B = 26, iw = w - L - R, ih = h - T - B;
    const x = i => L + i / (months.length - 1) * iw, y = v => T + ih - (v - mn) / (mx - mn) * ih;
    let g = '';
    const step = (mx - mn) / 4;
    for (let k = 0; k <= 4; k++) { const v = mn + step * k; g += `<line x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}" stroke="#eee"/><text x="${L - 8}" y="${y(v) + 4}" font-size="11" fill="#888" text-anchor="end">${(v / 10000).toFixed(1)}억</text>`; }
    months.forEach((m, i) => { if (m.endsWith('-01') || i === months.length - 1) g += `<text x="${x(i)}" y="${h - 6}" font-size="11" fill="#888" text-anchor="middle">${i === months.length - 1 ? m.slice(2).replace('-', '.') : m.slice(0, 4)}</text>`; });
    const line = (arr, c, wd) => { const pts = arr.map((v, i) => v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(' '); return pts ? `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${wd}" stroke-linejoin="round"/>` : ''; };
    g += line(jj, '#9aa3b5', 2) + line(mm, '#0d79c7', 2.4);
    const li = mm.length - 1;
    if (mm[li] != null) g += `<circle cx="${x(li)}" cy="${y(mm[li])}" r="4" fill="#0d79c7"/><text x="${x(li) + 8}" y="${y(mm[li]) + 4}" font-size="12.5" font-weight="700" fill="#0d79c7">${eokS(mm[li])}</text>`;
    if (jj[li] != null) g += `<circle cx="${x(li)}" cy="${y(jj[li])}" r="3.5" fill="#9aa3b5"/><text x="${x(li) + 8}" y="${y(jj[li]) + 4}" font-size="12" font-weight="700" fill="#6b7385">${eokS(jj[li])}</text>`;
    if (t[4]) { const v = t[4][0]; if (v >= mn && v <= mx) g += `<line x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}" stroke="#b50000" stroke-dasharray="4 4"/><text x="${L + 4}" y="${y(v) - 5}" font-size="11" fill="#b50000">최고가 ${eokS(v)} (${t[4][1]})</text>`; }
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block">${g}</svg>`;
  }

  function brief(x, t) {
    const glue = s => s.replace(/(\d)(%|억|만원|원|건|층|㎡|호|배)(?=[가-힣])/g, '$1$2⁠');
    if (!t) return {head: `${x.hh.toLocaleString()}세대 단지`, body: '시세 자료가 아직 없습니다.'};
    const m = last(t[2]) * 100, c12 = chg(t[2], 12), j = last(t[3]) * 100, pa = t[0];
    const tr = x.tr.filter(r => Math.abs(r[1] - pa) < 3);
    const p = v => Math.abs(v).toFixed(1) + '%';
    const md = r => `${+r[0].slice(3, 5)}월 ${+r[0].slice(6, 8)}일`;
    const recentHi = tr.find(r => r[6] && r[0] >= '26.08');
    const gap = t[4] ? (m / t[4][0] - 1) * 100 : null;
    const jr = m && j ? Math.round(j / m * 100) : null;
    let head, used;
    if (recentHi) { head = `${pa}㎡ ${md(recentHi)} ${eok(recentHi[3])}, 최고가 경신`; used = 'hi'; }
    else if (gap != null && gap <= -10) { head = `최고가보다 ${Math.round(-gap)}% 낮은 시세`; used = 'gap'; }
    else if (c12 != null && Math.abs(c12) >= 2) { head = `1년 새 시세 ${p(c12)} ${c12 > 0 ? '상승' : '하락'}`; used = 'c12'; }
    else if (jr != null && jr >= 75) { head = `전세가율 ${jr}%, 매매가와 ${eokS(m - j)} 차이`; used = 'jr'; }
    else { head = `${pa}㎡ 시세 ${eokS(m)}, 1년 전과 비슷`; used = 'm'; }
    const s = [];
    if (used !== 'm') s.push(`전용 ${pa}㎡ 시세는 ${eok(m)}${c12 != null && used !== 'c12' ? `으로 1년 전보다 ${p(c12)} ${c12 >= 0 ? '높다' : '낮다'}` : '이다'}.`);
    if (used === 'gap') s.push(`최고가는 ${t[4][1]}년 ${eok(t[4][0])}이었다.`);
    else if (used !== 'hi' && tr.length) s.push(`최근 거래는 ${md(tr[0])} ${eok(tr[0][3])}(${tr[0][2]}층).`);
    if (s.length < 2 && used !== 'jr' && jr != null) s.push(`전세가율은 ${jr}%다.`);
    return {head: glue(head), body: glue(s.slice(0, 2).join(' '))};
  }

  let cur = null, curType = null, miniMap = null;
  async function open(id, el) {
    el.innerHTML = `<div class="wrap" style="padding:80px 20px;text-align:center" class="note">단지 정보를 불러오는 중…</div>`;
    try { await loadSearch(); } catch (e) { el.innerHTML = '<div class="wrap" style="padding:60px 20px">단지 목록을 불러오지 못했습니다.</div>'; return; }
    const r = IDX()[id];
    if (!r) { el.innerHTML = `<div class="wrap" style="padding:60px 20px">수도권 아파트 단지 목록에 없는 단지입니다. <a href="#s1" style="color:var(--blue)">첫 화면으로</a></div>`; return; }
    let sh;
    try { sh = await loadShard(r[8]); } catch (e) { el.innerHTML = '<div class="wrap" style="padding:60px 20px">단지 자료를 불러오지 못했습니다.</div>'; return; }
    const x = sh.d[id];
    cur = {id, x, sh, r}; curType = null;
    render(el);
  }

  function render(el) {
    const {id, x, sh} = cur;
    const months = sh.months;
    const types = x.types;
    const t = curType != null ? types[curType] : repType(x);
    if (curType == null && t) curType = types.indexOf(t);
    const demo = DEMO[id], pt = partnerOf(id), app = window.HKS && HKS.appFor(id);
    const regE = M.reg[x.code], regG = M.reg[sggOf(x.code)];
    const key = x.n.replace(/\(.*\)/, '').replace(/아파트$/, '');
    const arts = M.news.filter(a => a[1].includes(key) || (a[7] || '').includes(key)).slice(0, 4);
    const artsNear = arts.length >= 3 ? [] : M.news.filter(a => a[6] === x.code && !arts.includes(a)).slice(0, 4 - arts.length);
    const m = t ? last(t[2]) : null, j = t ? last(t[3]) : null;
    const c12 = t ? chg(t[2], 12) : null, c24 = t ? chg(t[2], 24) : null;
    const trT = t ? x.tr.filter(r => Math.abs(r[1] - t[0]) < 3) : x.tr;
    const nb = Object.entries(sh.d).filter(([k, y]) => y.code === x.code && k !== id && y.types.length).sort((a, b) => b[1].hh - a[1].hh).slice(0, 6);
    const rows = [[id, x], ...nb].map(([k, y]) => { const q = repType(y); return {k, y, q, m: q ? last(q[2]) : null, c: q ? chg(q[2], 12) : null, jr: q && last(q[3]) && last(q[2]) ? Math.round(last(q[3]) / last(q[2]) * 100) : null}; });
    const cmpMax = Math.max(1, ...rows.map(o => o.m || 0));
    const busy = Object.entries(sh.d).filter(([, y]) => y.n1y).sort((a, b) => b[1].n1y - a[1].n1y).slice(0, 5);
    const crumbS = x.sd === '서울' ? '서울' : x.sd;
    const photo = demo && demo.photo;
    const fav = window.HKS && HKS.isFav(id);

    el.innerHTML = hkHeader('') + `
    <div class="wrap">
      <div class="crumb"><a href="#s1">집코노미</a> › <a href="#s1">부동산맵</a> › ${esc(crumbS)} ${esc(x.sgg)} › ${esc(x.emd)} › <b>${esc(x.n)}</b></div>
      <div class="dtitle">
        <div><div class="ntag"><span class="b ai">단지 분석</span><span class="c bl">${esc(x.sgg)} ${esc(x.emd)}</span>${x.bt === '재건축' ? '<span class="c">재건축</span>' : ''}</div><h1>${esc(x.n)}</h1>
        <div class="meta">${[x.hh ? x.hh.toLocaleString() + '세대' : '', x.dongs ? x.dongs + '개 동' : '', x.cd ? x.cd.replace('-', '.') + ' 입주' : '', x.ft ? `최고 ${x.ft}층` : '', x.pk && x.hh ? `세대당 주차 ${(x.pk / x.hh).toFixed(2)}대` : '', x.heat || ''].filter(Boolean).join(' · ')}</div>
        <div class="meta" style="margin-top:2px">${esc(x.ar || x.ab || '')}${x.cn ? ' · 시공 ' + esc(x.cn) : ''}</div></div>
        <div class="tools"><span class="favbtn ${fav ? 'on' : ''}" id="djFav" title="관심단지">${fav ? '♥' : '♡'}</span><span>${IC.share}</span></div></div>
      <div class="s3-body">
        <div>
          ${photo ? `<figure class="hero" style="margin:0"><div class="img"><img class="ph" src="${photo}" alt=""></div><figcaption>${demo.photoCap || ''}</figcaption></figure>`
            : `<div class="dj-mini" id="djMini"></div><div class="note" style="margin-top:4px">지도 가격은 단지별 84㎡ 안팎 시세 · 누르면 그 단지로 이동</div>`}
          <div class="ticker">
            <div><div class="l">매매 시세${t ? ` ${t[0]}㎡` : ''}</div><div class="v">${m ? eokS(m * 100) : '–'}</div><div class="s note">${months[months.length - 1].replace('-', '.')} 기준</div>${t ? DJC.spark(t[2].slice(-13)) : ''}</div>
            <div><div class="l">전세 시세</div><div class="v">${j ? eokS(j * 100) : '–'}</div><div class="s note">전세가율 ${m && j ? Math.round(j / m * 100) + '%' : '–'}</div></div>
            <div><div class="l">1년 변동</div><div class="v ${ud(c12)}">${pctS(c12)}</div><div class="s note">2년 ${pctS(c24)}</div></div>
            <div><div class="l">2017년 이후 최고가</div><div class="v">${t && t[4] ? eokS(t[4][0]) : '–'}</div><div class="s note">${t && t[4] ? `${t[4][1]}년 · 현재 ${(m * 100 / t[4][0] * 100).toFixed(0)}% 수준` : '거래 없음'}</div></div>
            <div><div class="l">1년 실거래</div><div class="v">${x.n1y}건</div><div class="s note">해제 거래 제외</div>${x.vm ? DJC.spark(x.vm) : ''}</div>
          </div>
          ${(B => `<div class="aisum" style="margin-top:22px"><div class="h">숫자로 본 ${esc(x.n)}</div><strong class="bh">${esc(B.head)}</strong>${esc(B.body)}<div class="src">${months[months.length - 1].replace('-', '.')} 시세·국토부 실거래 기준 자동 작성</div></div>`)(brief(x, t))}

          <div class="s3-sec"><div class="sec-tit">시세와 실거래 <span class="sub">${t ? `전용 ${t[0]}㎡ · ` : ''}최근 2년 시세 · 1년 실거래</span></div>
            ${types.length > 1 ? `<div class="dj-types">${types.map((q, i) => `<button data-ti="${i}" class="${i === curType ? 'on' : ''}">${q[0]}㎡<small>${pyeongOf(q[0])}평</small></button>`).join('')}</div>` : ''}
            ${t ? '<div class="djc" id="djcPrice"></div>' : '<div class="note" style="padding:30px 0">시세 자료가 아직 없습니다</div>'}
            <div class="src">실거래는 계약일 기준, 해제 거래 제외</div></div>

          ${x.vm && x.vm.some(Boolean) ? `<div class="s3-sec"><div class="sec-tit">월별 실거래 <span class="sub">모든 면적 · 최근 12개월 ${x.vm.reduce((a, b) => a + b, 0)}건</span></div><div class="djc" id="djcVol"></div><div class="src">계약일 기준 · 11월은 19일까지 신고분</div></div>` : ''}

          <div class="s3-sec"><div class="sec-tit">실거래 <span class="sub">${t ? `전용 ${t[0]}㎡ · ` : ''}최근 1년 ${trT.length}건</span></div>
            ${trT.length ? `<table class="tbl"><tr><th>계약일</th><th>전용</th><th>층</th><th class="r">거래가</th><th></th></tr>${trT.slice(0, 15).map(r => `<tr><td class="num">${r[0]}</td><td>${r[1]}㎡</td><td>${r[2]}층</td><td class="r num"><b class="${r[6] ? 'up' : ''}">${eok(r[3])}</b></td><td class="note">${r[6] ? '<span class="dj-hi">최고가</span>' : ''}${r[5] ? '직거래' : ''}</td></tr>`).join('')}</table>`
              : '<div class="note" style="padding:14px 0">최근 1년 이 면적 거래 없음</div>'}
            <div class="src">국토교통부 실거래가 · 최고가는 2017년 이후 같은 면적 기준</div></div>

          <div class="s3-sec"><div class="sec-tit">${esc(x.emd)} 이웃 단지 <span class="sub">84㎡ 안팎 시세 · 세대수 큰 순</span></div>
            <table class="tbl dj-cmp"><tr><th>단지</th><th class="r c-hh">세대·입주</th><th class="r">매매 시세</th><th class="r">1년</th><th class="r">전세가율</th></tr>
            ${rows.map(o => `<tr class="${o.k === id ? 'me' : 'go'}" ${o.k === id ? '' : `data-go="${o.k}"`}><td><b>${esc(o.y.n)}</b>${o.q ? `<div class="note">${o.q[0]}㎡</div>` : ''}</td><td class="r note num c-hh">${o.y.hh.toLocaleString()} · ${o.y.cd ? o.y.cd.slice(0, 4) : ''}</td><td class="r num"><span class="djc-cell">${o.m ? `<i style="width:${Math.round(o.m / cmpMax * 64)}px"></i>` : ''}${o.m ? eokS(o.m * 100) : '–'}</span></td><td class="r num ${ud(o.c)}">${pctS(o.c)}</td><td class="r num">${o.jr ? o.jr + '%' : '–'}</td></tr>`).join('')}</table></div>

          <div class="s3-sec"><div class="sec-tit">한경 뉴스 <span class="sub">${arts.length ? `'${esc(key)}'가 나온 기사` : `${esc(x.emd)} 기사`}</span></div>
            ${[...arts, ...artsNear].length ? [...arts, ...artsNear].map(a => `<a class="nitem" href="${a[3]}" target="_blank" rel="noopener"><div style="flex:1;min-width:0"><div class="t">${esc(a[1])}</div><div class="date">${a[8]}</div></div><div class="thumb"><img class="ph" src="${a[2]}" alt="" loading="lazy"></div></a>`).join('')
              : `<div class="note" style="padding:12px 0">아직 이 동네 기사가 없습니다. <a href="#s1" style="color:var(--blue)">${esc(x.sgg)} 기사 보기 ›</a></div>`}</div>
        </div>

        <aside><div style="position:sticky;top:60px">
          ${pt ? `<div class="mcard"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="mbadge">단지 전문 중개사 · ${esc(x.n)}</span><span class="ad">광고</span></div>
              <div class="row"><img class="face" src="${H.FACE[pt.name] || H.FACE['김OO']}" style="width:72px;height:72px" alt=""><div><b style="font-size:18px">${pt.name} 대표</b><div class="note">${pt.office}</div><div style="font-size:12.5px;margin-top:3px">거래 ${pt.deals}건 · ★ ${pt.rating}</div></div></div>
              <button class="btn navy" style="width:100%;margin-top:12px;height:42px" data-lead="partner">상담 신청</button>
              <div class="legal">예시 중개사 · 등록번호·소재지는 전문 페이지에 표시</div></div>`
            : `<div class="mcard dj-empty"><div style="display:flex;justify-content:space-between;align-items:center"><b>단지 전문 중개사</b><span class="ad">광고 자리</span></div>
              ${app ? `<div class="dj-app"><b>${esc(app.office)}</b> 신청 · <span>${app.st}</span><div class="note">${app.at} 접수</div></div>`
                : `<p class="note" style="margin:8px 0 10px;line-height:1.55">상담을 남기면 ${esc(x.sgg)} 집코노미 파트너스 중개사가 연락드립니다.</p>`}
              <button class="btn navy" style="width:100%;height:42px" data-lead="pool">상담 신청</button>
              ${app ? '' : `<button class="btn line" style="width:100%;margin-top:6px" data-apply="1">이 단지 전문 중개사 신청 <span class="note">중개사용</span></button>`}</div>`}
          ${regE || regG ? `<div class="box" style="margin-top:16px"><div class="box-tit">동네 시세 <a href="#s1" class="more" data-region="${regE ? x.code : sggOf(x.code)}">지도에서 보기 ›</a></div>
            ${[regE, regG].filter(Boolean).map(rg => { const c1 = rg.m && at(rg.m, 1) ? (last(rg.m) / at(rg.m, 1) - 1) * 100 : null, c12r = rg.m && at(rg.m, 12) ? (last(rg.m) / at(rg.m, 12) - 1) * 100 : null; return `<div class="dj-reg"><b>${esc(rg.n)}</b><span class="num">평당 ${last(rg.m) ? last(rg.m).toLocaleString() + '만원' : '–'}</span><i class="${ud(c1)}">1개월 ${pctS(c1)}</i><i class="${ud(c12r)}">1년 ${pctS(c12r)}</i></div>`; }).join('')}</div>` : ''}
          <div class="box" style="margin-top:16px"><div class="box-tit">${esc(x.sgg)} 거래 많은 단지 <span class="more">최근 1년</span></div>
            ${busy.map(([k, y], i) => `<div class="rank-item go" data-go="${k}"><span class="no">${i + 1}</span><div style="flex:1;font-size:13.5px"><b>${esc(y.n)}</b><div class="note">${esc(y.emd)} · ${y.n1y}건</div></div></div>`).join('')}</div>
        </div></aside>
      </div>
    </div>
    <div class="s3-sticky"><div class="wrap">
      <button class="btn line" id="djFav2">${fav ? '♥ 관심단지' : '♡ 관심단지'}</button>
      <button class="btn navy" style="flex:1;height:44px" data-lead="${pt ? 'partner' : 'pool'}">${pt ? `단지 전문 중개사 ${pt.name} 대표 상담받기 <span class="ad" style="border-color:#5a6b96;color:#c9d3ea">광고</span>` : '이 단지 상담 신청'}</button></div></div>
    <div class="wrap" style="display:flex;justify-content:space-between;padding:10px 20px 16px"><span class="note">실제 거래가격과 다를 수 있습니다.</span><span class="note">데이터: 시세 · 국토교통부 실거래가</span></div>`;

    el.querySelectorAll('.dj-types button').forEach(b => b.onclick = () => { curType = +b.dataset.ti; render(el); });
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { location.hash = 'd/' + b.dataset.go; });
    el.querySelectorAll('[data-lead]').forEach(b => b.onclick = () => leadForm(b.dataset.lead));
    el.querySelectorAll('[data-apply]').forEach(b => b.onclick = applyForm);
    el.querySelectorAll('[data-region]').forEach(b => b.onclick = e => { e.preventDefault(); location.hash = 's1'; setTimeout(() => window.PMAP && PMAP.openRegion(b.dataset.region, true), 400); });
    const favT = () => { const on = HKS.toggleFav(id, x.n); render(el); toast(on ? '관심단지에 담았습니다' : '관심단지에서 뺐습니다'); };
    ['#djFav', '#djFav2'].forEach(s => { const b = $(s, el); if (b) b.onclick = favT; });
    if (!photo) setTimeout(() => mini(x, sh), 30);
    if (t) DJC.price(document.getElementById('djcPrice'), t, months, trT);
    if (x.vm && document.getElementById('djcVol')) DJC.volume(document.getElementById('djcVol'), x.vm, sh.vmonths || []);
  }

  function mini(x, sh) {
    const box = document.getElementById('djMini'); if (!box) return;
    if (miniMap) { miniMap.remove(); miniMap = null; }
    miniMap = L.map(box, {zoomControl: true, scrollWheelZoom: true, zoomSnap: 1, zoomAnimation: false}).setView([x.la, x.ln], 16);
    addBase(miniMap);
    Object.entries(sh.d).forEach(([k, y]) => {
      if (Math.abs(y.la - x.la) > .02 || Math.abs(y.ln - x.ln) > .025) return;
      const q = repType(y), me = k === cur.id;
      const html = `<div class="pm-pin ${me ? 'sel' : ''}"><span class="nm" ${me ? 'style="color:#fff"' : ''}>${esc(y.n.length > 9 ? y.n.slice(0, 9) + '…' : y.n)}</span><b>${q && last(q[2]) ? eokS(last(q[2]) * 100) : '–'}</b></div>`;
      L.marker([y.la, y.ln], {zIndexOffset: me ? 1000 : 0, icon: L.divIcon({className: '', html})}).addTo(miniMap).on('click', () => { if (!me) location.hash = 'd/' + k; });
    });
  }

  /* ── 상담 신청·중개사 신청 (시안: 이 브라우저에만 저장) ── */
  function modal(html) { $('#modalBox').innerHTML = html; $('#modal').style.display = 'flex'; }
  function closeModal() { $('#modal').style.display = 'none'; }
  function toast(msg) { let t = document.getElementById('hkToast'); if (!t) { t = document.createElement('div'); t.id = 'hkToast'; t.className = 'hk-toast'; document.body.appendChild(t); } t.innerHTML = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3200); }
  function leadForm(kind) {
    const {id, x} = cur, pt = partnerOf(id), t = cur.x.types[curType];
    modal(`<form class="hk-form" id="leadF"><h3>${esc(x.n)} 상담 신청</h3>
      <div class="note" style="margin:-4px 0 12px">${pt ? `단지 전문 중개사 <b>${pt.office} ${pt.name} 대표</b>에게 전달됩니다.` : `${esc(x.sgg)} 집코노미 파트너스 중개사에게 전달됩니다.`}</div>
      <label>이름<input name="name" required maxlength="20" placeholder="홍길동"></label>
      <label>연락처<input name="tel" required inputmode="tel" pattern="[0-9\\- ]{9,14}" placeholder="010-0000-0000"></label>
      <div class="row2"><label>관심<select name="kind"><option>매수</option><option>매도</option><option>전세</option><option>월세</option></select></label>
      <label>면적<select name="area">${x.types.map((q, i) => `<option ${i === curType ? 'selected' : ''}>${q[0]}㎡ (${pyeongOf(q[0])}평)</option>`).join('') || '<option>상관없음</option>'}</select></label></div>
      <label>남길 말<textarea name="msg" rows="3" maxlength="300" placeholder="예) 저층 제외, 3개월 안 입주 가능한 매물 찾습니다"></textarea></label>
      <label class="agree"><input type="checkbox" name="ok" required> 이름·연락처를 중개사에게 전달하는 데 동의합니다. 상담이 끝나고 90일 뒤 지웁니다.</label>
      <div class="demo-note">시안이라 실제로 보내지 않고 이 브라우저에만 남깁니다.</div>
      <div class="btns"><button type="button" class="btn line" id="fCancel">취소</button><button class="btn navy">신청하기</button></div></form>`);
    $('#fCancel').onclick = closeModal;
    $('#leadF').onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target);
      HKS.addLead({danjiId: id, danji: x.n, sgg: x.sgg, name: f.get('name'), tel: f.get('tel'), kind: f.get('kind'), area: f.get('area'), msg: f.get('msg'), to: pt ? pt.office : `${x.sgg} 파트너스 배정 대기`, from: '단지 페이지'});
      closeModal(); toast(`상담 신청이 접수됐습니다 · <a href="#s5" style="color:#9fd0ff">중개사 화면에서 보기 ›</a>`);
    };
  }
  function applyForm() {
    const {id, x} = cur, hh = x.hh || 0;
    const tierP = hh >= 5000 ? ['S', 200] : hh >= 2000 ? ['A', 120] : hh >= 1000 ? ['B', 70] : ['C', 40];
    modal(`<form class="hk-form" id="appF"><h3>${esc(x.n)} 전문 중개사 신청</h3>
      <div class="note" style="margin:-4px 0 12px">단지당 1곳 · ${hh.toLocaleString()}세대 ${tierP[0]}등급 월 ${tierP[1]}만원(가설)</div>
      <label>중개사무소 이름<input name="office" required maxlength="40" placeholder="○○공인중개사사무소"></label>
      <div class="row2"><label>대표 공인중개사<input name="ceo" required maxlength="20"></label><label>등록번호<input name="reg" required maxlength="30" placeholder="11710-2020-00000"></label></div>
      <label>사무소 연락처<input name="tel" required inputmode="tel" placeholder="02-000-0000"></label>
      <label>상품<select name="tier"><option value="premium">단지파트너(프리미엄) — 이 단지 단독 노출</option><option value="standard">집코노미 파트너스(스탠다드) — 전문 페이지만</option></select></label>
      <div class="demo-note">시안이라 이 브라우저에만 남깁니다. 실제 신청은 한경부동산 플러스에서 합니다.</div>
      <div class="btns"><button type="button" class="btn line" id="fCancel">취소</button><button class="btn navy">신청하기</button></div></form>`);
    $('#fCancel').onclick = closeModal;
    $('#appF').onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target);
      HKS.addApp({danjiId: id, danji: x.n, hh, tier: f.get('tier'), grade: tierP[0], price: tierP[1], office: f.get('office'), ceo: f.get('ceo'), reg: f.get('reg'), tel: f.get('tel')});
      closeModal(); render(document.getElementById('s3frame')); toast(`신청이 접수됐습니다 · <a href="#s5" style="color:#9fd0ff">한경부동산 플러스에서 보기 ›</a>`);
    };
  }

  /* ── 검색(단지·동·구) ── */
  function norm(s) { return s.replace(/\s+/g, '').toLowerCase(); }
  async function search(q) {
    q = norm(q); if (q.length < 1) return [];
    await loadSearch();
    const out = [];
    Object.values(M.reg).forEach(r => { if ((r.lv === 'sgg' || r.lv === 'emd') && r.n && norm(r.n).includes(q)) out.push({t: 'r', code: r.code, n: r.n, sub: r.lv === 'emd' ? `${r.sd} ${r.sgg}` : r.sd, s: norm(r.n).startsWith(q) ? 0 : 1}); });
    const ds = [];
    for (const r of window.HK_SEARCH) { const n = norm(r[1]); const i = n.indexOf(q); if (i >= 0) ds.push({t: 'd', id: r[0], n: r[1], sub: `${r[4]} ${r[2]} ${r[3]} · ${r[5].toLocaleString()}세대`, s: (i === 0 ? 0 : 1) + (1 - Math.min(r[5], 9999) / 10000)}); }
    ds.sort((a, b) => a.s - b.s);
    out.sort((a, b) => a.s - b.s);
    return [...out.slice(0, 3), ...ds.slice(0, 10)];
  }
  function bindSearch(input, list, onPick) {
    let tm;
    loadSearch();
    input.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(async () => {
      const res = await search(input.value);
      list.innerHTML = res.map((r, i) => `<li data-i="${i}" class="${i === 0 ? 'on' : ''}"><b>${esc(r.n)}</b><small>${r.t === 'r' ? '지역 · ' : ''}${esc(r.sub)}</small></li>`).join('') || (input.value ? '<li class="none">찾는 단지가 없습니다. 수도권 아파트만 찾을 수 있습니다.</li>' : '');
      list.hidden = !list.innerHTML;
      list._res = res;
      list.querySelectorAll('li[data-i]').forEach(li => li.onmousedown = e => { e.preventDefault(); pick(res[+li.dataset.i]); });
    }, 120); });
    input.addEventListener('keydown', e => {
      const lis = [...list.querySelectorAll('li[data-i]')]; let i = lis.findIndex(l => l.classList.contains('on'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + lis.length) % lis.length; lis.forEach((l, k) => l.classList.toggle('on', k === i)); }
      if (e.key === 'Enter') { e.preventDefault(); if (list._res && list._res[Math.max(i, 0)]) pick(list._res[Math.max(i, 0)]); }
      if (e.key === 'Escape') list.hidden = true;
    });
    input.addEventListener('blur', () => setTimeout(() => list.hidden = true, 150));
    function pick(r) { list.hidden = true; input.value = r.n; input.blur(); onPick(r); }
  }
  const go = r => { if (r.t === 'd') location.hash = 'd/' + r.id; else { if (location.hash !== '#s1') location.hash = 's1'; setTimeout(() => window.PMAP && PMAP.openRegion(r.code, true), 300); } };

  return {open, bindSearch, go, toast, loadSearch};
})();
