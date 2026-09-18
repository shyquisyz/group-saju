// [2026-09-18 U5] 초상 효과 원형 — 사용자 확정 시안(계절 막 20%, 10시·5시만) 코드. 앱은 아직 읽지 않는다.
// 계절 막: 12·1·2월생 = winter, 7·8월생 = summer, 나머지 없음. 진하기 KK=.20(가장 바깥 불투명도).
// 1시–중앙–7시 방향은 지우고 10시·5시 가장자리만 남김(keep = |dot(화면방향, (-.866,.5))|).
// 물 반사: 바다 영역(B>R+30)만 roughness .16 + 하늘 환경맵 층을 한 겹.
// 계절 햇빛: LIGHT 표의 색·세기·방향 + 같은 계절색 역광.
let KK=.20;
// ── 투명 막(비눗방울): 가운데는 완전히 투명, 가장자리에만 얇은 박막 무지개 + 반짝임. 계절은 막의 색조로 ──
// 박막 간섭 색: 두께(d)에 따라 R·G·B 위상이 다르게 도는 코사인 팔레트
const BUB={none:{tint:[1,1,1],mix:0},winter:{tint:[.72,.9,1.0],mix:1},spring:{tint:[1.0,.93,.45],mix:.75},summer:{tint:[1.0,.38,.2],mix:1},autumn:{tint:[1.0,.6,.2],mix:.8}};
function bubbleMesh(season,seed){const B=BUB[season||'none'];
  return new THREE.Mesh(new THREE.SphereGeometry(1.22,160,120),new THREE.ShaderMaterial({
    uniforms:{tint:{value:new THREE.Vector3(...B.tint)},mixv:{value:B.mix},sd:{value:seed||0},kk:{value:KK}},
    vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vP=position;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`uniform vec3 tint;uniform float mixv;uniform float sd;uniform float kk;varying vec3 vN;varying vec3 vV;varying vec3 vP;
      void main(){float c=abs(dot(vN,vV));
        // 넓게 퍼지는 옅은 막: 가운데 0 → 가장자리로 갈수록 서서히 (선으로 몰리지 않게 완만한 곡선)
        float fr=pow(1.-c,.85)*kk;
        vec3 col=mix(vec3(1.),tint,mixv);
        vec3 r=reflect(-vV,vN);float s1=pow(max(dot(r,normalize(vec3(-.45,.6,.65))),0.),80.)*.35;
        // 바깥 경계는 지오메트리 실루엣에서 그대로 끊긴다 (흐리게 사라지는 처리 없음)
        vec2 sd2=normalize(vN.xy+1e-5);float keep=smoothstep(.15,.85,abs(dot(sd2,vec2(-.866,.5))));fr*=keep;s1*=keep;float A=fr+s1;gl_FragColor=vec4(mix(col,vec3(1.),s1/max(A,.001)),A);}`,
    transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.FrontSide}));}



const LIGHT={winter:[0xd6e4ff,1.15,[5,6,8]],summer:[0xffb08a,1.5,[4,8,7]]};
const SC={winter:0xd8e8ff,spring:0xffe95a,summer:0xff3a2a,autumn:0xff8c1a};
let SEASON='',WATER=true,STYLE='',SEED=0,KK=.45;
function addTemp(ps){
  if(STYLE.includes('bubble'))ps.add(bubbleMesh(SEASON,SEED));
  if(SEASON&&STYLE.includes('light')){ps.traverse(o=>{if(o.isDirectionalLight&&o.intensity>1){const L=LIGHT[SEASON];o.color.set(L[0]);o.intensity=L[1];o.position.set(...L[2]);}});
    const back=new THREE.DirectionalLight(SC[SEASON],2.2);back.position.set(-5,2,-4);ps.add(back);}
}

function skyEnv(){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#dfefff');g.addColorStop(.45,'#9cc4ef');g.addColorStop(.52,'#3b5d86');g.addColorStop(1,'#101a2a');x.fillStyle=g;x.fillRect(0,0,1024,512);
  x.filter='blur(20px)';x.fillStyle='rgba(255,255,255,.9)';[[220,110,160,70],[640,80,120,60],[860,160,90,40]].forEach(([a,b,w,h])=>x.fillRect(a,b,w,h));x.filter='none';
  const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.encoding=THREE.sRGBEncoding;const pm=new THREE.PMREMGenerator(renderer);const e=pm.fromEquirectangular(t).texture;pm.dispose();return e;}
const SKY=skyEnv();
async function addWater(ps,G,m,key,map){if(!WATER)return;
  const im=await loadImg('map/'+key+'.jpg?b='+Date.now());const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
  const d=x.getImageData(0,0,c.width,c.height);const w=x.createImageData(c.width,c.height);
  for(let i=0;i<d.data.length;i+=4){const R=d.data[i],Gg=d.data[i+1],B=d.data[i+2];const v=(B>R+30&&B>=Gg-10)?255:0;w.data[i]=w.data[i+1]=w.data[i+2]=v;w.data[i+3]=255;}
  const a=document.createElement('canvas');a.width=c.width;a.height=c.height;a.getContext('2d').putImageData(w,0,0);
  const b=document.createElement('canvas');b.width=c.width;b.height=c.height;const bx=b.getContext('2d');bx.filter='blur(1.5px)';bx.drawImage(a,0,0);
  const shell=new THREE.Mesh(G,new THREE.MeshStandardMaterial({map,metalness:0,roughness:.16,envMap:SKY,envMapIntensity:1.0,alphaMap:new THREE.CanvasTexture(b),transparent:true,alphaTest:.5}));
  shell.scale.setScalar(1.001);shell.rotation.copy(m.rotation);ps.add(shell);}
