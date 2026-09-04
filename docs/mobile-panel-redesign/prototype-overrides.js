/* ═══ 모바일 패널 개편 — 시안 오버레이 [2026-09-04] ═══
   저장소 파일을 고치지 않고 브라우저에서만 덮어씌워 실제 렌더로 시안을 잡기 위한 것.
   구현 코드가 아니다 — 붙여넣기용 뼈대이지 그대로 옮기면 안 된다(아래 ★ 참고).

   쓰는 법
     1) 앱을 로컬 서버로 연다(포트는 CLAUDE.md 「검증 규칙」 참고)
     2) 콘솔에 이 파일 전체를 붙여넣는다
     3) 화면 왼쪽 ⤢ 로 확대 모드, 오른쪽 ✕ 로 닫기
        T1(태그바를 패널 위로)을 보려면  document.body.classList.add('px-t1')

   ★ 실측 함정 — 탭이 백그라운드면 CSS 전환이 멈춘 채 !important 까지 덮어쓴다.
     #tagbar 에 transition:bottom 을 걸고 잰 값이 계속 bottom:0 으로 나왔다.
     원인은 CSS 규칙이 아니라 **멈춘 CSSTransition**이었다(getAnimations()로 확인).
     갈무리 전에  el.getAnimations().forEach(a=>a.cancel())  로 지우고 쟀다.
*/
(function(){
  const D=document, R=D.documentElement, B=D.body, P=D.getElementById('panel');
  D.getElementById('px-style')&&D.getElementById('px-style').remove();
  const st=D.createElement('style'); st.id='px-style'; st.textContent=`
  /* ── R1. 제목이 스크롤을 따라다니지 않는다 — 본문과 함께 올라간다 ── */
  #phead{position:static !important;background:none !important;
    margin:0 0 10px !important;padding:0 0 10px !important;
    border-bottom:1px solid rgba(255,255,255,.10) !important}
  #pheadname{font-size:19px !important;line-height:1.3 !important}
  #panelclose{display:none !important}            /* 안쪽 ✕ 폐지 — 바깥으로 나간다(R2) */
  /* 드래그 손잡이는 남기되 얇게 — 여닫는 손짓이 아직 여기 붙어 있다 */
  #panel .draghandle{padding:9px 20px 3px !important;margin:-16px -20px 0 !important}

  /* ── 패널 높이 ── 바깥 버튼·태그바가 같은 값을 본다(--panel-h) ── */
  #panel{max-height:var(--panel-h,52vh) !important}
  body.px-full #panel{max-height:var(--vvh,100vh) !important;height:var(--vvh,100vh) !important;
    border-radius:0 !important;border-top:0 !important;
    padding-top:60px !important}                  /* 위 버튼 줄(40+10+10)만큼 비운다 — T3 */
  body.px-full #panel .draghandle{display:none !important}   /* 전체 화면이면 끌어 올릴 곳이 없다 */
  body.px-full #demobadge,body.px-full #demoback{display:none !important} /* 데모 전용 표식 */

  /* ── R2 · R3. 패널 바깥 상단에 뜨는 한 쌍 ── */
  .pxbtn{position:fixed;z-index:9;width:40px;height:40px;border-radius:99px;
    display:none;place-items:center;padding:0;
    border:1px solid rgba(255,255,255,.18);background:rgba(28,29,44,.92);
    -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
    color:#cfd2e2;font-size:17px;line-height:1;cursor:pointer;font-family:inherit;
    box-shadow:0 4px 18px rgba(0,0,0,.5)}
  .pxbtn::before{content:'';position:absolute;left:50%;top:50%;
    transform:translate(-50%,-50%);width:44px;height:44px}   /* 보이는 알약 40 · 누르는 판 44 */
  .pxbtn:active{opacity:.75}
  body.panel-open .pxbtn{display:grid}
  #px-close{right:12px;bottom:calc(var(--panel-h,52vh) + 10px)}
  #px-full {left:12px; bottom:calc(var(--panel-h,52vh) + 10px)}
  /* 확대 모드에서는 패널이 화면을 다 먹으므로 "패널 바깥"이 "화면 상단"이 된다(T3 답) */
  body.px-full #px-close,body.px-full #px-full{bottom:auto;top:10px}

  /* ── T1. 태그바를 패널 위로 ── */
  body.px-t1.panel-open #tagbar{bottom:var(--panel-h,52vh)}
  body.px-t1.px-full #tagbar{opacity:0;pointer-events:none}
  /* T1을 켜면 버튼 한 쌍은 태그바보다 더 위로 — 실측으로 겹침을 확인하고 넣었다 */
  body.px-t1.panel-open #px-close,body.px-t1.panel-open #px-full{
    bottom:calc(var(--panel-h,52vh) + var(--tagbar-h,52px) + 10px)}
  `;
  D.head.appendChild(st);

  ['px-close','px-full'].forEach(id=>{ const o=D.getElementById(id); o&&o.remove(); });
  const mk=(id,label,aria)=>{const b=D.createElement('button');b.id=id;b.className='pxbtn';
    b.type='button';b.textContent=label;b.setAttribute('aria-label',aria);B.appendChild(b);return b;};
  const bClose=mk('px-close','✕','패널 닫기');
  const bFull =mk('px-full','⤢','패널 전체 확대');

  /* --panel-h 를 실제 상태에서 계산해 넘긴다 — syncChromeMetrics 가 --hdr-h/--tagbar-h 를
     넘기는 것과 같은 방식이다. 상수로 박으면 tall(82vh)·확대·인앱 뷰포트에서 어긋난다. */
  function syncH(){
    const vh=parseFloat(getComputedStyle(R).getPropertyValue('--vvh'))||innerHeight;
    const h=B.classList.contains('px-full')?vh
           :Math.round(vh*(P.classList.contains('tall')?0.82:0.52));
    R.style.setProperty('--panel-h', h+'px');
    return h;}
  window.__pxSyncH=syncH; syncH();

  bClose.onclick=()=>{B.classList.remove('px-full');P.classList.remove('open','tall');
    try{deselect()}catch(e){} syncH();};
  bFull.onclick=()=>{B.classList.toggle('px-full');
    const on=B.classList.contains('px-full');
    bFull.textContent=on?'⤡':'⤢';
    bFull.setAttribute('aria-label',on?'패널 크기 되돌리기':'패널 전체 확대');
    syncH();};
  return 'proto ok';
})()
