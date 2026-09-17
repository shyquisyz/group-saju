/* [2026-09-17 U2] 시안 3판 — 앱이 읽지 않는다. renderBiome3(개수, 씨앗, 관계계열, 세기1~3). 관계 효과는 window.REL_FX로 4판에서도 쓴다. */
/* 시안 3: 본체 = 상위 3행 이하, 가장 많은 행이 "행성 종류"를 정하고 나머지는 같은 색조 안의 포인트.
   효과 = 나와의 관계(종류: 장식 / 세기: 혜성 꼬리 3단계). 본체는 관계와 무관하게 늘 같다. */
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
  /* 행성 종류(가장 많은 행)마다 한 벌의 팔레트. 같은 벌 안에서만 섞으므로 색이 싸우지 않는다.
     각 벌은 [기본 땅 두 톤] + 부 원소가 이 세계에서 어떻게 보이는지(같은 명도·채도대). */
  const WORLD={
    mok:{base:[0x3e7a33,0x6aa84a],atm:0x9fe0a8,
         su:[0x3f8fb0,0x6bbfd0],to:[0xa7b86a,0xc8cf8e],hwa:[0xc98a3a,0xe0aa55],geum:[0x9fb3a6,0xc9d6cc]},
    su:{base:[0x1f5f9e,0x3a86c2],atm:0x9ccfff,
         mok:[0x4f9a5e,0x78b87a],to:[0xc9b58a,0xe0d2ad],hwa:[0xd07a5a,0xe8a07a],geum:[0xb9c8d8,0xe4ecf4]},
    hwa:{base:[0x7a2c1e,0xb4492a],atm:0xffb088,
         mok:[0x8a8a3a,0xb0a24a],su:[0x5a3a5e,0x7a4d78],to:[0xb0703a,0xd29050],geum:[0x9a7a70,0xc2a298]},
    to:{base:[0xb58a55,0xd9b884],atm:0xffe0b0,
         mok:[0x8aa05a,0xa9b872],su:[0x5a9aa8,0x86bec6],hwa:[0xc0683a,0xd88a55],geum:[0xc9c0b0,0xe6ded0]},
    geum:{base:[0x8f96a0,0xc3c9d1],atm:0xdfe8ff,
         mok:[0x7f9a88,0xa4bca9],su:[0x6a8fb8,0x93b4d6],to:[0xb0a48e,0xcfc4ae],hwa:[0xb88a80,0xd4aaa0]}};
  const ORDER=['mok','hwa','to','geum','su'];

  function topThree(cnt){
    return ORDER.filter(k=>cnt[k]>0).sort((a,b)=>cnt[b]-cnt[a]||ORDER.indexOf(a)-ORDER.indexOf(b)).slice(0,3);}

  window.makeBiome3=function(cnt,seed){
    const tops=topThree(cnt), main=tops[0], W=WORLD[main];
    const sub=tops.slice(1);
    // 넓이: 주 원소 60% 이상, 부 원소는 개수 비율로 나머지를 나눈다
    const subTot=sub.reduce((s,k)=>s+cnt[k],0)||1;
    const shares=[.62].concat(sub.map(k=>.38*cnt[k]/subTot));
    const H=makeNoise(seed*7+1),D=makeNoise(seed*3+9);
    const hf=(x,y,z)=>H(x*1.2,y*1.2,z*1.2,5);
    const r0=rng(seed),smp=[];
    for(let i=0;i<3000;i++){const z=r0()*2-1,t=r0()*Math.PI*2,q=Math.sqrt(1-z*z);smp.push(hf(q*Math.cos(t),z,q*Math.sin(t)));}
    smp.sort((a,b)=>a-b);
    /* 높이 순서로 원소를 배치한다 — 물은 늘 가장 낮은 곳, 화·금은 높은 곳. 주 원소가 물이면 행성 대부분이 바다. */
    const heightRank={su:0,mok:1,to:2,hwa:3,geum:4};
    const layers=tops.map((k,i)=>({k,share:shares[i]})).sort((a,b)=>heightRank[a.k]-heightRank[b.k]);
    const cuts=[];let acc=0;layers.forEach(l=>{acc+=l.share;cuts.push(smp[Math.min(smp.length-1,Math.floor(acc*smp.length))]);});
    const layerAt=h=>{for(let j=0;j<layers.length;j++)if(h<=cuts[j])return j;return layers.length-1;};
    const palOf=k=>k===main?W.base:W[k];
    const TW=768,TH=384;const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;
    const cx=cv.getContext('2d');const img=cx.createImageData(TW,TH);const d=img.data;
    for(let py=0;py<TH;py++){const phi=py/TH*Math.PI,y=Math.cos(phi),sp=Math.sin(phi);
      for(let px=0;px<TW;px++){const th=px/TW*Math.PI*2,x=-Math.cos(th)*sp,z=Math.sin(th)*sp;
        const h=hf(x,y,z),det=D(x*5,y*5,z*5,3);const j=layerAt(h);const k=layers[j].k;const pal=palOf(k).map(hex);
        let c=mix(pal[0],pal[1],sstep(-.35,.35,det));
        // 경계를 부드럽게: 아래 층과 섞는다
        if(j>0){const lo=cuts[j-1];const t=sstep(0,.03,h-lo);const pp=palOf(layers[j-1].k).map(hex);c=mix(mix(pp[0],pp[1],.5),c,t);}
        const i=(py*TW+px)*4;d[i]=c[0]*255;d[i+1]=c[1]*255;d[i+2]=c[2]*255;d[i+3]=255;}}
    cx.putImageData(img,0,0);
    const geo=new THREE.SphereGeometry(1,160,120);const pos=geo.attributes.position;
    const seaTop=layers[0].k==='su'?cuts[0]:-9;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const h=H(x*1.2,y*1.2,z*1.2,3);
      const e=Math.max(0,h-seaTop);const k=1+(seaTop>-9?sstep(0,.02,e)*.006:0)+Math.min(e,.5)*.06;pos.setXYZ(i,x*k,y*k,z*k);}
    geo.computeVertexNormals();
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(cv),roughness:.85,metalness:main==='geum'?.25:0})));
    // 숲은 목이 상위 3행에 있을 때만, 그 층 위에만 — 같은 색조로
    const mj=layers.findIndex(l=>l.k==='mok');
    if(mj>=0){const tr=rng(seed*5+3);const want=Math.round(1800*layers[mj].share);const pts=[];
      for(let t=0;t<want*10&&pts.length<want;t++){const z=tr()*2-1,a=tr()*Math.PI*2,q=Math.sqrt(1-z*z);const x=q*Math.cos(a),y=z,zz=q*Math.sin(a);
        const h=hf(x,y,zz);if(layerAt(h)!==mj)continue;if(D(x*3+11,y*3,zz*3,2)<0)continue;pts.push([x,y,zz,1+Math.min(Math.max(0,h-seaTop),.5)*.06+.006]);}
      const pal=palOf('mok');const cols=[pal[0],pal[1],pal[0]].map(h=>new THREE.Color(h).multiplyScalar(.85));
      const inst=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({roughness:.95}),pts.length);
      const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),v=new THREE.Vector3(),sc=new THREE.Vector3();
      pts.forEach((p,k)=>{v.set(p[0],p[1],p[2]);q.setFromUnitVectors(up,v);const s=.02+tr()*.016;v.multiplyScalar(p[3]+s*.4);
        m4.compose(v,q,sc.set(s,s,s));inst.setMatrixAt(k,m4);inst.setColorAt(k,cols[k%3]);});
      inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;grp.add(inst);}
    // 대기
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(1.03,48,32),new THREE.ShaderMaterial({
      uniforms:{c:{value:new THREE.Color(W.atm)}},
      vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'uniform vec3 c;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.4);gl_FragColor=vec4(c*f,f*.7);}',
      side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));
    return {grp,tops};};

  /* ── 나와의 관계 효과 ── */
  const ringMat=(c,o)=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,transparent:true,opacity:o,depthWrite:false});
  const KIND={
    인성:{col:0xe8c66a,add:(ps)=>{const r=new THREE.Mesh(new THREE.RingGeometry(1.42,1.56,96),ringMat(0xe8c66a,.8));r.rotation.set(Math.PI/2-.7,0,.12);ps.add(r);}},
    관성:{col:0xff7a5a,add:(ps)=>{[.62,-.62].forEach(z=>{const h=new THREE.Group();const r=new THREE.Mesh(new THREE.RingGeometry(1.42,1.52,96),ringMat(0xff7a5a,.8));r.rotation.x=Math.PI/2-.55;h.add(r);h.rotation.z=z;ps.add(h);});}},
    비겁:{col:0xbfe0ff,add:(ps)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.24,32,24),new THREE.MeshStandardMaterial({color:0xcfd8e6,roughness:.9}));m.position.set(1.3,.8,.5);ps.add(m);}},
    식상:{col:0x8fffd0,add:(ps,g)=>{for(let k=0;k<3;k++){const a=new THREE.Mesh(new THREE.TorusGeometry(.6+k*.07,.028,8,64),new THREE.MeshBasicMaterial({color:[0x7dffc8,0x9ae6ff,0xc59bff][k],transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));a.position.y=.86-k*.04;a.rotation.x=Math.PI/2;g.add(a);}}},
    재성:{col:0xffd27a,add:(ps)=>{const n=28;const inst=new THREE.InstancedMesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshStandardMaterial({color:0xffe08a,metalness:.7,roughness:.25,emissive:0x553300}),n);
      const m4=new THREE.Matrix4(),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.85,0,.2));
      for(let i=0;i<n;i++){const t=i/n*Math.PI*2;const v=new THREE.Vector3(Math.cos(t)*1.55,0,Math.sin(t)*1.55).applyQuaternion(q);m4.makeTranslation(v.x,v.y,v.z);inst.setMatrixAt(i,m4);}ps.add(inst);}},
  };
  /* 혜성 꼬리: 세기 1·2·3 → 길이 1.4·2.6·4.0(반경 배), 관계 색. 화면 평면에 눕힌 그라디언트 판 두 장(겉·속). */
  function tailTex(col){const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');
    const cc=new THREE.Color(col);const rgb=`${cc.r*255|0},${cc.g*255|0},${cc.b*255|0}`;
    const g=x.createLinearGradient(0,256,0,0);g.addColorStop(0,`rgba(${rgb},.9)`);g.addColorStop(.35,`rgba(${rgb},.45)`);g.addColorStop(1,`rgba(${rgb},0)`);
    x.fillStyle=g;x.beginPath();x.moveTo(8,256);x.quadraticCurveTo(0,120,32,0);x.quadraticCurveTo(64,120,56,256);x.fill();
    return new THREE.CanvasTexture(c);}
  function addTail(ps,level,col){
    const L=[0,1.3,2.4,3.6][level];if(!L)return;
    const holder=new THREE.Group();holder.rotation.z=Math.PI*.78;
    [[1.5,1],[0.8,.9]].forEach(([w,o])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,L),new THREE.MeshBasicMaterial({map:tailTex(col),transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      m.position.y=L/2+.55;holder.add(m);});
    holder.position.z=-.2;ps.add(holder);}

  window.renderBiome3=function(cnt,seed,rel,level){
    const W=512,S=256;const ps=new THREE.Scene();ps.environment=scene.environment;
    ps.add(new THREE.AmbientLight(0x9098b8,.5));
    const k=new THREE.DirectionalLight(0xfff4e6,1.2);k.position.set(5,6,8);ps.add(k);
    const rl=new THREE.DirectionalLight(0x9fc0ff,.4);rl.position.set(-6,3,-9);ps.add(rl);
    const {grp}=makeBiome3(cnt,seed);grp.rotation.set(.25,seed*.9,.12);ps.add(grp);
    if(rel){KIND[rel].add(ps,grp);addTail(ps,level||0,KIND[rel].col);}
    const far=rel?3.0:1.22;
    const cam=new THREE.PerspectiveCamera(30,1,.1,100);cam.position.set(0,.3,1).normalize().multiplyScalar(far/Math.tan(15*Math.PI/180));
    cam.lookAt(rel?.75:0,rel?-.75:0,0);
    const rt=new THREE.WebGLRenderTarget(W,W);const pr=renderer.getRenderTarget(),pc=renderer.getClearColor(new THREE.Color()),pa=renderer.getClearAlpha();
    const px=new Uint8Array(W*W*4);renderer.setRenderTarget(rt);renderer.setClearColor(0x0b0c14,1);renderer.clear();renderer.render(ps,cam);renderer.readRenderTargetPixels(rt,0,0,W,W,px);
    renderer.setRenderTarget(pr);renderer.setClearColor(pc,pa);rt.dispose();
    const big=document.createElement('canvas');big.width=big.height=W;const bx=big.getContext('2d');const img=bx.createImageData(W,W);
    for(let y=0;y<W;y++)img.data.set(px.subarray((W-1-y)*W*4,(W-y)*W*4),y*W*4);bx.putImageData(img,0,0);
    const c=document.createElement('canvas');c.width=c.height=S;const cx=c.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(big,0,0,S,S);return c;};
  window.topThree=topThree;
  window.REL_FX={KIND,addTail};
})();
