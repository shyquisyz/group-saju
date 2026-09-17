/* [2026-09-17 U2] 시안 2판 — 앱이 읽지 않는다. index.html이 뜬 페이지에 <script>로 얹어
   renderBiome2(개수, 추위, 씨앗, REL_MARK[계열]) 을 부른다. 결과: docs/reports/img/2026-09-17-U2/3-*.jpg */
/* 시안 2: 생태계 행성 — 매끈하게. 색은 등장방형 텍스처(픽셀마다 노이즈), 지형은 낮은 옥타브 변위,
   숲은 노이즈로 모인 덩이, 대기 테두리, 부드러운 구름. */
(function(){
  function rng(seed){let s=(seed*9301+49297)>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
  function makeNoise(seed){
    const r=rng(seed),p=new Uint8Array(512),g=[];
    for(let i=0;i<256;i++){p[i]=i;const t=r()*Math.PI*2,z=r()*2-1,q=Math.sqrt(1-z*z);g.push([q*Math.cos(t),q*Math.sin(t),z]);}
    for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}
    for(let i=0;i<256;i++)p[256+i]=p[i];
    const fade=t=>t*t*t*(t*(t*6-15)+10),lerp=(a,b,t)=>a+(b-a)*t;
    const dot=(h,x,y,z)=>{const v=g[h];return v[0]*x+v[1]*y+v[2]*z;};
    function n(x,y,z){
      const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;
      x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);
      const u=fade(x),v=fade(y),w=fade(z);
      const A=p[X]+Y,AA=p[A]+Z,AB=p[A+1]+Z,B=p[X+1]+Y,BA=p[B]+Z,BB=p[B+1]+Z;
      return lerp(lerp(lerp(dot(p[AA],x,y,z),dot(p[BA],x-1,y,z),u),lerp(dot(p[AB],x,y-1,z),dot(p[BB],x-1,y-1,z),u),v),
        lerp(lerp(dot(p[AA+1],x,y,z-1),dot(p[BA+1],x-1,y,z-1),u),lerp(dot(p[AB+1],x,y-1,z-1),dot(p[BB+1],x-1,y-1,z-1),u),v),w);}
    return (x,y,z,oct)=>{let s=0,a=.5,f=1,norm=0;for(let i=0;i<(oct||4);i++){s+=a*n(x*f,y*f,z*f);norm+=a;a*=.5;f*=2.07;}return s/norm;};}
  const hex=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const sstep=(e0,e1,x)=>{const t=Math.min(1,Math.max(0,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
  const PAL={
    deep:hex(0x163f78), sea:hex(0x2a6fb3), shallow:hex(0x4fb6c9), sand:hex(0xd8c79a),
    mok:[hex(0x3d7a2e),hex(0x5f9e3c)], to:[hex(0xb58a55),hex(0xd9b884)], geum:[hex(0x6f757e),hex(0xa6abb3)],
    hwa:[hex(0x9a3b22),hex(0xc96a3a)], ice:hex(0xeef6fb), snow:hex(0xffffff)};

  window.makeBiome2=function(cnt,cold,seed){
    const tot=Object.values(cnt).reduce((a,b)=>a+b,0)||1;
    const H=makeNoise(seed*7+1),B=makeNoise(seed*13+5),D=makeNoise(seed*3+9);
    const hf=(x,y,z)=>H(x*1.3,y*1.3,z*1.3,5);
    const bf=(x,y,z)=>B(x*.9+3,y*.9,z*.9,3);
    // 해수면·땅 경계를 표본으로 정한다(분위수)
    const smp=[],r0=rng(seed);
    for(let i=0;i<4000;i++){const z=r0()*2-1,t=r0()*Math.PI*2,q=Math.sqrt(1-z*z);const x=q*Math.cos(t),y=z,zz=q*Math.sin(t);smp.push([hf(x,y,zz),bf(x,y,zz)]);}
    const seaFrac=Math.min(.68,Math.max(.1,cnt.su/tot*1.1+.05));
    const hs=smp.map(s=>s[0]).sort((a,b)=>a-b);const sea=hs[Math.floor(seaFrac*hs.length)];
    const land=['mok','to','geum','hwa'].filter(k=>cnt[k]>0);const lt=land.reduce((s,k)=>s+cnt[k],0)||1;
    const lb=smp.filter(s=>s[0]>sea).map(s=>s[1]).sort((a,b)=>a-b);
    const cuts=[];let acc=0;land.forEach(k=>{acc+=cnt[k]/lt;cuts.push(lb[Math.min(lb.length-1,Math.floor(acc*(lb.length-1)))]);});
    const biomeAt=(b)=>{for(let j=0;j<land.length;j++)if(b<=cuts[j])return land[j];return land[land.length-1]||'to';};
    const coldK=Math.max(0,cold);
    // ── 텍스처 ──
    const TW=768,TH=384;const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;
    const cx=cv.getContext('2d');const img=cx.createImageData(TW,TH);const d=img.data;
    const ev=document.createElement('canvas');ev.width=TW;ev.height=TH;const ex=ev.getContext('2d');const eimg=ex.createImageData(TW,TH);const ed=eimg.data;
    for(let py=0;py<TH;py++){
      const phi=py/TH*Math.PI, y=Math.cos(phi), sp=Math.sin(phi);
      for(let px=0;px<TW;px++){
        const th=px/TW*Math.PI*2, x=-Math.cos(th)*sp, z=Math.sin(th)*sp;
        const h=hf(x,y,z), det=D(x*5,y*5,z*5,3);
        let c;const i=(py*TW+px)*4;
        if(h<=sea){
          const depth=sstep(0,.18,sea-h);
          c=mix(PAL.shallow,PAL.sea,sstep(0,.05,sea-h));c=mix(c,PAL.deep,depth);
          // 추우면 유빙(부드러운 가장자리)
          const floe=sstep(.3-.18*coldK,.36-.18*coldK,D(x*2.4+7,y*2.4,z*2.4,4));
          const polar=sstep(.93-.15*coldK,.98-.15*coldK,Math.abs(y)+det*.08);
          const ice=coldK>0?Math.max(floe*coldK,polar):0;
          c=mix(c,mix(PAL.ice,PAL.snow,det*.5+.5),ice);
        }else{
          const e=h-sea, bb=biomeAt(bf(x,y,z)), pal=PAL[bb];
          c=mix(pal[0],pal[1],sstep(-.3,.3,det));
          c=mix(PAL.sand,c,sstep(.0,.025,e));            // 모래톱
          if(bb==='to'||bb==='geum')c=mix(c,PAL.snow,sstep(.3,.38,e)*(bb==='geum'?.5:.3)); // 높은 곳 눈
          if(bb==='hwa'){const lava=sstep(.3,.36,D(x*6+2,y*6,z*6,2))*sstep(.02,.08,e);c=mix(c,hex(0xff7a2a),lava);
            ed[i]=255*lava;ed[i+1]=120*lava;ed[i+2]=40*lava;}
          const polar=sstep(.9-.15*coldK,.96-.15*coldK,Math.abs(y)+det*.08);
          c=mix(c,PAL.snow,coldK>0?polar:sstep(.97,1,Math.abs(y))*.6);
        }
        d[i]=c[0]*255;d[i+1]=c[1]*255;d[i+2]=c[2]*255;d[i+3]=255;ed[i+3]=255;
      }}
    cx.putImageData(img,0,0);ex.putImageData(eimg,0,0);
    const tex=new THREE.CanvasTexture(cv),etex=new THREE.CanvasTexture(ev);
    // ── 지형 ──
    const geo=new THREE.SphereGeometry(1,160,120);const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const h=H(x*1.3,y*1.3,z*1.3,3);
      const e=Math.max(0,h-sea);const k=1+sstep(0,.02,e)*.008+e*.09;pos.setXYZ(i,x*k,y*k,z*k);}
    geo.computeVertexNormals();
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,emissiveMap:etex,emissive:0xffffff,emissiveIntensity:.9,roughness:.8,metalness:0})));
    // ── 숲: 목 땅 위에서 노이즈로 모인 덩이 ──
    const trees=[];const tr=rng(seed*5+3);const want=Math.round(2600*cnt.mok/tot)+(cnt.mok?120:0);
    for(let tries=0;tries<want*12&&trees.length<want;tries++){
      const z=tr()*2-1,t=tr()*Math.PI*2,q=Math.sqrt(1-z*z);const x=q*Math.cos(t),y=z,zz=q*Math.sin(t);
      const h=hf(x,y,zz);if(h<=sea+.02)continue;if(biomeAt(bf(x,y,zz))!=='mok')continue;
      if(coldK>0&&Math.abs(y)>.8-.25*coldK)continue;
      if(D(x*3.2+11,y*3.2,zz*3.2,2)<-.02)continue;   // 숲 사이 빈터
      const e=h-sea;trees.push([x,y,zz,1+.008+e*.09]);}
    if(trees.length){
      const inst=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({roughness:.95,metalness:0}),trees.length);
      const cols=[0x2f6b22,0x3f8230,0x4f9638,0x2a5c1f,0x5ea544].map(h=>new THREE.Color(h));
      const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),v=new THREE.Vector3(),sc=new THREE.Vector3();
      trees.forEach((t,k)=>{v.set(t[0],t[1],t[2]);const nrm=v.clone();q.setFromUnitVectors(up,nrm);
        const s=.026+tr()*.02;v.multiplyScalar(t[3]+s*.45);m4.compose(v,q,sc.set(s,s*1.05,s));inst.setMatrixAt(k,m4);
        inst.setColorAt(k,cols[Math.floor(tr()*cols.length)]);});
      inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;grp.add(inst);}
    // ── 구름: 적고 부드럽게 ──
    const cr=rng(seed*31+2),puffs=[];
    for(let c=0;c<4;c++){const z=cr()*1.6-.8,t=cr()*Math.PI*2,q=Math.sqrt(1-z*z);const base=new THREE.Vector3(q*Math.cos(t),z,q*Math.sin(t));
      for(let k=0;k<9;k++){const off=new THREE.Vector3(cr()-.5,(cr()-.5)*.4,cr()-.5).multiplyScalar(.2);puffs.push([base.clone().add(off).normalize(),.03+cr()*.03]);}}
    const cl=new THREE.InstancedMesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.85}),puffs.length);
    {const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),sc=new THREE.Vector3();
      puffs.forEach((p,k)=>{q.setFromUnitVectors(up,p[0]);m4.compose(p[0].clone().multiplyScalar(1.075),q,sc.set(p[1]*1.5,p[1]*.6,p[1]*1.3));cl.setMatrixAt(k,m4);});}
    grp.add(cl);
    // ── 대기 테두리 ──
    const atm=new THREE.Mesh(new THREE.SphereGeometry(1.03,48,32),new THREE.ShaderMaterial({
      uniforms:{c:{value:new THREE.Color(coldK>0?0xbfe6ff:0x8fc8ff)}},
      vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'uniform vec3 c;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.2);gl_FragColor=vec4(c*f*.9,f*.6);}',
      side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    grp.add(atm);
    return grp;};

  window.renderBiome2=function(cnt,cold,seed,extra){
    const W=512,S=256;
    const ps=new THREE.Scene();ps.environment=scene.environment;
    ps.add(new THREE.AmbientLight(0x9098b8,.5));
    const k=new THREE.DirectionalLight(0xfff4e6,1.2);k.position.set(5,6,8);ps.add(k);
    const rl=new THREE.DirectionalLight(0x9fc0ff,.45);rl.position.set(-6,3,-9);ps.add(rl);
    const g=makeBiome2(cnt,cold,seed);g.rotation.set(.25,seed*.9,.12);ps.add(g);
    if(extra)extra(ps,g);
    const cam=new THREE.PerspectiveCamera(30,1,.1,100);cam.position.set(0,.3,1).normalize().multiplyScalar((extra?1.9:1.25)/Math.tan(15*Math.PI/180));cam.lookAt(0,0,0);
    const rt=new THREE.WebGLRenderTarget(W,W);const pr=renderer.getRenderTarget(),pc=renderer.getClearColor(new THREE.Color()),pa=renderer.getClearAlpha();
    const px=new Uint8Array(W*W*4);
    renderer.setRenderTarget(rt);renderer.setClearColor(0x0b0c14,1);renderer.clear();renderer.render(ps,cam);renderer.readRenderTargetPixels(rt,0,0,W,W,px);
    renderer.setRenderTarget(pr);renderer.setClearColor(pc,pa);rt.dispose();
    const big=document.createElement('canvas');big.width=big.height=W;const bx=big.getContext('2d');const img=bx.createImageData(W,W);
    for(let y=0;y<W;y++)img.data.set(px.subarray((W-1-y)*W*4,(W-y)*W*4),y*W*4);
    bx.putImageData(img,0,0);
    const c=document.createElement('canvas');c.width=c.height=S;const cx=c.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(big,0,0,S,S);
    return c;};
})();

/* 관계 표시 시안 — 나와의 관계(십신 다섯 갈래)를 행성 둘레 장식으로 */
(function(){
  const ringMat=(c,o)=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,transparent:true,opacity:o,depthWrite:false});
  window.REL_MARK={
    인성:(ps,g)=>{const r=new THREE.Mesh(new THREE.RingGeometry(1.45,1.62,96),ringMat(0xe8c66a,.85));r.rotation.set(Math.PI/2-.75,0,.12);ps.add(r);},
    관성:(ps,g)=>{[.62,-.62].forEach(z=>{const holder=new THREE.Group();const r=new THREE.Mesh(new THREE.RingGeometry(1.42,1.54,96),ringMat(0xff7a5a,.85));r.rotation.x=Math.PI/2-.55;holder.add(r);holder.rotation.z=z;ps.add(holder);});},
    비겁:(ps,g)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.26,32,24),new THREE.MeshStandardMaterial({color:0x7fb07a,roughness:.8}));m.position.set(1.55,.35,.3);ps.add(m);
      const o=new THREE.Mesh(new THREE.RingGeometry(1.58,1.6,96),ringMat(0xffffff,.25));o.rotation.set(Math.PI/2-.75,0,.12);ps.add(o);m.position.set(1.35,.75,.55);},
    식상:(ps,g)=>{/* 극광: 극지방 위 빛 띠 */
      for(let k=0;k<3;k++){const a=new THREE.Mesh(new THREE.TorusGeometry(.62+k*.07,.03,8,64),new THREE.MeshBasicMaterial({color:[0x7dffc8,0x9ae6ff,0xc59bff][k],transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
        a.position.y=.86-k*.04;a.rotation.x=Math.PI/2;g.add(a);}},
    재성:(ps,g)=>{const n=28,gg=new THREE.SphereGeometry(.05,12,8);
      const inst=new THREE.InstancedMesh(gg,new THREE.MeshStandardMaterial({color:0xffe08a,metalness:.7,roughness:.25,emissive:0x553300}),n);
      const m4=new THREE.Matrix4(),e=new THREE.Euler(.85,0,.2),q=new THREE.Quaternion().setFromEuler(e);
      for(let i=0;i<n;i++){const t=i/n*Math.PI*2;const v=new THREE.Vector3(Math.cos(t)*1.55,0,Math.sin(t)*1.55).applyQuaternion(q);m4.makeTranslation(v.x,v.y,v.z);inst.setMatrixAt(i,m4);}
      ps.add(inst);},
  };
})();
