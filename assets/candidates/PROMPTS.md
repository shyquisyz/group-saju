# 배경 아트 후보 — 생성 프롬프트

[2026-08-30] 생성 도구 Magnific MCP · 모델 `recraft-v4-1` · 각 프롬프트 1장씩 6회.

**왜 이 파일을 남기나.** 결과물(`.jpg`)만 있으면 다음 세션이 "이 그림이 어디서 왔고
왜 이 모양인가"를 확인할 방법이 없다. `tools/gen-solar-terms.mjs`를 남기는 것과 같은 이유다.

**모델을 이걸로 고른 이유.** 요구 비율이 카드 4:5(1080×1350)·OG 2:1(1200×630)인데,
`recraft-v4-1`이 그 둘을 **정확히** 지원하는 유일한 추천 모델이었다(기본 모델
`seedream-5-pro`에는 4:5도 2:1도 없어 3:4/16:9에서 더 크게 잘라내야 했다).
그래도 실제 출력은 896×1152 · 1536×768이라 중앙 크롭이 필요했다 — 아래 "크기" 참고.

**공통 조건** — 어두운 우주·은하·성운 / 항성 하나와 행성들 / 글자·워터마크 없음 /
앱 톤 `#11121d` 계열 / 타사 상표·캐릭터·특정 작가 이름 금지(라이선스 보호).
프롬프트 끝의 `No text, no letters, …` 줄이 그 금지를 담당한다.

**크기** — 생성 원본은 카드 896×1152, OG 1536×768이다. 요구 비율(0.800 / 1.905)과 달라
**중앙 크롭 후 축소**했다. 원본은 `*-src.png`로 남겨 뒀다.

| 후보 | 원본 | 크롭 | 최종 |
|---|---|---|---|
| card-a · b · c | 896 × 1152 | 896 × 1120 | 1080 × 1350 |
| og-a · b · c | 1536 × 768 | 1463 × 768 | 1200 × 630 |

---

## card-a.jpg — 세로 4:5 · **현재 `card-bg.jpg`로 적용**

> Vertical deep-space background art. A near-black deep navy void (hex #11121d) filling most
> of the frame. One warm golden-white star burns in the upper right with a soft wide halo and
> faint diffraction glow. Three small dark planets of different sizes drift across the lower
> half, each catching a thin crescent rim of light from that single star. Faint indigo and
> violet nebula clouds with soft dust lanes stretch diagonally behind them. Fine scattered
> starfield, subtle depth haze. Generous empty negative space on the left side and along the
> bottom. Painterly astronomical illustration, cinematic, very dark and calm, high detail.
> No text, no letters, no numbers, no watermark, no logo, no signature, no people, no spacecraft.

왼쪽 위를 비워 달라고 적은 이유는 **카드 제목과 관계 두 줄이 거기 들어가기 때문**이다.

## card-b.jpg — 세로 4:5

> Vertical cosmic background. A vast dark indigo nebula seen from deep space, colors limited
> to deep navy #11121d, midnight blue and muted violet with a single restrained warm gold
> accent. One distant sun sits small and bright near the top center, its light raking across
> two large planets low in the frame so only their curved edges glow. Long soft dust lanes,
> molecular cloud texture, thousands of tiny stars at varying brightness. Overall exposure
> very low, moody, quiet, plenty of unbroken dark space in the middle for breathing room.
> Astrophotography-inspired painting, ultra fine grain, high dynamic range.
> No text, no letters, no watermark, no logo, no signature, no people.

## card-c.jpg — 세로 4:5

> Vertical minimal astronomical illustration on a near-black deep navy field (#11121d).
> At the upper right, a single luminous pale-gold star with a clean soft bloom. Around it,
> faint thin elliptical orbit rings drawn in barely visible blue-grey, with four tiny planets
> sitting on those rings at different distances. The lower two thirds are almost pure dark
> space with only sparse dust and a very soft violet nebula wash near the bottom edge.
> Elegant, restrained, lots of empty darkness, flat graphic depth rather than photographic.
> No text, no letters, no numbers, no watermark, no logo, no signature, no people.

---

## og-a.jpg — 가로 2:1

> Wide horizontal deep-space banner art. A near-black deep navy void (hex #11121d) across the
> frame. One warm golden star glows on the right third with a soft wide halo, and five small
> planets of varying size are scattered to the left of it, each showing a thin crescent of
> light on the edge facing the star. Faint indigo and violet nebula clouds sweep horizontally
> behind them with soft dust lanes. Dense fine starfield, subtle depth haze, generous dark
> negative space on the left. Painterly astronomical illustration, cinematic, very dark and calm.
> No text, no letters, no numbers, no watermark, no logo, no signature, no people, no spacecraft.

**제외.** 모델이 "banner"를 그림의 소재로 받아 **상하에 레터박스 검은 띠와 그 이음새를
그려 넣었다.** 그림 안에 들어간 것이라 크롭으로 지울 수 없다 — 잘라내면 별과 행성이
같이 날아간다. 다음에 가로 그림을 만들 때 `banner`라는 낱말은 쓰지 말 것.

## og-b.jpg — 가로 2:1

> Wide horizontal cosmic panorama. A vast dark indigo and midnight-blue nebula seen from deep
> space, base tone deep navy #11121d, with one restrained warm gold accent. A single small
> brilliant sun sits slightly right of center, raking light across three planets spread along
> the horizontal axis so only their curved rims catch the glow. Long soft dust lanes, molecular
> cloud texture, thousands of tiny stars at varying brightness, very low overall exposure,
> moody and quiet. Astrophotography-inspired painting, ultra fine grain, high dynamic range.
> No text, no letters, no watermark, no logo, no signature, no people.

작은 미리보기에서 가장 잘 읽히지만 톤이 앱보다 밝고 청록 쪽이다(평균 `#142028`).

## og-c.jpg — 가로 2:1 · **현재 `../og-image.jpg`로 적용**

> Wide horizontal minimal astronomical illustration on a near-black deep navy field (#11121d).
> A single luminous pale-gold star sits left of center with a clean soft bloom. Faint thin
> elliptical orbit rings in barely visible blue-grey fan out to the right, with five tiny
> planets resting on those rings at different distances, suggesting a small solar system.
> The rest is almost pure dark space with sparse dust and a very soft violet nebula wash along
> the bottom edge. Elegant, restrained, lots of empty darkness, graphic and calm rather than
> photographic. No text, no letters, no numbers, no watermark, no logo, no signature, no people.

**고른 이유.** 톤이 목표에 가장 가깝고(평균 `#0a0f1b`), **앱이 실제로 그리는 화면과 같은
어휘**를 쓴다 — 항성 하나에 얇은 궤도 고리와 그 위의 행성들. 직전 `og-image.jpg`는 앱
화면을 그대로 갈무리한 것이었는데 같은 구도를 더 또렷하게 그린 셈이다.
