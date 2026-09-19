/* [2026-09-19] map4·map5 facing.json 생성기 — DIR·W_ME를 바꿔 쓴다.
   map5(조화, 나 50%): 점수 = 환경 최소 비율 + 0.6×min(나 비율, 45%) — 나는 45%까지만 가점, 그 뒤로는 다른 지형이 고르게.
   (0.5×나 그대로는 나 79~88%·환경 0%인 면이 뽑혔고, 0.15는 나 평균 26%·최소 3%로 너무 작았다)
   결과: 나 평균 42% · 50장 중 43장에서 나가 정면 최대 · 환경 최소 평균 16%
   [원래 주석] map4/facing.json 생성기 — 앱(localhost)의 콘솔에서 붙여 넣어 돌린다(THREE·pLoadImg·V2_TUNABLES를 앱에서 빌린다).
   초상 카메라(0,.3,1 방향)에서 보이는 면적을 지도 좌표로 직접 계산한다(렌더 없음).
   가중치 = 카메라를 향한 정도 × 위도 면적 × 빛 받는 정도(.25+.75×램버트, 주광 = PORTRAIT_KEY_POS).
   [왜 빛까지] 측면 조명(2차)에서 오른쪽이 어두워져, 보이기만 하고 그늘에 든 지형(특히 회색 금)이 안 읽혔다(실측).
   점수 = 최소 비율 + 0.1×나 비율. 최고점의 93% 이상을 pass(사람마다 다른 면)로 남긴다(85%는 덜 고른 면이 섞였다).
   분류는 facing.py classify와 같은 문턱. 한계: 이 화풍의 어두운 화산 지각 일부(11~19%)가 금으로 잡힌다. */
(async(DIR='assets/planet-tex/map5/',W_ME=.6)=>{
const EL=['mok','hwa','to','geum','su'];
function classify(r,g,b,geumOn){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=(mx-mn)/(mx+1),lava=(r-b>195)&&(b<24);let c=-1;
 if(b>r+15&&b>=g-10)c=4;if(g>r+5&&g>b+5)c=0;if(r>140&&r>g+30&&b<120&&!lava&&mx>150)c=2;
 const metal=geumOn&&sat<.3&&mx>=55&&(r-b)<50&&c!==4&&c!==0&&!lava;if((mx<95||lava)&&c!==4&&c!==0&&!metal)c=1;if(metal)c=3;return c;}
const keys=[];for(const me of EL){const rest=EL.filter(e=>e!==me);for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){for(let k=j+1;k<4;k++)keys.push(me+'__'+[rest[i],rest[j],rest[k]].join('-'));keys.push(me+'__'+[rest[i],rest[j]].join('-'));}}
const Lw=new THREE.Vector3().fromArray(V2_TUNABLES.PORTRAIT_KEY_POS).normalize();
const out={};const pitches=[-.6,-.45,-.3,-.15,0,.15,.3,.45,.6];
for(const key of keys){const im=await pLoadImg(DIR+key+'.jpg');const W=128,H=64;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.drawImage(im,0,0,W,H);const d=x.getImageData(0,0,W,H).data;
 const [me,env]=key.split('__');const parts=[me,...env.split('-')];const geum=parts.includes('geum');
 const pts=[];for(let py=0;py<H;py++){const v=(py+.5)/H,sv=Math.sin(Math.PI*v);for(let px=0;px<W;px++){const u=(px+.5)/W,i=(py*W+px)*4;pts.push([-Math.cos(2*Math.PI*u)*sv,Math.cos(Math.PI*v),Math.sin(2*Math.PI*u)*sv,sv,classify(d[i],d[i+1],d[i+2],geum)]);}}
 const pi=parts.map(e=>EL.indexOf(e));const cands=[];
 for(let yaw=0;yaw<360;yaw+=10)for(const pitch of pitches){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw*Math.PI/180,.08)).invert();
  const vv=new THREE.Vector3(0,.3,1).normalize().applyQuaternion(q),ll=Lw.clone().applyQuaternion(q);
  const s={};let t=0;for(const p of pts){const dd=p[0]*vv.x+p[1]*vv.y+p[2]*vv.z;if(dd<=0)continue;const lam=Math.max(0,p[0]*ll.x+p[1]*ll.y+p[2]*ll.z);const w=dd*p[3]*(.25+.75*lam);t+=w;s[p[4]]=(s[p[4]]||0)+w;}
  const f=pi.map(e=>(s[e]||0)/t);cands.push({pitch,yaw,f,score:Math.min(...f.slice(1))+W_ME*Math.min(f[0],.45)});}
 /* [map5] 나가 30% 이상 보이는 면이 있으면 그중에서만 고른다 — 없으면 전체에서(불·흙이 나인 지도에서 정면이 숲뿐인 면이 뽑혔다) */
 const pool=cands.filter(c=>c.f[0]>=.3);const C2=pool.length?pool:cands;
 C2.sort((a,b)=>b.score-a.score);const best=C2[0];
 out[key]={pitch:best.pitch,yaw:best.yaw,vis:Object.fromEntries(parts.map((e,i)=>[e,Math.round(best.f[i]*100)])),pass:C2.filter(c=>c.score>=best.score*.93).map(c=>[c.pitch,c.yaw])};}
window.__facingOut=out;console.log(JSON.stringify(out));})();
