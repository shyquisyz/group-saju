# [2026-09-19] 조화 시험 — 사용자 "행성에 표기된 오행 넷을 표현함에 있어 전체가 조화롭지 못하다".
# 4분할 지도(prompts4.py)는 네 구역이 반듯하게 나뉘고 색이 따로 놀아 "네 장을 이어 붙인" 느낌이었다.
# 바꾼 것: 하나의 세계 · 통일된 색조 · 나 지역 = 가장 큰 한 덩어리(시험 40% → 본생성 50%, 사용자 확정) · 나머지는 실제 지형처럼 얽힘 ·
#          지형끼리 이어지는 장면(쌍마다 한 구절) · 직선/사분면 금지. 없는 오행 금지 문구는 prompts.py 그대로.
import itertools,json,sys
exec(open('prompts.py',encoding='utf-8').read().split('jobs=[]')[0])  # ORDER · D · neg 재사용
LINK={frozenset(('hwa','to')):'cooled lava fields and glowing fissures spill into the edges of the desert',
      frozenset(('mok','su')):'forest grows along the coastlines and river valleys',
      frozenset(('geum','to')):'silver crystal rock ridges rise out of the desert',
      frozenset(('hwa','geum')):'glowing lava veins run between the crystal rock ridges',
      frozenset(('su','to')):'sandy desert shores meet the turquoise shallows',
      frozenset(('su','hwa')):'black volcanic islands and steaming coasts where lava meets the sea',
      frozenset(('mok','to')):'the forest thins into dry savanna at the desert edge',
      frozenset(('mok','hwa')):'charred forest edges border the volcanic crust',
      frozenset(('geum','su')):'crystal cliffs drop into the sea',
      frozenset(('mok','geum')):'forest climbs the lower slopes of the crystal mountains'}
BASE5=('Equirectangular 2:1 texture map for wrapping a sphere (full planet surface, longitude across, latitude down, left and right edges continuous). '
 'Stylized miniature diorama planet: one cohesive, harmonious natural world with a unified color palette and a consistent art style. {c} '
 'Irregular organic coastlines and borders with gradual transitions and shared earthy ground tones between terrains; no straight or hard borders, no quadrants, no patchwork. '
 'Top-down albedo only, even soft lighting, no stars, no text, no border, no grid.')
def prompt(me,env):
    share='about 17 percent each' if len(env)==3 else 'about 25 percent each'  # [본생성] 나 50%
    links='; '.join(LINK[frozenset(p)] for p in itertools.combinations((me,)+env,2))
    c=(f'The largest feature, about half of the surface, is one connected region of {D[me]}. '
       f'The other terrains, {share}, are ' + '; '.join(D[e] for e in env) +
       f'. They interlock naturally with it like real geography: {links}.')
    return BASE5.format(c=c)+neg((me,)+env)
def jobs():
    out=[]
    for me in ORDER:
        rest=[k for k in ORDER if k!=me]
        for n in (3,2):
            for env in itertools.combinations(rest,n):out.append((f"{me}__{'-'.join(env)}",prompt(me,env)))
    return out
if __name__=='__main__' and len(sys.argv)>1 and sys.argv[1]=='--jobs':
    json.dump(jobs(),open('jobs5.json','w',encoding='utf-8'),indent=0,ensure_ascii=False);print(len(jobs()));sys.exit()
if __name__=='__main__':
    for k in sys.argv[1:]:
        me,env=k.split('__');print(k);print(prompt(me,tuple(env.split('-'))));print()
