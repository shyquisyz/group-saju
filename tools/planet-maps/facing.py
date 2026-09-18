# 지도마다 초상에서 보일 방향(경도)을 고른다: 보이는 반구에서 주 오행이 가장 넓고, 보조 오행도 보이게.
import numpy as np, json
from PIL import Image
EL=['mok','hwa','to','geum','su']
def classify(a,geum=True):
    # [2026-09-18 G3] 금 = 백랍색(채도 <.2, 밝기 중간). 이전 흰 금속 규칙(채도<.18·밝기>=110)은 새 금을 못 잡는다.
    # 금이 없는 지도에서는 금 규칙을 끈다 — 화의 회색빛 지각이 금으로 잡히지 않게.
    r,g,b=a[...,0],a[...,1],a[...,2]; mx=a.max(-1); mn=a.min(-1); sat=(mx-mn)/(mx+1)
    lava=(r-b>195)&(b<24)
    c=np.full(r.shape,-1)
    c[(b>r+15)&(b>=g-10)]=4                      # 수
    c[(g>r+5)&(g>b+5)]=0                          # 목
    c[(r>140)&(r>g+30)&(b<120)&~lava&(mx>150)]=2  # 토(밝은 주황)
    metal=(sat<.3)&(mx>=55)&((r-b)<50)&(c!=4)&(c!=0)&~lava if geum else np.zeros(r.shape,bool)
    c[((mx<95)|lava)&(c!=4)&(c!=0)&~metal]=1      # 화(어두운 지각·용암)
    c[metal]=3                                    # 금(백랍색)
    return c
res={};rep=[]
for k in [k for k,_ in json.load(open('jobs.json'))]:
    a=np.asarray(Image.open(f'serve/map/{k}.jpg').convert('RGB').resize((256,128))).astype(int)
    c=classify(a,'geum' in k.split('-')); H,W=c.shape
    lat=(np.arange(H)+.5)/H*np.pi-np.pi/2; lon=(np.arange(W)+.5)/W*2*np.pi
    tot={e:float(((c==i)*np.cos(lat)[:,None]).sum()) for i,e in enumerate(EL)}
    s=sum(tot.values()) or 1
    want=k.split('-')
    best=None
    for d in range(0,360,10):
        L=np.radians(d)
        # 카메라가 보는 반구: 경도 L, 위도 약 17도(카메라 높이 .3) 중심
        v=np.cos(lat)[:,None]*np.cos(lon[None,:]-L)*np.cos(.29)+np.sin(lat)[:,None]*np.sin(.29)
        w=np.clip(v,0,None)*np.cos(lat)[:,None]*0+np.clip(v,0,None)  # 화면 면적 ∝ 법선·시선
        fr={e:float((w*(c==i)).sum()/w.sum()) for i,e in enumerate(EL)}
        main=fr[want[0]]; others=[fr[e] for e in want[1:]]
        ok=all(main>=o for o in others)
        score=(2 if ok else 0)+(3*min(min(others),.2)+1.5*min(max(others),.25) if others else 0)+0.5*main
        if best is None or score>best[0]: best=(score,d,fr)
    res[k]={'lon':best[1]}
    rep.append((k,best[1],{e:round(best[2][e]*100) for e in EL},{e:round(tot[e]/s*100) for e in EL}))
json.dump(res,open('serve/facing.json','w'))
for r in rep: print(r[0].ljust(14),'lon',str(r[1]).rjust(3),'보이는면',r[2],' 전체',r[3])
