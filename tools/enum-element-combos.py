# [2026-09-17 U3] 오행 조합 경우의 수 — 겉 8글자(sajuElements) 기준, 60갑자×월(五虎遁)×일×시(五鼠遁) 전수(518,400)
# 실행: python tools/enum-element-combos.py  (앱은 읽지 않음)
from collections import Counter, defaultdict
SE=['mok','mok','hwa','hwa','to','to','geum','geum','su','su']
BE=['su','to','mok','mok','to','hwa','hwa','to','geum','geum','to','su']
ORDER=['mok','hwa','to','geum','su']
KO={'mok':'목','hwa':'화','to':'토','geum':'금','su':'수'}
pillars=[(i%10,i%12) for i in range(60)]
def month_pillars(ys):  # 五虎遁: 寅월 천간
    s0=[2,4,6,8,0][ys%5]
    return [((s0+k)%10,(2+k)%12) for k in range(12)]
def hour_pillars(ds):   # 五鼠遁: 子시 천간
    s0=[0,2,4,6,8][ds%5]
    return [((s0+k)%10,k) for k in range(12)]
def run(with_hour):
    shapes=Counter(); tri=Counter(); npresent=Counter(); maxc=Counter(); pure=Counter(); tie=0; tot=0
    sets=Counter()
    for y in pillars:
        for m in month_pillars(y[0]):
            for d in pillars:
                hs=hour_pillars(d[0]) if with_hour else [None]
                for h in hs:
                    c=dict.fromkeys(ORDER,0)
                    for p in (y,m,d,h):
                        if p is None: continue
                        c[SE[p[0]]]+=1; c[BE[p[1]]]+=1
                    r=sorted([k for k in ORDER if c[k]>0],key=lambda k:(-c[k],ORDER.index(k)))
                    tot+=1
                    top=r[:3]
                    tri[tuple(top)]+=1
                    npresent[len(r)]+=1
                    shapes[tuple(sorted(c.values(),reverse=True))]+=1
                    for k in ORDER: maxc[(k,c[k])]+=1
                    if len(r)>=2 and c[r[0]]==c[r[1]]: tie+=1
                    sets[(r[0],frozenset(r[1:3]))]+=1
    return dict(tot=tot,tri=tri,npresent=npresent,shapes=shapes,maxc=maxc,tie=tie,sets=sets)

for wh in (True,False):
    R=run(wh); T=R['tot']
    print('\n=====',('8글자(시 앎)' if wh else '6글자(시 모름)'),'조합 수',T)
    print('있는 오행 가짓수:',{k:f'{v/T*100:.2f}%' for k,v in sorted(R['npresent'].items())})
    print('1위 동점 비율: %.1f%%'%(R['tie']/T*100))
    print('오행별 최대 개수:',{KO[k]:max(n for (kk,n),v in R['maxc'].items() if kk==k and v) for k in ORDER})
    print('모양(개수 분포) 상위:')
    for s,v in R['shapes'].most_common(): print('  ',s,f'{v/T*100:.2f}%')
    print('순서 있는 상위3 조합 수:',len(R['tri']),' 주오행+보조집합 조합 수:',len(R['sets']))
    by=defaultdict(int)
    for t,v in R['tri'].items(): by[len(t)]+=1
    print('  길이별:',dict(by))
    print('주오행별 비율:',{KO[k]:f"{sum(v for t,v in R['tri'].items() if t[0]==k)/T*100:.1f}%" for k in ORDER})
    if wh:
        rows=sorted(R['tri'].items(),key=lambda x:-x[1])
        open('tri8.txt','w',encoding='utf-8').write('\n'.join(f"{'>'.join(KO[k] for k in t)}\t{v/T*100:.3f}%" for t,v in rows))
        rows=sorted(R['sets'].items(),key=lambda x:-x[1])
        open('sets8.txt','w',encoding='utf-8').write('\n'.join(f"{KO[a]} 주 + {'·'.join(KO[k] for k in ORDER if k in s) or '없음'}\t{v/T*100:.3f}%" for (a,s),v in rows))
