/* 바탕 지도: 네이버 지도(실서비스와 같은 바탕) → 안 되면 OpenStreetMap
 * - 색칠·핀·카드는 그대로 Leaflet 이 그리고, 네이버 지도는 그 아래에서 같은 위치·배율로 따라 움직인다(조작은 Leaflet 이 받음).
 * - 네이버 지도는 등록한 주소(kkwon91.github.io)에서만 열린다. 파일로 열거나 인증이 실패하면 OSM 으로 바꾼다.
 *   파일(file:)로 열면 OSM 본 서버가 출처 없는 요청을 막아서 OSM 독일 서버를 쓴다.
 */
(function () {
  const NAVER_ID = 'ercr11gfa6';
  const useNaver = location.protocol === 'https:' || location.protocol === 'http:';
  window.HK_TILE_URL = location.protocol === 'file:' ? 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  if (useNaver) document.write(`<script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_ID}"><\/script>`);

  const bases = [];
  let failed = false;
  function toOsm(b) {
    if (b.osm) return;
    if (b.div) { b.div.remove(); b.div = null; }
    if (b.lm.attributionControl && !b.lm.attributionControl._map) b.lm.attributionControl.addTo(b.lm);
    b.osm = L.tileLayer(window.HK_TILE_URL, {maxZoom: 19, className: b.opt.className || '', attribution: '© OpenStreetMap'}).addTo(b.lm);
  }
  // 네이버 인증 실패 시 네이버가 부르는 전역 함수
  window.navermap_authFailure = function () { failed = true; bases.forEach(toOsm); };

  window.addBase = function (lm, opt = {}) {
    const b = {lm, opt};
    bases.push(b);
    lm.attributionControl && lm.attributionControl.setPrefix(false);
    if (!useNaver || failed || !(window.naver && naver.maps)) { toOsm(b); return b; }
    const c = lm.getContainer();
    const div = document.createElement('div');
    div.className = 'hk-naver' + (opt.gray ? ' gray' : '');
    div.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none';
    c.insertBefore(div, c.firstChild);
    b.div = div;
    // 네이버 지도가 쓰는 배율은 정수 → Leaflet 도 정수 배율, 확대 애니메이션 끔(둘이 어긋나지 않게)
    lm.options.zoomSnap = 1; lm.options.zoomDelta = 1; lm.options.zoomAnimation = false;
    lm._zoomAnimated = false;
    // 지도 출처 표기는 네이버 지도가 오른쪽 아래에 직접 띄움
    lm.attributionControl && lm.attributionControl.remove();
    // Leaflet 위치가 정해진 뒤(fitBounds/setView 이후)에 네이버 지도를 만든다
    lm.whenReady(() => { if (b.div) initNaver(b, div); });
    return b;
  };
  function initNaver(b, div) {
    const lm = b.lm;
    const ctr = lm.getCenter();
    const nm = new naver.maps.Map(div, {
      center: new naver.maps.LatLng(ctr.lat, ctr.lng), zoom: Math.round(lm.getZoom()),
      draggable: false, pinchZoom: false, scrollWheel: false, keyboardShortcuts: false, disableDoubleClickZoom: true, disableDoubleTapZoom: true, disableTwoFingerTapZoom: true,
      zoomControl: false, mapTypeControl: false, scaleControl: false,
      logoControl: true, logoControlOptions: {position: naver.maps.Position.BOTTOM_RIGHT},
      mapDataControl: true, mapDataControlOptions: {position: naver.maps.Position.BOTTOM_RIGHT},
      minZoom: 6, maxZoom: 19, background: '#f2f3f5'
    });
    b.nm = nm;
    const sync = () => {
      if (!b.div) return;
      const p = lm.getCenter();
      nm.setCenter(new naver.maps.LatLng(p.lat, p.lng));
      nm.setZoom(Math.round(lm.getZoom()), false);
    };
    const resize = () => { if (!b.div) return; const s = lm.getSize(); nm.setSize(new naver.maps.Size(s.x, s.y)); sync(); };
    lm.on('move zoom viewreset', sync);
    lm.on('resize', resize);
    b.resize = resize;
  }
})();
