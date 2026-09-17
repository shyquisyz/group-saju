/* 시안: 오행 비율 → 생태계 행성 (목=숲, 수=바다/얼음, 토=흙·산, 금=바위·결정, 화=화산·붉은 땅)
   [2026-09-17 U2] **앱이 읽지 않는 시안 파일이다.** index.html이 뜬 페이지에 <script>로 얹어
   renderBiomePortrait(개수, 추위, 씨앗)을 부르면 초상 캔버스가 나온다(scene·renderer·EL_KO를 빌려 쓴다).
   결과: docs/reports/img/2026-09-17-U2/2-생태계행성-시안.jpg. 채택되면 index.html로 옮긴다. */
(function(){
  // ── 결정적 난수 · 3D 그라디언트 노이즈 ──
  function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
  function makeNoise(seed){
    const r=rng(seed),p=new Uint8Array(512),g=[];
    for(let i=0;i<256;i++){p[i]=i;const t=r()*Math.PI*2,z=r()*2-1,q=Math.sqrt(1-z*z);g.push([q*Math.cos(t),q*Math.sin(t),z]);}
    for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]];}
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
    return (x,y,z,oct)=>{let s=0,a=.5,f=1;for(let i=0;i<(oct||4);i++){s+=a*n(x*f,y*f,z*f);a*=.5;f*=2.03;}return s;};}

  const COL={
    su:[0x1f5f9e,0x2f86c4], ice:[0xe8f4fb,0xbfdcef], mok:[0x5b9a3a,0x3f7d2a], to:[0xc9a26b,0x9b7447],
    geum:[0x8d9199,0xc9ccd3], hwa:[0x7a2414,0xd2602c]};
  const c3=h=>new THREE.Color(h);

  /** cnt: {mok,hwa,to,geum,su} 개수, cold: -1(더움)~1(추움), seed: 사람마다 다른 지도 */
  window.makeBiomePlanet=function(cnt,cold,seed){
    const tot=Object.values(cnt).reduce((a,b)=>a+b,0)||1;
    const fr=k=>cnt[k]/tot;
    const H=makeNoise(seed*7+1), B=makeNoise(seed*13+5), D=makeNoise(seed*3+9);
    const geo=new THREE.IcosahedronGeometry(1,40);  // r128: BufferGeometry
    const pos=geo.attributes.position, N=pos.count;
    const hv=new Float32Array(N),bv=new Float32Array(N);
    for(let i=0;i<N;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      hv[i]=H(x*1.6,y*1.6,z*1.6,5);bv[i]=B(x*1.1+3,y*1.1,z*1.1,3);}
    // 바다 비율 = 수 비율(최소 8%, 최대 70%) — 높이 분위수로 해수면을 정한다
    const seaFrac=Math.min(.7,Math.max(.08,fr('su')*1.15));
    const sorted=Float32Array.from(hv).sort();const sea=sorted[Math.floor(seaFrac*(N-1))];
    // 땅의 나머지 넷 — 두 번째 노이즈 분위수로 나눈다
    const land=['mok','to','geum','hwa'].filter(k=>cnt[k]>0);
    const lt=land.reduce((s,k)=>s+cnt[k],0)||1;
    const landIdx=[];for(let i=0;i<N;i++)if(hv[i]>sea)landIdx.push(i);
    const lb=landIdx.map(i=>bv[i]).sort((a,b)=>a-b);
    const cuts=[];let acc=0;land.forEach(k=>{acc+=cnt[k]/lt;cuts.push(lb[Math.min(lb.length-1,Math.floor(acc*(lb.length-1)))]);});
    const biome=new Array(N);const colors=new Float32Array(N*3);
    const polar=.93-.2*Math.max(0,cold);   // 추울수록 얼음이 넓다
    const tmp=new THREE.Color();
    const trees=[],rocks=[],volc=[];
    for(let i=0;i<N;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      let b;
      if(hv[i]<=sea){b='su';}else{b=land[land.length-1]||'to';for(let j=0;j<land.length;j++)if(bv[i]<=cuts[j]){b=land[j];break;}}
      const lat=Math.abs(y);
      /* 추우면 극지방뿐 아니라 바다 곳곳이 얼어 유빙이 된다 — 어느 각도에서 봐도 추위가 보이게 */
      const icy=cold>0&&(lat>polar-(b==='su'?0:.08)+D(x*4,y*4,z*4,2)*.12
        ||(b==='su'&&D(x*2.6+9,y*2.6,z*2.6,3)>.22-.3*cold));
      biome[i]=icy?'ice':b;
      const pal=COL[biome[i]];const m=Math.min(1,Math.max(0,.5+D(x*6,y*6,z*6,3)*1.4));
      tmp.copy(c3(pal[0])).lerp(c3(pal[1]),m);
      // 바다: 해안 가까울수록 밝게(얕은 물)
      if(b==='su'&&!icy){const sh=Math.min(1,(sea-hv[i])*9);tmp.lerp(c3(0x0f3b6e),sh*.8).lerp(c3(0x6fd0d8),Math.max(0,.35-sh));}
      colors[i*3]=tmp.r;colors[i*3+1]=tmp.g;colors[i*3+2]=tmp.b;
      // 높이
      let h=1;
      if(b!=='su'){const e=hv[i]-sea;h=1.012+e*(b==='to'?.32:b==='geum'?.14:b==='hwa'?.18:.12);}
      else if(icy)h=1.004;
      pos.setXYZ(i,x*h,y*h,z*h);
      // 장식 후보
      if(!icy&&b==='mok'&&((i*2654435761)>>>0)%100<22)trees.push(i);
      if(!icy&&b==='geum'&&hv[i]-sea>.06&&((i*40503)>>>0)%1000<9)rocks.push(i);
      if(b==='hwa'&&hv[i]-sea>.16&&((i*97)>>>0)%1000<6)volc.push(i);
    }
    geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
    geo.computeVertexNormals();
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,flatShading:false})));
    const v=new THREE.Vector3(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),m4=new THREE.Matrix4(),sc=new THREE.Vector3();
    const place=(inst,list,sizeFn,jit)=>{list.forEach((i,k)=>{v.set(pos.getX(i),pos.getY(i),pos.getZ(i));const n=v.clone().normalize();
      q.setFromUnitVectors(up,n);const s=sizeFn(k);sc.set(s,s*(jit?1+((k*37)%10)/10:1),s);v.addScaledVector(n,s*.35);m4.compose(v,q,sc);inst.setMatrixAt(k,m4);});
      inst.instanceMatrix.needsUpdate=true;grp.add(inst);};
    // 숲: 뭉게 나무(구 3개 덩이)
    if(trees.length){
      const tg=new THREE.IcosahedronGeometry(1,1);
      const tm=new THREE.MeshStandardMaterial({color:0x4f9a34,roughness:.9,flatShading:true});
      const inst=new THREE.InstancedMesh(tg,tm,trees.length);
      const cols=[0x3f8a2c,0x5ba83a,0x2f6f25,0x74b84a];
      trees.forEach((_,k)=>inst.setColorAt(k,c3(cols[k%4])));
      place(inst,trees,k=>.028+((k*13)%7)*.004,false);
      if(inst.instanceColor)inst.instanceColor.needsUpdate=true;}
    // 금: 결정 바위
    if(rocks.length){
      const inst=new THREE.InstancedMesh(new THREE.OctahedronGeometry(1,0),
        new THREE.MeshStandardMaterial({color:0xe9eef5,roughness:.15,metalness:.35,flatShading:true,emissive:0x223040}),rocks.length);
      place(inst,rocks,k=>.03+((k*7)%5)*.004,true);}
    // 화: 화산(원뿔 + 빛나는 꼭대기)
    if(volc.length){
      const inst=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1.3,7),
        new THREE.MeshStandardMaterial({color:0x4a2218,roughness:.9,flatShading:true}),volc.length);
      place(inst,volc,k=>.07+((k*11)%4)*.012,false);
      const glow=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:0xff7a2a}),volc.length);
      volc.forEach((i,k)=>{v.set(pos.getX(i),pos.getY(i),pos.getZ(i));const n=v.clone().normalize();const s=.07+((k*11)%4)*.012;
        v.addScaledVector(n,s*1.05);m4.compose(v,q.setFromUnitVectors(up,n),sc.set(s*.35,s*.35,s*.35));glow.setMatrixAt(k,m4);});
      grp.add(glow);}
    // 구름
    const cr=rng(seed*31+2),cl=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,3),
      new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.9,flatShading:false}),40);
    let ci=0;for(let c=0;c<5;c++){const th=cr()*Math.PI*2,ph=Math.acos(cr()*1.6-.8);
      const base=new THREE.Vector3(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th));
      for(let k=0;k<8;k++){const off=new THREE.Vector3(cr()-.5,cr()-.5,cr()-.5).multiplyScalar(.16);
        const p=base.clone().add(off).normalize().multiplyScalar(1.1);const s=.04+cr()*.03;
        q.setFromUnitVectors(up,p.clone().normalize());m4.compose(p,q,sc.set(s*1.4,s*.55,s*1.2));cl.setMatrixAt(ci++,m4);}}
    grp.add(cl);
    return grp;};

  window.renderBiomePortrait=function(cnt,cold,seed){
    const W=512,S=256;
    const ps=new THREE.Scene();ps.environment=scene.environment;
    ps.add(new THREE.AmbientLight(0x8890b0,.45));
    const k=new THREE.DirectionalLight(0xffffff,1.15);k.position.set(6,10,8);ps.add(k);
    const rl=new THREE.DirectionalLight(0x9fc0ff,.5);rl.position.set(-6,3,-9);ps.add(rl);
    const g=makeBiomePlanet(cnt,cold,seed);g.rotation.set(-.45,seed*.7,0);ps.add(g);
    const cam=new THREE.PerspectiveCamera(30,1,.1,100);cam.position.set(0,.35,1).normalize().multiplyScalar(1.25/Math.tan(15*Math.PI/180));cam.lookAt(0,0,0);
    const rt=new THREE.WebGLRenderTarget(W,W);const pr=renderer.getRenderTarget(),pc=renderer.getClearColor(new THREE.Color()),pa=renderer.getClearAlpha();
    const px=new Uint8Array(W*W*4);
    renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(ps,cam);renderer.readRenderTargetPixels(rt,0,0,W,W,px);
    renderer.setRenderTarget(pr);renderer.setClearColor(pc,pa);rt.dispose();
    const big=document.createElement('canvas');big.width=big.height=W;const bx=big.getContext('2d');const img=bx.createImageData(W,W);
    for(let y=0;y<W;y++)img.data.set(px.subarray((W-1-y)*W*4,(W-y)*W*4),y*W*4);
    bx.putImageData(img,0,0);
    const c=document.createElement('canvas');c.width=c.height=S;c.getContext('2d').drawImage(big,0,0,S,S);
    return c;};
})();
