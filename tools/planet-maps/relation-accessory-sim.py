import random, itertools
from collections import Counter
YUK={frozenset(p) for p in [(0,1),(2,11),(3,10),(4,9),(5,8),(6,7)]}
CHU={frozenset(p) for p in [(0,6),(1,7),(2,8),(3,9),(4,10),(5,11)]}
GAN={frozenset(p) for p in [(0,5),(1,6),(2,7),(3,8),(4,9)]}
def hc(a,b):  # 앱과 같은 우선순위 충 > 천간합 > 육합
    if frozenset((a[1],b[1])) in CHU: return 'chung'
    if frozenset((a[0],b[0])) in GAN: return 'ganhap'
    if frozenset((a[1],b[1])) in YUK: return 'yukhap'
    return None
def haps(a,b): return (frozenset((a[0],b[0])) in GAN) + (frozenset((a[1],b[1])) in YUK)
G60=[(i%10,i%12) for i in range(60)]
def person(): return [random.choice(G60) for _ in range(4)]  # 년 월 일 시 (근사: 독립 균등)
random.seed(1);N=200000
A=Counter();B=Counter()
for _ in range(N):
    p,q=person(),person()
    day=hc(p[2],q[2]); others=[hc(p[i],q[i]) for i in (0,1,3)]
    ochung='chung' in others; ohap=any(o in('ganhap','yukhap') for o in others)
    tian=(frozenset((p[2][0],q[2][0])) in GAN) and (frozenset((p[2][1],q[2][1])) in YUK)
    # 안 A: 일주만
    A[day or 'none']+=1
    # 안 B: 일주 우선 + 사다리
    if day=='chung': k='태풍' if ochung else '번개구름'
    elif tian: k='오로라(천지합)'
    elif day=='ganhap': k='무지개 고리'
    elif day=='yukhap': k='토성 고리'
    else: k='없음'
    B[k]+=1
    nh=sum(haps(p[i],q[i]) for i in range(4))
    B['(별똥별: 합 %d개)'%nh if nh>=2 else '(별똥별 없음)']+=1
pr=lambda C:[print(f'  {k}: {v/N*100:.1f}%') for k,v in sorted(C.items(),key=lambda x:-x[1])]
print('일주 합충(앱 딱지 그대로)');pr(A);print('안 B');pr(B)
# 안 C: 자리(일/년월시)와 겹침 수로 사다리. 구름칸 1개 + 고리칸 1개 + 오로라 + 별똥별
C=Counter();deco=0;cnt_items=Counter()
random.seed(2)
for _ in range(N):
    p,q=person(),person()
    k=[hc(p[i],q[i]) for i in range(4)]; day=k[2]; oth=[k[0],k[1],k[3]]
    nch=k.count('chung')
    tian=(frozenset((p[2][0],q[2][0])) in GAN) and (frozenset((p[2][1],q[2][1])) in YUK)
    items=[]
    if nch>=2: items.append('태풍')
    elif day=='chung': items.append('번개구름')
    elif 'chung' in oth: items.append('먹구름')
    if tian: items.append('오로라')
    elif day=='ganhap': items.append('무지개고리')
    elif day=='yukhap': items.append('토성고리')
    elif day is None and any(o in('ganhap','yukhap') for o in oth) and not items: items.append('흰구름')
    nh=sum(haps(p[i],q[i]) for i in range(4))
    if nh>=2: items.append('별똥별%d'%min(nh,5))
    for it in items: cnt_items[it.rstrip('0123456789')]+=1
    C[len(items)]+=1
print('안 C 장신구 개수 분포');pr(C);print('안 C 항목별 등장률');pr(cnt_items)
# 안 D: 일주 딱지가 있는 사람 위주 + 날 외 자리는 '겹칠 때만'
D=Counter();Di=Counter();random.seed(3)
for _ in range(N):
    p,q=person(),person()
    k=[hc(p[i],q[i]) for i in range(4)]; day=k[2]; oth=[k[0],k[1],k[3]]
    och=oth.count('chung'); ohap=sum(o in('ganhap','yukhap') for o in oth)
    tian=(frozenset((p[2][0],q[2][0])) in GAN) and (frozenset((p[2][1],q[2][1])) in YUK)
    nh=sum(haps(p[i],q[i]) for i in range(4))
    items=[]
    if day=='chung': items.append('태풍' if och>=2 else '번개구름' if och==1 else '먹구름')
    elif tian: items.append('오로라')
    elif day=='ganhap': items.append('무지개고리')
    elif day=='yukhap': items.append('토성고리')
    elif day is None and ohap>=2: items.append('흰구름')
    if day in('ganhap','yukhap') and nh>=2: items.append('별똥별')
    for it in items: Di[it]+=1
    D[len(items)]+=1
print('안 D 장신구 개수 분포');pr(D);print('안 D 항목별');pr(Di)
