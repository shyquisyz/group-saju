/* [2026-09-17 U2] 시안 4판 — 앱이 읽지 않는다. renderPlanet4(개수, 씨앗, 효과콜백). 관계 효과는 proto-biome-planet-v3.js의 REL_FX. 결과: docs/reports/img/2026-09-17-U2/5-*.jpg */
/* 시안 4: 행성 종류 = 가장 많은 오행 하나. 두 번째 오행은 그 세계의 언어로만 살짝(포인트). */
(function(){
  function rng(seed){let s=(seed*9301+49297)>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
  function makeNoise(seed){
    const r=rng(seed),p=new Uint8Array(512),g=[];
    for(let i=0;i<256;i++){p[i]=i;const t=r()*Math.PI*2,z=r()*2-1,q=Math.sqrt(1-z*z);g.push([q*Math.cos(t),q*Math.sin(t),z]);}
    for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}
    for(let i=0;i<256;i++)p[256+i]=p[i];
    const fade=t=>t*t*t*(t*(t*6-15)+10),lerp=(a,b,t)=>a+(b-a)*t;
    const dot=(h,x,y,z)=>{const v=g[h];return v[0]*x+v[1]*y+v[2]*z;};
    function n(x,y,z){const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;
      x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);const u=fade(x),v=fade(y),w=fade(z);
      const A=p[X]+Y,AA=p[A]+Z,AB=p[A+1]+Z,B=p[X+1]+Y,BA=p[B]+Z,BB=p[B+1]+Z;
      return lerp(lerp(lerp(dot(p[AA],x,y,z),dot(p[BA],x-1,y,z),u),lerp(dot(p[AB],x,y-1,z),dot(p[BB],x-1,y-1,z),u),v),
        lerp(lerp(dot(p[AA+1],x,y,z-1),dot(p[BA+1],x-1,y,z-1),u),lerp(dot(p[AB+1],x,y-1,z-1),dot(p[BB+1],x-1,y-1,z-1),u),v),w);}
    return (x,y,z,oct)=>{let s=0,a=.5,f=1,nm=0;for(let i=0;i<(oct||4);i++){s+=a*n(x*f,y*f,z*f);nm+=a;a*=.5;f*=2.07;}return s/nm;};}
  const hex=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const sstep=(e0,e1,x)=>{const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
  const ORDER=['mok','hwa','to','geum','su'];
  window.rankEl=cnt=>ORDER.filter(k=>cnt[k]>0).sort((a,b)=>cnt[b]-cnt[a]||ORDER.indexOf(a)-ORDER.indexOf(b));

  /* 텍스처 한 장을 픽셀 함수로 칠한다(등장방형). f(x,y,z,lat) → [r,g,b] 또는 {c,e}(발광) */
  function paint(TW,TH,f){
    const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;const cx=cv.getContext('2d');const im=cx.createImageData(TW,TH);
    const ev=document.createElement('canvas');ev.width=TW;ev.height=TH;const ex=ev.getContext('2d');const em=ex.createImageData(TW,TH);
    let anyE=false;
    for(let py=0;py<TH;py++){const phi=py/TH*Math.PI,y=Math.cos(phi),sp=Math.sin(phi);
      for(let px=0;px<TW;px++){const th=px/TW*Math.PI*2,x=-Math.cos(th)*sp,z=Math.sin(th)*sp;
        const o=f(x,y,z);const c=o.c||o,e=o.e;const i=(py*TW+px)*4;
        im.data[i]=c[0]*255;im.data[i+1]=c[1]*255;im.data[i+2]=c[2]*255;im.data[i+3]=255;
        if(e){anyE=true;em.data[i]=e[0]*255;em.data[i+1]=e[1]*255;em.data[i+2]=e[2]*255;}em.data[i+3]=255;}}
    cx.putImageData(im,0,0);ex.putImageData(em,0,0);
    return {map:new THREE.CanvasTexture(cv),emap:anyE?new THREE.CanvasTexture(ev):null};}

  const rim=(col,power,alpha,r)=>new THREE.Mesh(new THREE.SphereGeometry(r||1.03,48,32),new THREE.ShaderMaterial({
    uniforms:{c:{value:new THREE.Color(col)}},
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:`uniform vec3 c;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),${power.toFixed(2)});gl_FragColor=vec4(c*f,f*${alpha.toFixed(2)});}`,
    side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));

  /* GLSL 3D 값 노이즈 — 불길 껍질용 */
  const GLSL_NOISE=`
    float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
      return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}`;
  function flameShell(r,seed,hot){
    return new THREE.Mesh(new THREE.SphereGeometry(r,64,48),new THREE.ShaderMaterial({
      uniforms:{sd:{value:seed%17*1.3},hot:{value:hot}},
      vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:GLSL_NOISE+`uniform float sd;uniform float hot;varying vec3 vP;varying vec3 vN;varying vec3 vV;
        void main(){float fr=1.-abs(dot(vN,vV));
          vec3 q=vP*3.2+vec3(sd,sd*.7,0.);q.y-=fbm(vP*1.7+sd)*1.2;
          float n=fbm(q);float flame=smoothstep(.4,.68,n)*pow(fr,.8)*1.3;
          vec3 col=mix(vec3(1.,.28,.05),vec3(1.,.82,.35),smoothstep(.55,.85,n));col=mix(col,vec3(1.,.95,.8),hot*smoothstep(.7,.9,n));
          gl_FragColor=vec4(col*flame*1.6,flame);}`,
      transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));}

  /* 금속은 비칠 것이 있어야 금속으로 보인다 — 성운 환경은 어두워 검은 거울이 됐다(실측). 밝은 스튜디오 환경을 따로 굽는다. */
  let _studio=null;
  function studioEnv(){
    if(_studio)return _studio;
    const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#f4f6fa');g.addColorStop(.45,'#9aa3b4');g.addColorStop(.55,'#4a5060');g.addColorStop(1,'#1a1d26');
    x.fillStyle=g;x.fillRect(0,0,512,256);
    [[110,60,70,'rgba(255,255,255,.95)'],[330,80,50,'rgba(255,240,215,.8)'],[430,150,40,'rgba(190,210,255,.6)']].forEach(([cx,cy,r,col])=>{
      const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=rg;x.fillRect(cx-r,cy-r,r*2,r*2);});
    const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);_studio=pm.fromEquirectangular(t).texture;pm.dispose();t.dispose();return _studio;}
  const WORLDS={
    /* 목 — 숲 행성. 포인트: 수=강·호수 / 토=풀밭 / 화=단풍 숲 / 금=바위 산등성이 */
    mok(seed,acc){
      const H=makeNoise(seed*7+1),D=makeNoise(seed*3+9);
      const lake=acc==='su';
      const {map}=paint(768,384,(x,y,z)=>{const h=H(x*1.4,y*1.4,z*1.4,5),d=D(x*6,y*6,z*6,3);
        let c=mix(hex(0x2f6a2a),hex(0x5c9a3e),sstep(-.3,.35,d));
        if(acc==='to')c=mix(c,hex(0x9fb465),sstep(.05,.2,D(x*2+5,y*2,z*2,3))*.8);
        if(acc==='hwa')c=mix(c,hex(0xc9772e),sstep(.12,.25,D(x*2.5+5,y*2.5,z*2.5,3))*.8);
        if(acc==='geum')c=mix(c,hex(0x9aa39c),sstep(.25,.35,h)*.85);
        if(lake)c=mix(c,hex(0x3a7fa6),sstep(-.18,-.24,h));
        c=mix(c,hex(0x2a4d2a),sstep(.0,.6,-y*y+.2)*0);return c;});
      const g=new THREE.Group();
      const geo=new THREE.SphereGeometry(1,160,120),pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const k=1+Math.max(-.02,H(x*1.4,y*1.4,z*1.4,3))*.03;pos.setXYZ(i,x*k,y*k,z*k);}
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map,roughness:.9})));
      // 숲 덩이: 촘촘히, 같은 초록 계열
      const tr=rng(seed*5+3),pts=[];
      for(let t=0;t<14000&&pts.length<2400;t++){const zz=tr()*2-1,a=tr()*Math.PI*2,q=Math.sqrt(1-zz*zz);const x=q*Math.cos(a),y=zz,z=q*Math.sin(a);
        const h=H(x*1.4,y*1.4,z*1.4,5);if(lake&&h<-.18)continue;if(acc==='geum'&&h>.25)continue;if(D(x*3+11,y*3,z*3,2)<-.08)continue;pts.push([x,y,z]);}
      const inst=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({roughness:.95}),pts.length);
      const cols=(acc==='hwa'?[0x3a7a30,0x5a9a3c,0xc07a30,0xd99a45]:[0x2d6428,0x3f7f32,0x4f9640,0x5fa84a]).map(h=>new THREE.Color(h));
      const m4=new THREE.Matrix4(),qq=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),v=new THREE.Vector3(),sc=new THREE.Vector3();
      pts.forEach((p,k)=>{v.set(p[0],p[1],p[2]);qq.setFromUnitVectors(up,v);const s=.028+tr()*.02;v.multiplyScalar(1+H(p[0]*1.4,p[1]*1.4,p[2]*1.4,3)*.03+s*.35);
        m4.compose(v,qq,sc.set(s,s*.9,s));inst.setMatrixAt(k,m4);inst.setColorAt(k,cols[Math.floor(tr()*cols.length)]);});
      inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;g.add(inst);
      g.add(rim(0xaef0b8,2.4,.7));return g;},
    /* 수 — 바다 행성. 포인트: 목=초록 섬 / 토=모래섬 / 금=빙하 / 화=산호빛 여울 */
    su(seed,acc){
      const H=makeNoise(seed*7+1),D=makeNoise(seed*3+9);
      const {map}=paint(768,384,(x,y,z)=>{const h=H(x*1.6,y*1.6,z*1.6,5),d=D(x*5,y*5,z*5,3);
        let c=mix(hex(0x0f3d78),hex(0x2c78bb),sstep(-.4,.1,h));c=mix(c,hex(0x4fb3c8),sstep(.18,.26,h));
        const isl=sstep(.27,.29,h);
        const land=acc==='mok'?mix(hex(0x3f8a44),hex(0x69ad5a),d*.5+.5):acc==='to'?hex(0xd9c79a):acc==='hwa'?hex(0xe89a7a):acc==='geum'?hex(0xeef4fa):hex(0xd9c79a);
        c=mix(c,land,isl);
        c=mix(c,hex(0xffffff),sstep(.9,.97,Math.abs(y)+d*.05)*(acc==='geum'?1:.7));
        return c;});
      const g=new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(1,128,96),new THREE.MeshStandardMaterial({map,roughness:.35,metalness:.05})));
      // 구름 띠: 얇고 반투명
      const C=makeNoise(seed*11+4);
      const {map:cm}=paint(512,256,(x,y,z)=>{const v=sstep(.08,.3,C(x*2.2,y*5,z*2.2,4));return [v,v,v];});
      g.add(new THREE.Mesh(new THREE.SphereGeometry(1.02,96,64),new THREE.MeshStandardMaterial({color:0xffffff,alphaMap:cm,transparent:true,opacity:.75,depthWrite:false,roughness:1})));
      g.add(rim(0x9fd2ff,2.2,.85));return g;},
    /* 화 — 불길에 휩싸인 행성. 포인트: 토=재 섞인 지각 / 금=백열 균열 / 목=초록빛 불꽃 끝 / 수=푸른 불 */
    hwa(seed,acc){
      const R=makeNoise(seed*7+1),D=makeNoise(seed*3+9);
      const {map,emap}=paint(768,384,(x,y,z)=>{
        const r=1-Math.abs(R(x*3,y*3,z*3,4));const crack=sstep(.955,.99,r)+.35*sstep(.9,.95,r)*0;const d=D(x*6,y*6,z*6,3);
        let c=mix(hex(acc==='to'?0x3a2a22:0x2a0e08),hex(acc==='to'?0x5a4436:0x4a1a0e),d*.5+.5);
        const hot=acc==='geum'?hex(0xfff2c0):acc==='su'?hex(0x6ad0ff):hex(0xff7a1a);
        c=mix(c,hot,crack);return {c,e:[hot[0]*crack,hot[1]*crack,hot[2]*crack]};});
      const g=new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(1,128,96),new THREE.MeshStandardMaterial({map,emissiveMap:emap,emissive:0xffffff,emissiveIntensity:1.3,roughness:.9})));
      g.add(flameShell(1.05,seed,acc==='geum'?1:0));
      g.add(flameShell(1.13,seed+5,0));
      g.add(flameShell(1.24,seed+9,0));
      g.add(rim(acc==='su'?0x6ab8ff:0xff7a2a,1.6,1.0,1.08));return g;},
    /* 토 — 토성 같은 줄무늬 행성(가스 거인). 포인트: 목=올리브 띠 / 수=청록 띠 / 화=녹슨 띠 / 금=옅은 은빛 띠 */
    to(seed,acc){
      const T=makeNoise(seed*7+1);
      const accCol=acc==='mok'?0x8f9a55:acc==='su'?0x6fa5a8:acc==='hwa'?0xb4583a:acc==='geum'?0xd8d6d0:0xc9a36b;
      const bands=[0xe6cfa0,0xcfa76a,0xf0e0bd,0xb98c55,0xdcbf8a,accCol,0xe9d6b0,0xc49a60];
      const {map}=paint(768,384,(x,y,z)=>{
        const lat=y+T(x*2,y*2,z*2,4)*.06+T(x*6,y*1.5,z*6,3)*.02;
        const f=(lat*.5+.5)*bands.length*1.6;const i=Math.floor(f)%bands.length,t=f-Math.floor(f);
        let c=mix(hex(bands[i]),hex(bands[(i+1)%bands.length]),sstep(.6,1,t));
        c=mix(c,hex(0xfff3da),sstep(.4,.8,T(x*9,y*30,z*9,2))*.12);return c;});
      const g=new THREE.Group();
      const m=new THREE.Mesh(new THREE.SphereGeometry(1,128,96),new THREE.MeshStandardMaterial({map,roughness:.95}));
      m.scale.set(1,.93,1);g.add(m);
      g.add(rim(0xffe2b0,2.2,.6));return g;},
    /* 금 — 금속 행성. 반사 표면 + 판 이음선. 포인트: 화=구리 이음 / 토=금빛 / 수=푸른 강철 / 목=청록 녹 */
    geum(seed,acc){
      const D=makeNoise(seed*3+9);
      const tint=acc==='to'?0xe8cf8a:acc==='su'?0xb8c8dc:acc==='hwa'?0xe0b8a0:acc==='mok'?0xc0d0c4:0xdfe3e8;
      const seamCol=acc==='hwa'?hex(0xc0703a):acc==='to'?hex(0xd9aa40):acc==='su'?hex(0x3a6ea8):acc==='mok'?hex(0x3c9a80):hex(0x7a808a);
      const {map}=paint(768,384,(x,y,z)=>{
        const lat=Math.asin(y),lon=Math.atan2(z,-x);
        const pl=Math.abs(Math.sin(lat*9)),pn=Math.abs(Math.sin(lon*12));
        const seam=Math.max(sstep(.97,1,1-pl),sstep(.985,1,1-pn)*(Math.abs(y)<.95?1:0));
        const d=D(x*8,y*8,z*8,2);
        let c=mix(hex(0xd8dce2),hex(0xf2f4f6),d*.5+.5);
        c=mix(c,seamCol,seam*.9);return c;});
      const g=new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(1,128,96),new THREE.MeshStandardMaterial({map,color:tint,metalness:.9,roughness:.3,envMap:studioEnv(),envMapIntensity:1.2})));
      g.add(rim(0xe8f0ff,2.6,.55));return g;},
  };
  window.makePlanet4=(cnt,seed)=>{const r=rankEl(cnt);return WORLDS[r[0]](seed,r[1]||null);};

  window.renderPlanet4=function(cnt,seed,extra){
    const W=512,S=256;const ps=new THREE.Scene();ps.environment=scene.environment;
    ps.add(new THREE.AmbientLight(0x9098b8,.45));
    const k=new THREE.DirectionalLight(0xfff4e6,1.25);k.position.set(5,6,8);ps.add(k);
    const rl=new THREE.DirectionalLight(0x9fc0ff,.5);rl.position.set(-6,3,-9);ps.add(rl);
    const g=makePlanet4(cnt,seed);g.rotation.set(.3,seed*.9,.1);ps.add(g);
    if(extra)extra(ps,g);
    const cam=new THREE.PerspectiveCamera(30,1,.1,100);cam.position.set(0,.3,1).normalize().multiplyScalar((extra?3.0:1.35)/Math.tan(15*Math.PI/180));
    cam.lookAt(extra?.75:0,extra?-.75:0,0);
    const rt=new THREE.WebGLRenderTarget(W,W);const pr=renderer.getRenderTarget(),pc=renderer.getClearColor(new THREE.Color()),pa=renderer.getClearAlpha();
    const px=new Uint8Array(W*W*4);renderer.setRenderTarget(rt);renderer.setClearColor(0x0b0c14,1);renderer.clear();renderer.render(ps,cam);renderer.readRenderTargetPixels(rt,0,0,W,W,px);
    renderer.setRenderTarget(pr);renderer.setClearColor(pc,pa);rt.dispose();
    const big=document.createElement('canvas');big.width=big.height=W;const bx=big.getContext('2d');const img=bx.createImageData(W,W);
    for(let y=0;y<W;y++)img.data.set(px.subarray((W-1-y)*W*4,(W-y)*W*4),y*W*4);bx.putImageData(img,0,0);
    const c=document.createElement('canvas');c.width=c.height=S;const cx=c.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(big,0,0,S,S);return c;};
})();
