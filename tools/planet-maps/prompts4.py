# [2026-09-19] 4분할·3분할 지도 — "행성이 곧 나": 나(일간 오행) 한 지역 + 환경(나머지 오행) 지역을 같은 크기로.
# 사용자가 시험 3장(su__hwa-to-geum · geum__mok-hwa-to · mok__hwa-to-su)의 화풍을 확정 → 같은 틀을 그대로 쓴다.
# 이름: {나}__{환경…} (환경은 목·화·토·금수 순). 4분할 = 환경 3개(5×4=20장), 3분할 = 환경 2개(5×6=30장).
# 환경이 1개뿐인 사람(무작위 2만 명 모의: 시각 있음 0.8% · 모름 4.3%)은 기존 두 오행 지도(map/)를 쓴다.
import itertools,json
exec(open('prompts.py',encoding='utf-8').read().split('jobs=[]')[0])  # ORDER · D · BASE · neg 재사용
N={3:('three','about one third each'),4:('four','about 25 percent each')}
jobs=[]
for me in ORDER:
    rest=[k for k in ORDER if k!=me]
    for n in (3,2):
        for env in itertools.combinations(rest,n):
            parts=(me,)+env; word,share=N[len(parts)]
            body=(f'The surface is divided into {word} large natural regions of roughly equal size, {share}: '
                  +'; '.join(D[k] for k in parts)+'. Each region is one connected landmass or sea, not scattered.')
            jobs.append((f"{me}__{'-'.join(env)}",BASE.format(c=body)+neg(parts)))
json.dump(jobs,open('jobs4.json','w',encoding='utf-8'),indent=0,ensure_ascii=False)
print(len(jobs))
