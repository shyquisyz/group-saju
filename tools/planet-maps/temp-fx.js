let TEMP='';
function spriteTex(kind){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);
  if(kind==='snow'){g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(215,235,255,.8)');g.addColorStop(1,'rgba(200,225,255,0)');}
  else{g.addColorStop(0,'rgba(255,245,200,1)');g.addColorStop(.3,'rgba(255,150,40,.9)');g.addColorStop(1,'rgba(255,80,0,0)');}
  x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
const SPR={snow:spriteTex('snow'),ember:spriteTex('ember')};
function fresnelMesh(r,col,pow,alpha,side,blend){return new THREE.Mesh(new THREE.SphereGeometry(r,64,48),new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color(col)}},
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 c;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(vN,vV)),'+pow.toFixed(2)+');gl_FragColor=vec4(c,f*'+alpha.toFixed(2)+');}',
  side:side,transparent:true,blending:blend,depthWrite:false}));}
function glowMesh(r,col,alpha){return new THREE.Mesh(new THREE.SphereGeometry(r,64,48),new THREE.ShaderMaterial({uniforms:{c:{value:new THREE.Color(col)}},
  vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 c;varying vec3 vN;varying vec3 vV;void main(){float d=abs(dot(vN,vV));float f=pow(d,2.2);gl_FragColor=vec4(c*f,f*'+alpha.toFixed(2)+');}',
  side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));}
function tintMesh(col,alpha,blend){return new THREE.Mesh(new THREE.SphereGeometry(1.003,64,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:alpha,blending:blend,depthWrite:false}));}
function addTemp(ps){if(!TEMP)return;const cold=TEMP==='cold';
  // 바깥 대기(가장자리 빛)
  ps.add(glowMesh(1.16,cold?0x8fcaff:0xff7a2a,cold?1.1:1.2));
  ps.add(cold?tintMesh(0x9cc4ff,.16,THREE.NormalBlending):tintMesh(0xff6a10,.10,THREE.AdditiveBlending));
  // 표면 가장자리: 차가움=서리 낀 흰 테, 뜨거움=달아오른 주황 테
  ps.add(fresnelMesh(1.004,cold?0xe8f4ff:0xff7a20,cold?2.6:3.0,cold?.75:.55,THREE.FrontSide,cold?THREE.NormalBlending:THREE.AdditiveBlending));
  // 입자: 눈송이(사방) / 불티(위로)
  const n=cold?90:80,arr=new Float32Array(n*3);let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<n;i++){const u=rnd()*2-1,t=rnd()*Math.PI*2,q=Math.sqrt(1-u*u);const r=1.05+Math.pow(rnd(),1.5)*(cold?.32:.4);
    let x=q*Math.cos(t)*r,y=u*r,z=q*Math.sin(t)*r;if(!cold){y=Math.abs(y)*.9+.1;x*=.9;}arr.set([x,y,z],i*3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
  ps.add(new THREE.Points(g,new THREE.PointsMaterial({map:SPR[cold?'snow':'ember'],size:cold?.11:.09,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:cold?.9:1})));}
