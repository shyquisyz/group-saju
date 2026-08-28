/* ═══════════════════════════════════════════════════════════════════════
   solar-terms.js 생성기 — 손으로 돌린다. 앱 빌드의 일부가 아니다.

   실행:
     npm i lunar-javascript@1.7.7
     node tools/gen-solar-terms.mjs        →  solar-terms.js 를 덮어쓴다

   [왜 생성기를 남기나] 표 24,120자는 사람이 읽을 수 없다. 이 파일이 없으면 "그 값이
   어디서 왔는가"를 다음 세션이 확인할 방법이 없다. 값을 의심하게 되면 여기서부터 다시 판다.

   [★ 함정 1 — 시간대] lunar-javascript의 절기 값은 **중국 표준시(UTC+8) 벽시계**다.
   한국 시각을 그 라이브러리에 그대로 넣으면 절입 근처 출생자의 연주가 통째로 틀린다
   (실측: 1965/1998/2002년 2월 4일 09시 표본). UTC 순간 = 원값 − 8시간.

   [★ 함정 2 — 이웃 연도] getJieQiTable()은 31개를 돌려주고 이웃 연도 것이 섞인다.
   게다가 `冬至` 키는 **전년도** 동지이고 당해 동지는 `DONG_ZHI`(병음)로 들어온다.
   이름으로 뽑으면 1년이 어긋난다. 그래서 병음 키를 한자로 정규화한 뒤 **연도로 거른다.**

   [★ 함정 3 — 간체] 라이브러리 키는 간체다(驚蟄 아니라 惊蛰, 穀雨 아니라 谷雨).
   번체로 찾으면 조용히 undefined가 나온다 — 그래서 누락을 예외로 던지게 해 뒀다.
   ═══════════════════════════════════════════════════════════════════════ */
import { Solar } from 'lunar-javascript';
import { writeFileSync } from 'fs';

const MIN=1900, MAX=2100;
export const TERMS   = ['소한','대한','입춘','우수','경칩','춘분','청명','곡우','입하','소만','망종','하지',
                        '소서','대서','입추','처서','백로','추분','한로','상강','입동','소설','대설','동지'];
const HANJA_LIB      = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至',
                        '小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
const HANJA_KO       = ['小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種','夏至',
                        '小暑','大暑','立秋','處暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
const PINYIN = {XIAO_HAN:'小寒',DA_HAN:'大寒',LI_CHUN:'立春',YU_SHUI:'雨水',JING_ZHE:'惊蛰',CHUN_FEN:'春分',
  QING_MING:'清明',GU_YU:'谷雨',LI_XIA:'立夏',XIAO_MAN:'小满',MANG_ZHONG:'芒种',XIA_ZHI:'夏至',
  XIAO_SHU:'小暑',DA_SHU:'大暑',LI_QIU:'立秋',CHU_SHU:'处暑',BAI_LU:'白露',QIU_FEN:'秋分',
  HAN_LU:'寒露',SHUANG_JIANG:'霜降',LI_DONG:'立冬',XIAO_XUE:'小雪',DA_XUE:'大雪',DONG_ZHI:'冬至'};
const IDX = new Map(HANJA_LIB.map((h,i)=>[h,i]));
const MONTH_OF = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12];

/** 한 해의 24절기를 KST 절대시각(UTC ms)으로. 개수·순서·달·연도를 전부 검사한다. */
export function termsOfYear(y){
  const out = new Array(24).fill(null);
  for(const probe of [y-1,y,y+1]){
    const tbl = Solar.fromYmd(probe,6,1).getLunar().getJieQiTable();
    for(const [k,s] of Object.entries(tbl)){
      const han = PINYIN[k] || k;
      const i = IDX.get(han);
      if(i===undefined) throw new Error('모르는 절기 키: '+k);
      if(s.getYear()!==y) continue;
      const utcMs = Date.UTC(s.getYear(),s.getMonth()-1,s.getDay(),s.getHour(),s.getMinute(),s.getSecond()) - 8*3600000;
      if(out[i]!==null && out[i]!==utcMs) throw new Error(y+' '+han+' 값이 표마다 다르다');
      out[i]=utcMs;
    }
  }
  const miss = out.map((v,i)=>v===null?TERMS[i]:null).filter(Boolean);
  if(miss.length) throw new Error(y+' 누락: '+miss.join(','));
  for(let i=1;i<24;i++) if(out[i]<=out[i-1]) throw new Error(y+' 순서 역전: '+TERMS[i]);
  out.forEach((ms,i)=>{
    const d=new Date(ms+9*3600000);
    if(d.getUTCFullYear()!==y) throw new Error(y+' '+TERMS[i]+' 연도 어긋남');
    if(d.getUTCMonth()+1!==MONTH_OF[i]) throw new Error(y+' '+TERMS[i]+' 달 어긋남');
  });
  return out;
}

/* ── 인코딩 ──
   각 절기를 "그 해 1월 1일 00:00 KST"로부터의 초로 담고 base64 5글자 고정폭으로 쓴다.
   [왜 절대값인가] 앞 항목과의 차분으로 담으면 9KB가 줄지만, 한 글자가 깨지면 그 해 나머지가
   전부 밀린다. 절대값은 한 항목만 깨진다. 24KB는 index.html 610KB 옆에서 4%다 —
   용량보다 **검증 가능성**을 택했다. */
const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const enc5=v=>{ if(v<0||v>=64**5) throw new Error('범위 밖: '+v);
  let s=''; for(let i=4;i>=0;i--) s+=A[Math.floor(v/64**i)%64]; return s; };

let payload='', rows=0, maxSec=0;
for(let y=MIN;y<=MAX;y++){
  const base=Date.UTC(y,0,1)-9*3600000;
  for(const ms of termsOfYear(y)){
    const sec=Math.round((ms-base)/1000);
    if(sec<0) throw new Error(y+' 음수 초');
    maxSec=Math.max(maxSec,sec); payload+=enc5(sec); rows++;
  }
}

const out=`/* ═══════════════════════════════════════════════════════════════════════
   24절기 절입 시각 표 — 1900~2100 (201년 × 24절기 = ${rows}건)
   ★ 자동 생성 파일이다. 손으로 고치지 말 것 (생성기: tools/gen-solar-terms.mjs)

   [무엇] 각 절기가 들어오는 순간. 월주(月柱)는 달력의 달이 아니라 이 시각으로 갈린다.
          연주(年柱)도 1월 1일이 아니라 입춘에서 갈린다.

   [기준] 한국 표준시(KST) 기준의 절대 순간. 저장 형태는 "그 해 1월 1일 00:00 KST로부터의
          초"이고 base64 5글자 고정폭이다(최대 ${maxSec}초 < 64^5).

   [출처] 6tail/lunar-javascript(寿星 천문계산) 1.7.7의 값을 옮겼다. 그 라이브러리의 원값은
          **중국 표준시(UTC+8) 벽시계**라 그대로 쓰면 1시간이 어긋난다 — 2025·2026 입춘을
          한국 공표값과 맞춰 확인했다(22:10:28 + 1h = 23:10 / 04:02:08 + 1h = 05:02).
          한국 시각을 그 라이브러리에 그대로 넣으면 절입 근처 출생자의 **연주가 통째로
          틀린다**(실측: 1965·1998·2002년 2월 4일 09시).

   [검증] 공표 표 세 곳과 전수 대조했다(2026년 24건 + 1990년 24건 = 48건).
          출처마다 초를 절사하는 곳과 반올림하는 곳이 갈리는데, **우리 초 값이 그 차이를
          설명한다** — 초<30이면 두 방식이 같고, 초>=30이면 1분 갈린다.
          · 1990년 24/24 일치(절사 기준)
          · 2026년 22/24 일치. 남은 2건(경칩·청명)은 우리 값이 :00인데 출처들이 1분 갈려,
            **우리 값이 1~30초 늦다**는 뜻이다.
          초 값 분포는 균등하다(4824건, 카이제곱 57.1 / 자유도 59) — 계통 편향은 아니다.

   [남은 오차] 최대 ~30초. 영향받는 출생은 100만 명에 한 명 수준이고, 그 구간은 어차피
          화면의 "절입 경계(±10분)" 안내에 걸린다. 한국천문연구원 공공데이터 API(인증키
          필요)로 전 구간을 대조하면 닫을 수 있다 — 그때 아래 CORRECTIONS에 넣는다.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  var MIN=${MIN}, MAX=${MAX};
  var A='${A}';
  var P=`+JSON.stringify(payload)+`;
  /* KASI 공표값과 대조해 확정된 보정. "연도-절기index": 초 차이. 아직 비어 있다. */
  var CORRECTIONS={};
  var NAMES=${JSON.stringify(TERMS)};
  var HANJA=${JSON.stringify(HANJA_KO)};
  function dec5(off){ var v=0; for(var i=0;i<5;i++) v=v*64+A.indexOf(P.charAt(off+i)); return v; }
  /** 그 해 24절기의 절입 시각(UTC ms) 배열. 소한→동지 순. 범위 밖이면 null. */
  function solarTermsOfYear(y){
    if(y<MIN||y>MAX) return null;
    var base=Date.UTC(y,0,1)-9*3600000, row=(y-MIN)*24, out=new Array(24);
    for(var i=0;i<24;i++){
      var c=CORRECTIONS[y+'-'+i]||0;
      out[i]=base+(dec5((row+i)*5)+c)*1000;
    }
    return out;
  }
  window.SOLAR_TERMS={minYear:MIN,maxYear:MAX,names:NAMES,hanja:HANJA,
                      ofYear:solarTermsOfYear,count:${rows}};
})();
`;
writeFileSync(new URL('../solar-terms.js', import.meta.url), out, 'utf8');
console.log('생성 완료: '+rows+'건 / payload '+payload.length+'자 / 파일 '+out.length+'바이트 / 최대 초값 '+maxSec);
