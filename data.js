/* 집코노미 AI 단지지도 시안 데이터 — 리치고 단지 데이터·KB 시세·국토부 실거래(2026-10-14 조회).
 * 중개사·리드·제보자는 가상 인물, 단지 사진은 한경 기사 사진(사진 설명에 출처 표기). */
window.HK = (function () {
  const MONTHS = ['24.10','24.11','24.12','25.01','25.02','25.03','25.04','25.05','25.06','25.07','25.08','25.09','25.10','25.11','25.12','26.01','26.02','26.03','26.04','26.05','26.06','26.07','26.08','26.09','26.10'];

  const DANJI = [
    { id:'a1zUerj', name:'헬리오시티', dong:'가락동', lat:37.49751, lng:127.107693, hh:9510, built:'2018.12', py:33,
      kbM:29.25, kbJ:13.75, live:95, gn:34, gnG:5, trades3m:17, kw:['대단지','초품아','역세권'],
      ms:[235,232,231,232,236,247,256,255,268,277,280,288,295,303,306,306,293,280,277,280,285,297,298,295,295],
      js:[107,107,105,105,103,107,104,107,111,115,118,121,122,124,124,124,123,120,118,120,123,130,130,132,132],
      listing:{py:32, n:154, avg:28.95, min:27.0, max:32.0, date:'2026-10-13'},
      master:{status:'sold', name:'김OO', office:'송파헬리오OO공인중개사', deals:328, rating:4.9} },
    { id:'a1XtWXM', name:'잠실엘스', dong:'잠실동', lat:37.513348, lng:127.081556, hh:5678, built:'2008.09', py:33,
      kbM:33.18, kbJ:14.00, live:95, gn:11, gnG:2, trades3m:30, kw:['대단지','초품아'],
      ms:[267,267,265,264,277,288,289,298,320,333,330,334,333,337,337,341,344,324,326,328,333,338,338,335,336],
      js:[114,116,115,110,111,110,112,113,114,115,117,120,119,119,119,122,120,123,123,128,134,131,136,138,136],
      master:{status:'sold', name:'이OO', office:'잠실엘스OO부동산', deals:201, rating:4.8} },
    { id:'a0gasRS', name:'리센츠', dong:'잠실동', lat:37.513251, lng:127.08675, hh:5563, built:'2008.07', py:33,
      kbM:33.50, kbJ:15.00, live:95, gn:7, gnG:2, trades3m:24, kw:['대단지','초품아','역세권'],
      ms:[273,271,269,267,275,292,298,304,320,334,331,337,341,344,351,353,352,338,328,332,338,341,342,346,344],
      js:[128,128,126,112,114,118,121,122,123,128,128,127,127,129,133,131,131,132,133,136,141,141,147,147,147],
      master:{status:'sold', name:'박OO', office:'리센츠OO공인중개사', deals:160, rating:4.8} },
    { id:'a8kZEWf', name:'파크리오', dong:'신천동', lat:37.521278, lng:127.108677, hh:6864, built:'2008.08', py:33,
      kbM:29.00, kbJ:11.90, live:95, gn:2, gnG:1, trades3m:27, kw:['대단지','초품아','역세권'],
      ms:[225,228,228,227,232,246,247,254,268,279,279,282,292,297,298,299,297,286,280,282,288,293,297,293,292],
      js:[100,102,100,99,97,99,103,105,106,106,104,105,106,106,105,106,107,106,107,111,117,117,116,115,116],
      master:{status:'open'} },
    { id:'a9PtiNp', name:'트리지움', dong:'잠실동', lat:37.509812, lng:127.088394, hh:3696, built:'2007.08', py:33,
      kbM:31.46, kbJ:13.96, live:95, gn:15, gnG:3, trades3m:23, kw:['대단지','초품아','역세권'],
      ms:[255,254,253,248,262,281,277,283,301,317,317,315,320,318,320,321,321,302,307,309,315,319,318,318,318],
      js:[119,120,119,113,111,113,112,113,113,116,118,120,120,120,123,124,122,123,121,125,128,129,134,137,136],
      master:{status:'sold', name:'최OO', office:'잠실트리OO부동산', deals:142, rating:4.7} },
    { id:'a2FInWb', name:'잠실주공5단지', dong:'잠실동', lat:37.515769, lng:127.093913, hh:3930, built:'1978.04', py:34,
      kbM:41.75, kbJ:5.00, live:85, gn:52, gnG:5, trades3m:28, kw:['재건축','대단지','초품아'],
      ms:[298,301,310,310,326,350,363,376,395,420,418,410,411,412,413,419,422,414,402,413,407,418,431,419,420],
      js:[49,46,44,44,48,48,50,51,52,54,57,54,55,52,49,51,50,51,54,54,58,58,57,55,54],
      master:{status:'sold', name:'정OO', office:'잠실주공OO공인중개사', deals:256, rating:4.9} },
    { id:'a9jHYxD', name:'가락쌍용1차', dong:'가락동', lat:37.495622, lng:127.127624, hh:2064, built:'1997.03', py:33,
      kbM:21.75, kbJ:8.50, live:94, gn:58, gnG:5, trades3m:15, kw:['리모델링','대단지','역세권'],
      ms:[146,144,144,144,146,149,152,155,160,167,176,187,194,202,206,211,211,209,202,201,211,216,217,218,219],
      js:[64,64,64,62,64,67,68,70,71,72,76,77,77,78,83,83,82,81,80,80,80,81,81,78,79],
      master:{status:'open'} },
    { id:'a9twetl', name:'래미안파크팰리스', dong:'가락동', lat:37.498181, lng:127.132407, hh:919, built:'2007.11', py:32,
      kbM:23.80, kbJ:9.65, live:90, gn:45, gnG:5, trades3m:6, kw:['초품아','역세권'],
      ms:[177,176,176,176,176,178,180,182,188,196,199,200,210,227,230,230,235,235,225,227,235,244,247,244,246],
      js:[89,86,83,81,80,83,84,85,86,89,90,91,92,91,92,92,93,95,96,97,96,99,98,97,97],
      master:{status:'open'} },
    { id:'a9bkhXM', name:'송파파크하비오푸르지오', short:'파크하비오푸르지오', dong:'문정동', lat:37.480506, lng:127.123239, hh:999, built:'2016.09', py:34,
      kbM:19.65, kbJ:10.25, live:91, gn:63, gnG:5, trades3m:5, kw:['역세권'],
      ms:[157,157,155,153,158,160,160,163,165,172,174,175,180,183,190,195,198,201,197,198,205,203,206,204,204],
      js:[81,82,80,79,80,83,83,84,86,88,89,91,91,93,91,91,98,99,98,97,96,97,99,101,99],
      master:{status:'sold', name:'한OO', office:'문정OO공인중개사', deals:98, rating:4.6} },
    { id:'a5YFxWm', name:'잠실르엘', dong:'신천동', lat:37.517554, lng:127.107032, hh:1865, built:'2026.01', py:25,
      kbM:null, kbJ:null, live:95, gn:28, gnG:4, trades3m:null, kw:['신축','재건축','역세권'],
      ms:null, js:null, newBuild:true, master:{status:'open'} }
  ];

  // 헬리오시티 실거래 (2026-07 ~ 10, 취소 제외, 만원)
  const HELIO_TRADES = [
    ['2026-09-22',32,9,305500,'중개'],['2026-09-06',25,17,269000,'중개'],['2026-08-30',18,10,203000,'중개'],
    ['2026-08-15',33,35,290000,'중개'],['2026-08-07',33,15,310000,'중개'],['2026-08-03',42,27,347000,'중개'],
    ['2026-08-01',33,2,289000,'중개'],['2026-07-28',18,17,201000,'중개'],['2026-07-23',25,19,193000,'직거래'],
    ['2026-07-23',38,7,336000,'중개'],['2026-07-18',32,31,301500,'중개'],['2026-07-17',25,18,264700,'중개'],
    ['2026-07-11',18,8,210000,'중개'],['2026-07-10',32,24,300000,'중개'],['2026-07-09',42,15,352000,'중개']
  ];

  // 헬리오시티 단지 지식 (단지위키 18개 카테고리 중 발췌, 기준 2026-06)
  const HELIO_WIKI = [
    {k:'교통', st:'good', t:'8호선 송파역과 지하로 연결. 대치동 학원가행 버스가 단지 앞에 있어요.'},
    {k:'교육', st:'up', t:'단지 안에 초 2곳(해누리초·가락초)·중 1곳(해누리중). 증축으로 입주민 자녀 전원 배정이 합의됐어요.'},
    {k:'환경', st:'good', t:'평지 단지, 지상에 차가 다니지 않고 파크밴드 산책로가 있어요. 인근에 강남자원회수시설이 있어요.'},
    {k:'주차', st:'good', t:'세대당 1.32대. 전기차 충전기 급속 12대·완속 220대(250대로 확대 예정).'},
    {k:'시설', st:'up', t:'수영장·헬스장·골프연습장·사우나·도서관, 놀이터 18곳. 엘리베이터 에어컨 설치 완료.'},
    {k:'소음', st:'warn', t:'층간소음 언급이 꾸준해요. 슬래브 210mm·완충재 적용, 체감은 동마다 달라요.'},
    {k:'육아', st:'warn', t:'단지 안 어린이집 12곳(국공립 9곳)이지만 대기가 긴 편이에요.'},
    {k:'주변 개발', st:'up', t:'위례신사선이 재정사업으로 전환 확정. 역명은 \'탄천(헬리오시티)역\'이 유력해요.'}
  ];

  // 현장 제보 예시 — 중개사·코멘트는 가상, '계약' 제보의 가격·날짜·층은 국토부 실거래 신고와 실제로 대조됨
  // check: verified=계약 사실 확인(신고 전 · 속보 가능) / ok=국토부 신고 일치 / none=계약 확인 안 됨(보도 안 함) / na=분위기 제보
  // (10/20 수정안: 신고 전이라도 계약서 확인 뒤 속보 → 국토부 자료로 사후 대조 → 해제·정정 추적)
  const REPORTS = [
    {at:'10.14 08:50', who:'김OO', office:'송파헬리오OO공인중개사', master:true, danji:'헬리오시티', type:'분위기',
     text:'추석 이후 32평 매수 문의가 주 2~3건에서 5건 이상으로 늘었어요. 30억 아래 매물이 빠르게 빠지는 분위기입니다.', check:'na', mood:'up'},
    {at:'10.13 17:20', who:'윤OO', office:'가락OO부동산', master:false, danji:'가락쌍용1차', type:'문의 증가',
     text:'리모델링 기대에 24평 문의가 늘면서 집주인들이 호가를 1천만~2천만원 올렸어요.', check:'na', mood:'up'},
    {at:'10.11 14:05', who:'김OO', office:'송파헬리오OO공인중개사', master:true, danji:'헬리오시티', type:'계약',
     deal:'33평 · 고층 · 30억 2,000', text:'33평 고층 계약 완료. 매수인은 대치동 학원가 접근성을 보고 갈아탄 실거주자예요.', check:'verified', match:'계약서 확인(인적사항 가림) · 신고 기한 11.10', mood:'up'},
    {at:'10.09 11:40', face:'이OO2', who:'이OO', office:'가락시장OO부동산', master:false, danji:'헬리오시티', type:'전세 동향',
     text:'33평 전세 매물이 13억대 2~3개뿐이고 대부분 갱신 계약으로 돌아서요.', check:'na', mood:'same'},
    {at:'10.06 19:10', who:'윤OO', office:'가락OO부동산', master:false, danji:'가락쌍용1차', type:'계약',
     deal:'24평 · 고층 · 19억 3,500', text:'24평 18층 계약. 리모델링 일정 문의가 계약의 결정적 이유였어요.', check:'ok', match:'국토부 신고 10.06 · 24평 18층 19억 3,500', mood:'up'},
    {at:'09.22 16:30', who:'김OO', office:'송파헬리오OO공인중개사', master:true, danji:'헬리오시티', type:'계약',
     deal:'32평 · 중층 · 30억 5,500', text:'32평 중층 계약. 추석 전 30억 재돌파 거래예요.', check:'ok', match:'국토부 신고 09.22 · 32평 9층 30억 5,500', mood:'up'},
    {at:'09.12 13:15', who:'서OO', office:'래미안파크OO공인중개사', master:false, danji:'래미안파크팰리스', type:'계약',
     deal:'26평 · 저층 · 22억 9,000', text:'26평 저층 계약. 저층인데도 22억대 후반에 성사됐어요.', check:'ok', match:'국토부 신고 09.12 · 26평 6층 22억 9,000', mood:'up'},
    {at:'09.05 10:00', face:'박OO2', who:'박OO', office:'가락OOO부동산', master:false, danji:'가락쌍용1차', type:'계약',
     deal:'33평 · 고층 · 23억 5,000', text:'33평 신고가 계약 소식입니다.', check:'none', match:'계약서 미제출 · 39일째 신고 없음', mood:'up'}
  ];
  const DONG_REPORTS = [  // 읍면동별 최근 6주 제보 모임
    {dong:'가락동', total:8, deals:3, moods:4, ready:true},
    {dong:'잠실동', total:5, deals:1, moods:3, ready:false},
    {dong:'신천동', total:3, deals:1, moods:2, ready:false},
    {dong:'문정동', total:2, deals:1, moods:1, ready:false}
  ];

  // 단지 사진: 한경 기사 사진 중 사진 설명에 해당 단지명이 적힌 것(real:true). 못 찾은 3곳은 송파 일대 한경DB 사진(real:false)
  // 중개사 사진: randomuser.me 무료 인물 사진(가상 인물)
  const PHOTO = {
    a1zUerj:{src:'img/r_helio.jpg', cap:'서울 송파구 가락동 헬리오시티. 사진=이솔 기자', real:true},
    a1XtWXM:{src:'img/r_els.jpg', cap:'서울 송파구 잠실동 잠실엘스 전경. 사진=이송렬 기자', real:true},
    a0gasRS:{src:'img/r_ricenz.jpg', cap:'잠실동 리센츠 전경. 사진=한경DB', real:true},
    a9PtiNp:{src:'img/r_jamsil3.jpg', cap:'잠실엘스·리센츠·트리지움(왼쪽 중간)·레이크팰리스. 사진=최혁 기자', real:true},
    a2FInWb:{src:'img/r_jugong5.jpg', cap:'송파구 일대 아파트. 왼쪽 아래가 잠실주공5단지. 사진=한경DB', real:true},
    a9jHYxD:{src:'img/r_ssangyong.jpg', cap:"서울 송파구 가락동 '가락쌍용1차' 전경. 사진=쌍용건설", real:true},
    a5YFxWm:{src:'img/r_leel.jpg', cap:"서울 송파구 신천동 '잠실르엘' 전경. 사진=이송렬 기자", real:true},
    a8kZEWf:{src:'img/d_parkrio.jpg', cap:'송파구 일대 아파트 단지(해당 단지 사진 아님). 사진=한경DB', real:false},
    a9twetl:{src:'img/d_raemian.jpg', cap:'서울 아파트 단지(해당 단지 사진 아님). 사진=한경DB', real:false},
    a9bkhXM:{src:'img/d_habio.jpg', cap:'서울 아파트 단지(해당 단지 사진 아님). 사진=한경DB', real:false}
  };
  const FACE = {'김OO':'img/broker_kim.jpg','이OO':'img/broker_lee_els.jpg','박OO':'img/broker_park.jpg','최OO':'img/broker_choi.jpg','정OO':'img/broker_jung.jpg',
    '한OO':'img/broker_han.jpg','윤OO':'img/broker_yoon.jpg','이OO2':'img/broker_lee_garak.jpg','서OO':'img/broker_seo.jpg','박OO2':'img/broker_park2.jpg'};

  // 보도 후 추적(10/20 수정안) — 속보로 낸 거래를 국토부 자료와 매일 대조, 해제되면 정정
  const POSTCHECK = [
    {date:'10.11', title:"헬리오시티 33평 30억대 재진입 [거래 속보]", status:'pending', note:'계약서 확인 후 속보 · 신고 기한 11.10 · 매일 국토부 자료 대조'},
    {date:'10.06', title:"가락쌍용1차 24평 19억3500만원 거래", status:'ok', note:'10.07 국토부 신고 일치(18층 19억 3,500)'},
    {date:'09.18', title:"잠실동 국평 신고가 거래 [거래 속보] (예시)", status:'cancel', note:'10.02 계약 해제 신고 확인 → 10.03 정정 기사·원기사 정정 문구'}
  ];
  // 집코노미 파트너스(스탠다드) — 단지 독점 없이 중개업소 전문 페이지·매물·제보·검색 성과 리포트 이용. 단지파트너(프리미엄)는 DANJI[].master
  const PARTNERS = [
    {key:'김OO', name:'김OO', office:'송파헬리오OO공인중개사', slug:'songpa-helio-oo', tier:'premium', danji:['헬리오시티'], area:'송파구 가락동', since:'2014', deals:328, rating:4.9, reports:12, cited:2},
    {key:'윤OO', name:'윤OO', office:'가락OO부동산', slug:'garak-oo', tier:'standard', danji:['가락쌍용1차','가락2차쌍용'], area:'송파구 가락동', since:'2009', deals:214, rating:4.7, reports:9, cited:1},
    {key:'이OO2', name:'이OO', office:'가락시장OO부동산', slug:'garakmarket-oo', tier:'standard', danji:['헬리오시티'], area:'송파구 가락동', since:'2018', deals:96, rating:4.6, reports:5, cited:1},
    {key:'서OO', name:'서OO', office:'래미안파크OO공인중개사', slug:'raemian-park-oo', tier:'standard', danji:['래미안파크팰리스'], area:'송파구 가락동', since:'2011', deals:143, rating:4.8, reports:4, cited:0}
  ];
  // 매물정보 개편 화면용 예시 매물(가격은 KB 시세·호가 범위 안에서 만든 예시)
  const LISTINGS = [
    {danji:'a1zUerj', py:32, floor:'중층', dir:'남향', price:28.7, type:'매매', who:'김OO', verified:true, days:2},
    {danji:'a1zUerj', py:33, floor:'고층', dir:'남동향', price:30.5, type:'매매', who:'김OO', verified:true, days:5},
    {danji:'a1zUerj', py:33, floor:'저층', dir:'남향', price:13.5, type:'전세', who:'이OO2', verified:true, days:1},
    {danji:'a1zUerj', py:25, floor:'중층', dir:'남향', price:26.4, type:'매매', who:'이OO2', verified:false, days:9},
    {danji:'a9jHYxD', py:24, floor:'고층', dir:'남향', price:19.6, type:'매매', who:'윤OO', verified:true, days:3},
    {danji:'a9twetl', py:32, floor:'중층', dir:'남서향', price:24.2, type:'매매', who:'서OO', verified:true, days:4}
  ];

  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

  // H-AI 스코어 산식(안): 생활 35 + 시세흐름 25 + 호재 15 + 거래활력 15 + 전세안정 10 (모두 과거·현재 실측값)
  function axes(d) {
    if (!d.ms) return null;
    const jr = d.kbJ / d.kbM;
    return {
      live: d.live,
      trend: Math.round(clamp(((d.ms[d.ms.length - 1] / d.ms[0] - 1) * 100 + 10) / 50 * 100)),   // 2년 시세 변동
      goodnews: d.gnG * 20,
      activity: Math.round(clamp(d.trades3m / d.hh * 100 * 150)),
      stable: Math.round(clamp(100 - Math.abs(jr - 0.5) * 250))
    };
  }
  // 10/20 수정안: 이용자가 항목별 비중을 조절하는 '나만의 단지 점수' — 기본값은 아래 비중, 광고 계약 여부는 어떤 항목에도 들어가지 않는다
  const DEFAULT_W = {live:35, trend:25, goodnews:15, activity:15, stable:10};
  function scoreWith(d, w) {
    const a = d.axes || axes(d); if (!a) return null;
    const sum = Object.values(w).reduce((x, y) => x + y, 0) || 1;
    return Math.round(Object.keys(w).reduce((s, k) => s + a[k] * w[k], 0) / sum);
  }
  function score(d) { return scoreWith(d, DEFAULT_W); }
  DANJI.forEach(d => {
    d.photo = PHOTO[d.id].src; d.photoCap = PHOTO[d.id].cap; d.photoReal = PHOTO[d.id].real;
    d.axes = axes(d); d.score = score(d);
    d.jr = d.kbM ? Math.round(d.kbJ / d.kbM * 100) : null;
    if (d.ms) {
      const n = d.ms.length;
      d.chg1y = +((d.ms[n - 1] / d.ms[n - 13] - 1) * 100).toFixed(1);
      d.chg2y = +((d.ms[n - 1] / d.ms[0] - 1) * 100).toFixed(1);
    }
  });

  const won = v => v == null ? '-' : (Math.round(v * 100) / 100) + '억';
  const manwon = m => { const e = Math.floor(m / 10000), r = m % 10000; return e + '억' + (r ? ' ' + r.toLocaleString() : ''); };
  const scoreClass = s => s == null ? 'sx' : s >= 90 ? 's90' : s >= 80 ? 's80' : s >= 70 ? 's70' : s >= 60 ? 's60' : 'sx';
  const byId = id => DANJI.find(d => d.id === id);

  return { DEFAULT_W, scoreWith, POSTCHECK, PARTNERS, LISTINGS, PHOTO, FACE, MONTHS, DANJI, HELIO_TRADES, HELIO_WIKI, REPORTS, DONG_REPORTS, won, manwon, scoreClass, byId, clamp };
})();
