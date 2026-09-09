/* ═══════════════════════════════════════════════════════════════════════
   A4 — 태어난 시각 추정: 갈림 실측 · 문항 수 모의실행 스크립트
   [2026-09-09] docs/reports/2026-09-09-A4-갈림실측.md 의 숫자를 만든 코드다.

   [쓰는 법] 앱을 로컬로 띄우고(http://127.0.0.1:8934/index.html) 브라우저
   콘솔에 이 파일을 통째로 붙여 넣은 뒤:
       await A4.run(300, 20260909);   // 표본 300명, 시드 20260909
       A4.report();                   // 표를 콘솔에 찍는다

   [주의] 앱 전역(personReading·sajuOf·hourToSijin)을 그대로 부른다 —
   계산을 여기에 옮겨 적지 않았다. 앱이 바뀌면 결과도 따라 바뀐다.
   [주의] 오래 연 페이지에서 반복해 돌리면 중간에 멈춘다(A1·A3에서 겪음).
   그때는 **페이지를 새로 열고** 다시 붙여 넣으면 된다.
   ═══════════════════════════════════════════════════════════════════════ */
const A4 = (function(){

  /* 12칸(시진) 대표 시각. hourToSijin(h)=floor(((h+1)%24)/2) 와 1:1로 맞다 —
     시진 0(자)만 23시·0시 둘을 품는데, 대표로 0시를 쓴다.
     ★ 자시는 이 둘이 서로 다른 결과를 낸다(진태양시로 일주가 갈린다, 보고서 2-6절). */
  const SIJIN_HOUR = [0,2,4,6,8,10,12,14,16,18,20,22];

  /* 다섯 구간 ↔ 12칸 대응. 시진 단위로 겹침 없이 잘랐다.
     자시(23-01)를 "밤"에 넣은 것은 판단이다 — 23시 시작이라 밤이 자연스럽지만
     "새벽 0시"로 말하는 사람도 있다. 점수제라 어긋나도 후보가 지워지지 않는다. */
  const BAND = {
    '새벽':[1,2],      // 축 01-03, 인 03-05
    '아침':[3,4,5],    // 묘 05-07, 진 07-09, 사 09-11
    '낮'  :[6,7,8],    // 오 11-13, 미 13-15, 신 15-17
    '저녁':[9,10],     // 유 17-19, 술 19-21
    '밤'  :[11,0]      // 해 21-23, 자 23-01
  };

  const NAMES = ['어떤 사람인가','관심이 향하는 곳','기운의 세기','넘치는 것과 비어 있는 것',
                 '어울리는 일','돈 스타일','관계 스타일','힘이 되는 기운'];

  /* 재현 가능한 난수(선형 합동법) — 같은 시드면 같은 표본·같은 모의실행이 나온다 */
  function rng(seed){ let s=seed>>>0; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

  function mkSample(n, seed){
    const rnd = rng(seed), out = [];
    for(let i=0;i<n;i++){
      const y = 1950 + Math.floor(rnd()*61);          // 1950~2010
      const m = 1 + Math.floor(rnd()*12);
      const dim = new Date(Date.UTC(y,m,0)).getUTCDate();
      const d = 1 + Math.floor(rnd()*dim);
      out.push({y, m, d, sex:(i%2===0?'M':'F'), lon:126.9784});   // 남녀 절반씩, 서울 경도
    }
    return out;
  }

  let ALL = null, SAMPLE = null, STAT = null;

  /* 표본마다 12칸 × 8항목 문장을 전부 뽑는다. ALL[i][k][j] */
  async function run(n=300, seed=20260909){
    SAMPLE = mkSample(n, seed);
    ALL = [];
    const varyCnt=new Array(8).fill(0), branchSum=new Array(8).fill(0), branchMax=new Array(8).fill(0);
    let sexEffect = 0;
    for(let i=0;i<SAMPLE.length;i++){
      const p = SAMPLE[i], per = [];
      for(let k=0;k<12;k++){
        const rd = personReading({birth:{y:p.y,m:p.m,d:p.d,hour:SIJIN_HOUR[k],min:0,lon:p.lon}});
        per.push(rd.map(o=>o.t||o.html));
      }
      /* 성별이 계산에 들어가는지 확인 — 코드상 안 들어가지만 실측으로 못 박는다 */
      if(i<20){
        const b={y:p.y,m:p.m,d:p.d,hour:SIJIN_HOUR[0],min:0,lon:p.lon};
        const a1=personReading({birth:Object.assign({},b,{sex:'M'})}).map(o=>o.t||o.html).join('|');
        const a2=personReading({birth:Object.assign({},b,{sex:'F'})}).map(o=>o.t||o.html).join('|');
        if(a1!==a2) sexEffect++;
      }
      for(let j=0;j<8;j++){
        const size = new Set(per.map(r=>r[j])).size;
        branchSum[j]+=size; if(size>branchMax[j]) branchMax[j]=size; if(size>1) varyCnt[j]++;
      }
      ALL.push(per);
      if(i%40===0) await new Promise(r=>setTimeout(r,0));   // 렌더러 양보
    }
    STAT = {
      항목:NAMES,
      갈림률: varyCnt.map(v=>+(100*v/n).toFixed(1)),
      갈래평균: branchSum.map(v=>+(v/n).toFixed(2)),
      갈래최대: branchMax,
      성별영향_20명중: sexEffect
    };
    return STAT;
  }

  /* ③ 첫 질문(다섯 구간)이 실제로 얼마나 줄이는지 */
  function bandStat(){
    const rows=[];
    for(const [name, idxs] of Object.entries(BAND)){
      let sum=0;
      for(let i=0;i<ALL.length;i++) sum += new Set(idxs.map(k=>ALL[i][k].join('|'))).size;
      rows.push({구간:name, 남는칸수:idxs.length, 남은후보_평균갈래:+(sum/ALL.length).toFixed(2)});
    }
    let all12=0; for(let i=0;i<ALL.length;i++) all12 += new Set(ALL[i].map(r=>r.join('|'))).size;
    return {대응표:BAND, 구간별:rows, 전체12칸_평균갈래:+(all12/ALL.length).toFixed(2)};
  }

  /* ④⑤ 모의실행.
     opt = {firstQ(첫 질문 쓸지), W(첫 질문 가점), errRate(오답률), gap(조기 종료 격차), seed}
     [규칙] 점수만 더한다 — 후보를 지우지 않는다. 진짜 시각은 절대 사라지지 않는다.
     [경쟁 후보 C] 최고점과 1점 차 이내(= 한 문항으로 뒤집힐 수 있는 범위). 질문은 이 안에서 고른다.
     [보기 두 개] C 안에서 그룹이 큰 순으로 둘. 진짜 시각의 답이 그 둘에 없으면
       "잘 모르겠어요"로 넘어간다(점수 없음) — 실제 화면과 같게, 정답을 미리 넣어 주지 않는다. */
  function sim(opt){
    const rnd = rng(opt.seed||777);
    const bandOf = k => { for(const [n,idxs] of Object.entries(BAND)) if(idxs.includes(k)) return n; return null; };
    const dist={}; let hitUnique=0, hitTied=0, miss=0, qSum=0, dunno=0;
    for(let i=0;i<ALL.length;i++){
      const per = ALL[i];
      const t = Math.floor(rnd()*12);                 // 진짜 시각(사용자는 모른다고 가정)
      const score = new Array(12).fill(0);
      if(opt.firstQ) BAND[bandOf(t)].forEach(k=>score[k]+=opt.W);
      const used = new Set(); let q=0;
      for(q=0;q<6;q++){
        const sorted=[...score].sort((a,b)=>b-a);
        if(opt.gap && sorted[0]-sorted[1] >= opt.gap) break;
        const mx=sorted[0], C=[];
        for(let k=0;k<12;k++) if(score[k]>=mx-1) C.push(k);
        if(C.length<=1) break;
        let anyDiff=false;
        for(let j=0;j<8;j++) if(new Set(C.map(k=>per[k][j])).size>1){anyDiff=true;break;}
        if(!anyDiff) break;                            // 남은 후보가 전부 같은 말을 함
        let best=-1,bestN=1;
        for(let j=0;j<8;j++){ if(used.has(j))continue;
          const s=new Set(C.map(k=>per[k][j])).size; if(s>bestN){bestN=s;best=j;} }
        if(best<0) break;
        used.add(best);
        const groups={}; C.forEach(k=>{const a=per[k][best];(groups[a]=groups[a]||[]).push(k);});
        const sg=Object.entries(groups).sort((x,y)=>y[1].length-x[1].length);
        if(!sg[1]) continue;
        const truth=per[t][best]; let picked=null;
        if(truth===sg[0][0]||truth===sg[1][0]){
          picked=truth;
          if(opt.errRate && rnd()<opt.errRate) picked=(truth===sg[0][0]?sg[1][0]:sg[0][0]);
        } else { dunno++; continue; }
        for(let k=0;k<12;k++) if(per[k][best]===picked) score[k]+=1;
      }
      qSum+=q; dist[q]=(dist[q]||0)+1;
      const mx=Math.max(...score), top=[];
      for(let k=0;k<12;k++) if(score[k]===mx) top.push(k);
      if(top.length===1 && top[0]===t) hitUnique++;
      else if(top.includes(t)) hitTied++;
      else miss++;
    }
    const n=ALL.length;
    return {조건:opt,
      '유일1위가_진짜%':+(100*hitUnique/n).toFixed(1),
      '1위그룹에_포함%':+(100*(hitUnique+hitTied)/n).toFixed(1),
      '빗나감%':+(100*miss/n).toFixed(1),
      평균문항수:+(qSum/n).toFixed(2), 문항수분포:dist, 잘모르겠어요_횟수:dunno};
  }

  /* 자시 칸이 다른 칸과 근본적으로 다른지 확인(보고서 2-6절의 근거) */
  function jasiCheck(){
    let 자시단독=0, 그밖=0, 안갈림=0, 내부갈림=0, diffSum=0;
    for(let i=0;i<ALL.length;i++){
      const col=ALL[i].map(r=>r[0]);                    // ① 어떤 사람인가(일간만 쓴다)
      if(new Set(col).size===1){ 안갈림++; }
      else if(new Set(col.slice(1)).size===1 && col[0]!==col[1]) 자시단독++;
      else 그밖++;
    }
    for(let i=0;i<Math.min(100,SAMPLE.length);i++){
      const p=SAMPLE[i];
      const a=personReading({birth:{y:p.y,m:p.m,d:p.d,hour:23,min:0,lon:p.lon}}).map(o=>o.t||o.html);
      const b=personReading({birth:{y:p.y,m:p.m,d:p.d,hour:0, min:0,lon:p.lon}}).map(o=>o.t||o.html);
      let d=0; for(let j=0;j<8;j++) if(a[j]!==b[j]) d++;
      if(d>0) 내부갈림++; diffSum+=d;
    }
    return {'①이_갈리는_이유_자시단독':자시단독, 그밖:그밖, 안갈림:안갈림,
      '자시_23시vs0시가_다른_사람(100명중)':내부갈림,
      '그때_다른_항목수_평균(8중)':+(diffSum/Math.min(100,SAMPLE.length)).toFixed(2)};
  }

  function report(){
    console.log('① ② 항목별 갈림률·갈래 수'); console.table(
      NAMES.map((nm,j)=>({항목:nm, '갈림률%':STAT.갈림률[j], 갈래평균:STAT.갈래평균[j], 갈래최대:STAT.갈래최대[j]})));
    console.log('성별이 결과를 바꾼 사람(20명 중):', STAT.성별영향_20명중);
    console.log('③ 첫 질문 효과'); console.table(bandStat().구간별);
    console.log('자시 확인'); console.log(jasiCheck());
    console.log('④⑤ 모의실행'); console.table(
      [[false,0],[false,0.2],[true,0],[true,0.2]].map(([f,e])=>{
        const r=sim({firstQ:f,W:2,errRate:e,seed:777});
        return {첫질문:f?'있음(W=2)':'없음', 오답률:(e*100)+'%',
          '유일1위%':r['유일1위가_진짜%'], '1위그룹포함%':r['1위그룹에_포함%'],
          '빗나감%':r['빗나감%'], 평균문항:r.평균문항수};
      }));
  }

  return {run, report, sim, bandStat, jasiCheck, mkSample,
          SIJIN_HOUR, BAND, NAMES, get ALL(){return ALL;}, get STAT(){return STAT;}};
})();
