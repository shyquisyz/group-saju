/* [2026-09-17 U2] 시안 5판 — 앱이 읽지 않는다. renderPlanet5(개수, 씨앗, 관계계열, 세기1~3). 결과: docs/reports/img/2026-09-17-U2/6-*.jpg, 7-*.jpg(넓이 수정 뒤) */
/* 시안 5: 표면을 큰 영역으로 나눈다(상위 3행, 많을수록 넓게). 영역마다 그 오행의 모습으로 —
   수=바다 / 목=나무 빽빽한 섬 / 화=불타는 땅(압도적이면 태양) / 토=겹겹 모래 언덕 / 금=각진 결정 지대.
   경계는 해안·그을림으로 잇는다. 관계 효과: 가는 꼬리(빛줄기+먼지), 두꺼운 금색 고리. */
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
  const clamp01=x=>Math.min(1,Math.max(0,x));
  const ORDER=['mok','hwa','to','geum','su'];
  const rankEl=cnt=>ORDER.filter(k=>cnt[k]>0).sort((a,b)=>cnt[b]-cnt[a]||ORDER.indexOf(a)-ORDER.indexOf(b));

  /* ── 영역 나누기: 원소마다 저주파 노이즈 + 치우침(bias). 치우침을 반복 조정해 넓이를 목표 비율에 맞춘다 ── */
  function makeRegions(cnt,seed){
    const els=rankEl(cnt).slice(0,3);
    const pw=els.map(k=>Math.pow(cnt[k],1.6));const tot=pw.reduce((a,b)=>a+b,0);
    const target=pw.map(v=>v/tot);
    const N=els.map((k,i)=>makeNoise(seed*31+i*97+5));
    const bias=els.map(()=>0);
    const r0=rng(seed*3+1),pts=[];
    for(let i=0;i<3000;i++){const z=r0()*2-1,t=r0()*Math.PI*2,q=Math.sqrt(1-z*z);pts.push([q*Math.cos(t),z,q*Math.sin(t)]);}
    const wAt=(x,y,z)=>els.map((k,i)=>N[i](x*1.05,y*1.05,z*1.05,3)+bias[i]);
    const vals=pts.map(p=>els.map((k,i)=>N[i](p[0]*1.05,p[1]*1.05,p[2]*1.05,3)));
    /* [자기 검토 뒤 수정] 고정 보폭 .6·40회는 수렴하지 않았다(실측: 목표 46/46 → 80/12).
       보폭을 줄여 가며 400회 — 넓이 오차를 매번 재고 가장 좋았던 치우침을 쓴다. */
    let best=null,bestErr=9;
    for(let it=0;it<400;it++){
      const f=els.map(()=>0);
      vals.forEach(v=>{let bi=0,bv=-9;v.forEach((w,i)=>{if(w+bias[i]>bv){bv=w+bias[i];bi=i;}});f[bi]++;});
      const err=Math.max(...els.map((k,i)=>Math.abs(target[i]-f[i]/pts.length)));
      if(err<bestErr){bestErr=err;best=bias.slice();}
      const step=.25*Math.pow(.992,it);
      els.forEach((k,i)=>{bias[i]+=step*(target[i]-f[i]/pts.length);});}
    best.forEach((v,i)=>bias[i]=v);
    /* 한 점의 영역: 가장 큰 가중치의 원소, margin = 1등과 2등의 차(경계일수록 0) */
    function at(x,y,z){const w=wAt(x,y,z);let a=0,b=-1;for(let i=1;i<w.length;i++)if(w[i]>w[a])a=i;
      for(let i=0;i<w.length;i++)if(i!==a&&(b<0||w[i]>w[b]))b=i;
      return {k:els[a],k2:b>=0?els[b]:null,m:b>=0?w[a]-w[b]:1};}
    return {els,target,at};}

  function paint(TW,TH,f){
    const out={};const cvs={};
    ['map','emi','rough','geum','hwa'].forEach(n=>{const c=document.createElement('canvas');c.width=TW;c.height=TH;const x=c.getContext('2d');cvs[n]={c,x,im:x.createImageData(TW,TH)};});
    for(let py=0;py<TH;py++){const phi=py/TH*Math.PI,y=Math.cos(phi),sp=Math.sin(phi);
      for(let px=0;px<TW;px++){const th=px/TW*Math.PI*2,x=-Math.cos(th)*sp,z=Math.sin(th)*sp;
        const o=f(x,y,z);const i=(py*TW+px)*4;
        const put=(n,v)=>{const d=cvs[n].im.data;d[i]=v[0]*255;d[i+1]=v[1]*255;d[i+2]=v[2]*255;d[i+3]=255;};
        put('map',o.c);put('emi',o.e||[0,0,0]);put('rough',[o.r,o.r,o.r]);put('geum',[o.g,o.g,o.g]);put('hwa',[o.h,o.h,o.h]);}}
    Object.keys(cvs).forEach(n=>{cvs[n].x.putImageData(cvs[n].im,0,0);out[n]=new THREE.CanvasTexture(cvs[n].c);});
    return out;}

  const GLSL_NOISE=`
    float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}
    vec2 sphUV(vec3 n){float th=atan(n.z,-n.x);return vec2(fract(th/6.2831853),1.-acos(clamp(n.y,-1.,1.))/3.1415926);}`;
  /* 불꽃 껍질: 화 영역(마스크) 위에서만, 가장자리에서 솟는다 */
  function flameShell(r,seed,mask,power){
    return new THREE.Mesh(new THREE.SphereGeometry(r,96,64),new THREE.ShaderMaterial({
      uniforms:{sd:{value:seed%17*1.3},mask:{value:mask},pw:{value:power}},
      vertexShader:'varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=normalize(position);vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:GLSL_NOISE+`uniform float sd;uniform sampler2D mask;uniform float pw;varying vec3 vP;varying vec3 vN;varying vec3 vV;
        void main(){float mk=texture2D(mask,sphUV(vP)).r;if(mk<.02)discard;
          float fr=1.-abs(dot(vN,vV));
          vec3 q=vP*4.+vec3(sd,sd*.7,0.);q+=vec3(0.,fbm(vP*2.+sd)*1.4,0.);
          float n=fbm(q);float flame=smoothstep(.45,.72,n)*pow(fr,pw)*mk*1.5;
          vec3 col=mix(vec3(1.,.3,.04),vec3(1.,.85,.4),smoothstep(.55,.85,n));
          gl_FragColor=vec4(col*flame*1.8,flame);}`,
      transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));}
  const rim=(col,power,alpha,r)=>new THREE.Mesh(new THREE.SphereGeometry(r||1.035,48,32),new THREE.ShaderMaterial({
    uniforms:{c:{value:new THREE.Color(col)}},
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:`uniform vec3 c;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),${power.toFixed(2)});gl_FragColor=vec4(c*f,f*${alpha.toFixed(2)});}`,
    side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  let _studio=null;
  function studioEnv(){
    if(_studio)return _studio;
    const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#eef2f8');g.addColorStop(.45,'#8f98aa');g.addColorStop(.55,'#3c4252');g.addColorStop(1,'#12151c');
    x.fillStyle=g;x.fillRect(0,0,512,256);
    [[110,60,70,'rgba(255,255,255,.95)'],[330,80,50,'rgba(220,235,255,.8)'],[430,150,40,'rgba(170,200,255,.5)']].forEach(([cx,cy,r,col])=>{
      const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=rg;x.fillRect(cx-r,cy-r,r*2,r*2);});
    const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);_studio=pm.fromEquirectangular(t).texture;pm.dispose();t.dispose();return _studio;}

  window.makePlanet5=function(cnt,seed){
    const R=makeRegions(cnt,seed);
    const main=R.els[0];
    const sunMode=main==='hwa'&&(R.els.length===1||cnt.hwa>=5);
    const T=makeNoise(seed*7+3),D=makeNoise(seed*5+11),L=makeNoise(seed*13+2);
    /* 모래 언덕(토): 등고선처럼 겹겹 — 높이를 계단으로 자르고, 층 가장자리에 밝은 선 */
    const duneH=(x,y,z)=>{const w=T(x*.7,y*.7,z*.7,2);return T(x*1.3+w*1.6,y*1.3+w*.8,z*1.3,3)*.8+y*.35;};
    const tex=paint(768,384,(x,y,z)=>{
      const g=R.at(x,y,z),k=sunMode?'hwa':g.k,m=sunMode?1:g.m,det=D(x*7,y*7,z*7,3);
      let c,e=null,r=.9,gm=0,hm=0;
      if(k==='su'){
        const depth=sstep(.0,.25,m);
        c=mix(hex(0x4cb9c8),hex(0x2a74b6),sstep(0,.05,m));c=mix(c,hex(0x103c77),depth);
        c=mix(c,hex(0xffffff),sstep(.955,.99,Math.abs(y)+det*.05)*.8);r=.25;
      }else if(k==='mok'){
        c=mix(hex(0x2f6a2a),hex(0x4f8f38),sstep(-.3,.3,det));
        if(g.k2==='su')c=mix(hex(0xd9cf9e),c,sstep(0,.035,m));   // 모래톱
        r=.95;
      }else if(k==='to'){
        const h=duneH(x,y,z)*5;const lv=Math.floor(h),fr=h-lv;
        const shades=[0xa9482a,0xc25a30,0xd8733c,0xe68f4e,0xf0ad6c,0xf6c98e];
        const base=hex(shades[Math.min(shades.length-1,Math.max(0,lv+3))]);
        c=mix(mix(base,hex(0x5a1e10),.35),mix(base,hex(0xfff2dc),.18),sstep(0,.85,fr));   // 층 안: 아래 어둡고 위 밝게
        c=mix(c,hex(0xfff4e2),sstep(.92,1,fr)*.3);
        if(g.k2==='su')c=mix(hex(0xd9c79a),c,sstep(0,.03,m));
        r=.95;
      }else if(k==='hwa'){
        c=mix(hex(0x140806),hex(0x2e140c),det*.5+.5);c=mix(c,hex(0x5a2410),sstep(.2,.45,L(x*1.5,y*1.5,z*1.5,3))*.5);
        const pool=sstep(.36,.39,L(x*4.5,y*4.5,z*4.5,3));
        const crack=sstep(.978,.996,1-Math.abs(T(x*2.6,y*2.6,z*2.6,4)))*.9;
        const glow=Math.max(pool,crack);
        const hot=mix(hex(0xff6a12),hex(0xffc060),pool);
        c=mix(c,hot,glow);e=[hot[0]*glow,hot[1]*glow,hot[2]*glow];
        // 불타는 경계: 그을림 + 불씨
        if(!sunMode){const edge=1-sstep(0,.06,m);const ember=edge*sstep(.2,.45,D(x*9,y*9,z*9,2));
          e=[e[0]+ember*1.,e[1]+ember*.45,e[2]+ember*.1];}
        hm=sunMode?1:sstep(0,.05,m);r=.9;
      }else{ // geum — 받침(각진 결정 판이 위에 얹힌다)
        c=mix(hex(0x2a2e36),hex(0x4a505c),det*.5+.5);gm=sstep(.02,.03,m);r=.5;
      }
      // 화와 맞닿은 다른 영역은 그을린다
      if(!sunMode&&k!=='hwa'&&g.k2==='hwa'){const burn=1-sstep(0,.05,m);c=mix(c,hex(0x1a0c08),burn*.85);
        const ember=burn*sstep(.3,.5,D(x*9,y*9,z*9,2));e=[ember,ember*.4,ember*.08];}
      return {c,e,r,g:gm,h:hm};});
    const grp=new THREE.Group();
    // 본체: 영역별 높이
    const geo=new THREE.SphereGeometry(1,192,128),pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const g=R.at(x,y,z),k=sunMode?'hwa':g.k;let h=1;
      if(k==='mok')h=1+sstep(0,.04,g.m)*.018+T(x*3,y*3,z*3,3)*.006;
      else if(k==='to'){const t=duneH(x,y,z)*5;h=1+sstep(0,.04,g.m)*(.016+Math.floor(t)*.006+sstep(0,.9,t-Math.floor(t))*.005);}
      else if(k==='hwa')h=1+(sunMode?0:sstep(0,.04,g.m)*.006);
      else if(k==='geum')h=1+sstep(0,.04,g.m)*.006;
      pos.setXYZ(i,x*h,y*h,z*h);}
    geo.computeVertexNormals();
    grp.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex.map,emissiveMap:tex.emi,emissive:0xffffff,emissiveIntensity:1.2,roughnessMap:tex.rough,roughness:1,metalness:0})));
    // 금: 각진 결정 판(평면 음영), 마스크 밖은 잘라낸다
    if(R.els.includes('geum')&&!sunMode){
      const fg=new THREE.IcosahedronGeometry(1,6);const fp=fg.attributes.position;const jr=rng(seed*17+7);
      const key=v=>`${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;const jit=new Map();const v=new THREE.Vector3();
      for(let i=0;i<fp.count;i++){v.fromBufferAttribute(fp,i);const kk=key(v);if(!jit.has(kk))jit.set(kk,1.012+jr()*.022);const s=jit.get(kk);fp.setXYZ(i,v.x*s,v.y*s,v.z*s);}
      /* 금 영역 안 삼각형만 남긴다 — UV 마스크 대신 면 단위로 잘라 가장자리가 결정 면 그대로 끊긴다 */
      const keep=[];const c3=new THREE.Vector3(),a3=new THREE.Vector3(),b3=new THREE.Vector3();
      for(let i=0;i<fp.count;i+=3){a3.fromBufferAttribute(fp,i);b3.fromBufferAttribute(fp,i+1);c3.fromBufferAttribute(fp,i+2);
        const cx=(a3.x+b3.x+c3.x)/3,cy=(a3.y+b3.y+c3.y)/3,cz=(a3.z+b3.z+c3.z)/3,l=Math.hypot(cx,cy,cz);
        const g=R.at(cx/l,cy/l,cz/l);if(g.k==='geum'&&g.m>.015)keep.push(a3.x,a3.y,a3.z,b3.x,b3.y,b3.z,c3.x,c3.y,c3.z);}
      const kg=new THREE.BufferGeometry();kg.setAttribute('position',new THREE.Float32BufferAttribute(keep,3));kg.computeVertexNormals();
      grp.add(new THREE.Mesh(kg,new THREE.MeshStandardMaterial({color:0xf0f4fa,metalness:.8,roughness:.2,flatShading:true,envMap:studioEnv(),envMapIntensity:1.3})));}
    // 목: 나무 빽빽한 섬
    if(R.els.includes('mok')&&!sunMode){
      const tr=rng(seed*5+3),pts=[];const share=R.target[R.els.indexOf('mok')];const want=Math.round(5200*share);
      for(let t=0;t<want*8&&pts.length<want;t++){const zz=tr()*2-1,a=tr()*Math.PI*2,q=Math.sqrt(1-zz*zz);const x=q*Math.cos(a),y=zz,z=q*Math.sin(a);
        const g=R.at(x,y,z);if(g.k!=='mok'||g.m<.03)continue;pts.push([x,y,z,1+sstep(0,.04,g.m)*.018]);}
      const inst=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({roughness:.95}),pts.length);
      const cols=[0x2a6226,0x3a7a30,0x4a9038,0x5aa244].map(h=>new THREE.Color(h));
      const m4=new THREE.Matrix4(),qq=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),vv=new THREE.Vector3(),sc=new THREE.Vector3();
      pts.forEach((p,k)=>{vv.set(p[0],p[1],p[2]);qq.setFromUnitVectors(up,vv);const s=.022+tr()*.02;vv.multiplyScalar(p[3]+s*.35);
        m4.compose(vv,qq,sc.set(s,s*.95,s));inst.setMatrixAt(k,m4);inst.setColorAt(k,cols[Math.floor(tr()*cols.length)]);});
      inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;grp.add(inst);}
    // 화: 불꽃(영역 위에서만)
    if(R.els.includes('hwa')||sunMode){
      grp.add(flameShell(1.035,seed,tex.hwa,.9));grp.add(flameShell(1.09,seed+4,tex.hwa,.7));
      if(sunMode)grp.add(flameShell(1.17,seed+8,tex.hwa,.6));}
    // 대기: 주 원소 색
    const atm={su:0x9fd2ff,mok:0xaef0c0,to:0xffc890,hwa:0xff8a3a,geum:0xdce6ff}[sunMode?'hwa':main];
    grp.add(rim(atm,2.3,sunMode?1:.75));
    return {grp,R,sunMode};};

  /* ── 관계 효과 ── */
  const ringMat=(c,o)=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,transparent:true,opacity:o,depthWrite:false});
  /* 두꺼운 금색 고리: 토성처럼 결이 있는 넓은 띠 */
  function thickRing(){
    const m=new THREE.Mesh(new THREE.RingGeometry(1.28,1.85,160,1),new THREE.ShaderMaterial({
      vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 vU;void main(){float r=length(vU-.5)*2.;float t=(r-.692)/(1.-.692);
        float band=.55+.45*sin(t*58.)*sin(t*13.+1.);float edge=smoothstep(0.,.06,t)*smoothstep(1.,.85,t);
        float gap=1.-.8*smoothstep(.58,.6,t)*(1.-smoothstep(.64,.66,t));
        vec3 c=mix(vec3(.72,.55,.25),vec3(1.,.9,.62),band);gl_FragColor=vec4(c,.85*edge*gap*(.6+.4*band));}`,
      transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    m.rotation.set(Math.PI/2-.62,0,.14);return m;}
  const KIND={
    인성:{col:0xffd98a,add:(ps)=>ps.add(thickRing())},
    관성:{col:0xff8a6a,add:(ps)=>{[.62,-.62].forEach(z=>{const h=new THREE.Group();const r=new THREE.Mesh(new THREE.RingGeometry(1.42,1.5,128),ringMat(0xff7a5a,.8));r.rotation.x=Math.PI/2-.55;h.add(r);h.rotation.z=z;ps.add(h);});}},
    비겁:{col:0xcfe4ff,add:(ps)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.22,32,24),new THREE.MeshStandardMaterial({color:0xcfd8e6,roughness:.9}));m.position.set(1.3,.8,.5);ps.add(m);}},
    식상:{col:0x9fffd8,add:(ps,g)=>{for(let k=0;k<3;k++){const a=new THREE.Mesh(new THREE.TorusGeometry(.58+k*.07,.02,8,64),new THREE.MeshBasicMaterial({color:[0x7dffc8,0x9ae6ff,0xc59bff][k],transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));a.position.y=.87-k*.04;a.rotation.x=Math.PI/2;g.add(a);}}},
    재성:{col:0xffe3a0,add:(ps)=>{const n=32;const inst=new THREE.InstancedMesh(new THREE.SphereGeometry(.04,12,8),new THREE.MeshStandardMaterial({color:0xffe08a,metalness:.7,roughness:.25,emissive:0x553300}),n);
      const m4=new THREE.Matrix4(),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.85,0,.2));
      for(let i=0;i<n;i++){const t=i/n*Math.PI*2;const v=new THREE.Vector3(Math.cos(t)*1.55,0,Math.sin(t)*1.55).applyQuaternion(q);m4.makeTranslation(v.x,v.y,v.z);inst.setMatrixAt(i,m4);}ps.add(inst);}},
  };
  /* 가는 꼬리: 빛줄기 셋(가운데 선명, 양옆 옅게) + 흩날리는 먼지. 세기 1·2·3 → 길이 1.4·2.6·3.8 */
  function streakTex(){const c=document.createElement('canvas');c.width=32;c.height=256;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,256,0,0);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');
    const h=x.createLinearGradient(0,0,32,0);h.addColorStop(0,'rgba(0,0,0,0)');h.addColorStop(.5,'rgba(0,0,0,1)');h.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=g;x.fillRect(0,0,32,256);x.globalCompositeOperation='destination-in';x.fillStyle=h;x.fillRect(0,0,32,256);return new THREE.CanvasTexture(c);}
  function addTail(ps,level,col){
    const L=[0,1.4,2.6,3.8][level];if(!L)return;
    const tex=streakTex();const holder=new THREE.Group();holder.rotation.z=Math.PI*.78;
    [[.16,0,1],[.07,.12,.5],[.07,-.12,.5],[.04,.22,.3],[.04,-.2,.3]].forEach(([w,off,o],i)=>{
      const len=L*(i===0?1:.75-.1*i);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,len),new THREE.MeshBasicMaterial({map:tex,color:col,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      m.position.set(off,len/2+.75,0);m.rotation.z=-off*.25;holder.add(m);});
    const n=Math.round(60*level),pg=new THREE.BufferGeometry(),arr=new Float32Array(n*3),r=rng(level*7+3);
    for(let i=0;i<n;i++){const t=Math.pow(r(),.7);arr[i*3]=(r()-.5)*(.1+t*.6);arr[i*3+1]=.8+t*L;arr[i*3+2]=(r()-.5)*.2;}
    pg.setAttribute('position',new THREE.BufferAttribute(arr,3));
    holder.add(new THREE.Points(pg,new THREE.PointsMaterial({color:col,size:.035,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false})));
    holder.position.z=-.2;ps.add(holder);}

  window.renderPlanet5=function(cnt,seed,rel,level){
    const W=512,S=256;const ps=new THREE.Scene();ps.environment=scene.environment;
    ps.add(new THREE.AmbientLight(0x9098b8,.42));
    const k=new THREE.DirectionalLight(0xfff4e6,1.25);k.position.set(5,6,8);ps.add(k);
    const rl=new THREE.DirectionalLight(0x9fc0ff,.5);rl.position.set(-6,3,-9);ps.add(rl);
    const {grp}=makePlanet5(cnt,seed);grp.rotation.set(.3,seed*.9,.1);ps.add(grp);
    if(rel){KIND[rel].add(ps,grp);addTail(ps,level||0,KIND[rel].col);}
    const cam=new THREE.PerspectiveCamera(30,1,.1,100);cam.position.set(0,.3,1).normalize().multiplyScalar((rel?3.0:1.4)/Math.tan(15*Math.PI/180));
    cam.lookAt(rel?.75:0,rel?-.75:0,0);
    const rt=new THREE.WebGLRenderTarget(W,W);const pr=renderer.getRenderTarget(),pc=renderer.getClearColor(new THREE.Color()),pa=renderer.getClearAlpha();
    const px=new Uint8Array(W*W*4);renderer.setRenderTarget(rt);renderer.setClearColor(0x0b0c14,1);renderer.clear();renderer.render(ps,cam);renderer.readRenderTargetPixels(rt,0,0,W,W,px);
    renderer.setRenderTarget(pr);renderer.setClearColor(pc,pa);rt.dispose();
    const big=document.createElement('canvas');big.width=big.height=W;const bx=big.getContext('2d');const img=bx.createImageData(W,W);
    for(let y=0;y<W;y++)img.data.set(px.subarray((W-1-y)*W*4,(W-y)*W*4),y*W*4);bx.putImageData(img,0,0);
    const c=document.createElement('canvas');c.width=c.height=S;const cx=c.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(big,0,0,S,S);return c;};
  window.rankEl5=rankEl;
})();
