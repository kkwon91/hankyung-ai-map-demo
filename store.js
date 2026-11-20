/* 시안용 저장소: 상담 신청·중개사 신청을 보는 사람 브라우저(localStorage)에 저장한다.
 * 서버가 없으므로 다른 사람·다른 기기와는 공유되지 않는다(화면에 그렇게 표시). */
window.HKS = (function () {
  const K = {leads: 'hk_demo_leads_v1', apps: 'hk_demo_apps_v1', fav: 'hk_demo_fav_v1'};
  const get = k => { try { return JSON.parse(localStorage.getItem(K[k]) || '[]'); } catch (e) { return []; } };
  const set = (k, v) => { try { localStorage.setItem(K[k], JSON.stringify(v)); } catch (e) { /* 사생활 보호 창 등 */ } };
  const now = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const mask = s => s ? s[0] + '*' + s.slice(2) : '';
  const maskTel = t => { const n = (t || '').replace(/\D/g, ''); return n.length >= 10 ? `${n.slice(0, 3)}-****-${n.slice(-4, -2)}XX` : t; };
  return {
    leads: () => get('leads'),
    apps: () => get('apps'),
    fav: () => get('fav'),
    addLead(o) { const a = get('leads'); a.unshift({...o, at: now(), st: 'new'}); set('leads', a.slice(0, 200)); },
    addApp(o) { const a = get('apps'); a.unshift({...o, at: now(), st: '심사 중'}); set('apps', a.slice(0, 50)); },
    toggleFav(id, n) { let a = get('fav'); a = a.find(x => x.id === id) ? a.filter(x => x.id !== id) : [{id, n}, ...a]; set('fav', a); return !!a.find(x => x.id === id); },
    isFav: id => !!get('fav').find(x => x.id === id),
    appFor: id => get('apps').find(x => x.danjiId === id),
    clear() { Object.values(K).forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); },
    mask, maskTel
  };
})();
