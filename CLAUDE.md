# CLAUDE.md — 3차 과제: React → Next.js 마이그레이션

## 0. 이 프로젝트가 뭐냐 (한 줄)

2차 과제의 **마인크래프트 인벤토리 Todo 앱**(React+Vite, localStorage)을
**Next.js(App Router) 프론트 + FastAPI 백엔드**로 "그대로 옮기는" 마이그레이션 과제다.

- 기능/디자인은 **2차와 1:1 동일**하게 유지한다. 새 기능을 추가하는 과제가 아니다.
- 바뀌는 건 본질적으로 3가지뿐:
  1. 데이터 저장소: `localStorage` → **FastAPI + SQLite DB**
  2. 데이터 접근: 즉시 읽기 → **HTTP 요청(fetch) 왕복**
  3. 구조: `App.jsx` 한 덩어리 → **파일 기반 라우팅 + Server/Client Component 분리**

## 1. 절대 원칙 (반드시 지킬 것)

1. **2차 프로젝트(`/Users/User/Kakao/assignment2`)는 건드리지 않는다.** 읽기 전용 참고용.
2. **마이그레이션만 한다.** 기능 추가/UI 변경 금지. 2차와 동작이 달라지면 버그다.
3. **CSS 픽셀 좌표(`minecraft.css`)는 절대 수정하지 않는다.** Figma 측정값이다. 그대로 복사해 전역 import.
4. **에셋(이미지/폰트)은 `frontend/public/`에 두고** 루트 절대경로(`/assets/...`, `/fonts/...`)로 참조.
5. **순수 함수와 상태변경을 분리**한다. `computeSlotItems` 등 utils는 입력→출력만 하는 순수 함수.
6. **매직넘버 금지.** 레이아웃/제한/타이밍 수치는 `config`에 모은다 (2차 CONFIG 그대로).
7. **하드코딩 URL 금지.** 백엔드 주소는 환경변수로 (`BACKEND_URL`, `NEXT_PUBLIC_API_URL`).
8. 작업은 **미션 단위로 하나씩**. 한 번에 전부 만들지 말고 단계별 프롬프트로 진행한다.

## 2. 목표 디렉토리 구조

```
assignment3/
├── CLAUDE.md                     # 이 문서
├── frontend/                     # Next.js (App Router)
│   ├── app/
│   │   ├── api/todos/
│   │   │   ├── route.ts          # GET/POST 프록시 → FastAPI
│   │   │   └── [id]/route.ts     # PUT/DELETE 프록시 → FastAPI
│   │   ├── todos/
│   │   │   ├── [todoId]/page.tsx # Todo 수정 페이지 (2차 모달 edit 모드)
│   │   │   ├── new/page.tsx      # Todo 생성 페이지 (2차 모달 add 모드)
│   │   │   ├── error.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx          # 인벤토리 메인(목록) 페이지
│   │   ├── components/           # 2차 컴포넌트 이식 (.tsx)
│   │   ├── lib/                  # 2차 utils/constants 이식 (.ts)
│   │   │   ├── config.ts  items.ts  date.ts  slots.ts  types.ts
│   │   ├── styles/minecraft.css  # 2차 minecraft.css 그대로 복사
│   │   ├── actions.ts            # Server Actions (CRUD 로직)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx              # 루트(→ /todos 리다이렉트 정도)
│   ├── public/assets, public/fonts
│   └── .env.local
└── backend/                      # FastAPI
    ├── main.py                   # 앱+모델+스키마+CRUD 전부
    ├── requirements.txt
    ├── todos.db                  # 실행 시 자동 생성 (gitignore)
    └── .env.local
```

## 3. 데이터 모델 (2차 그대로)

```
Todo {
  id: int            # 백엔드 PK (2차는 Date.now())
  text: str          # 제목
  detail: str        # 세부 (없으면 "")
  deadline: str      # "YYYY-MM-DD" (없으면 "")
  priority: int      # 1~64 (기본 32)
  status: str        # 'active' | 'done' (기본 'active')
  item_image: str    # 아이템 PNG 파일명 (예: "diamond.png")
  slot_index: int    # 0~26 (생성 시점 빈 슬롯)
  created_at: str    # "YYYY-MM-DD" (생성 시 선택 날짜)
}
```
> 프론트 타입은 camelCase(`itemImage`, `slotIndex`, `createdAt`), DB는 snake_case.
> route.ts/actions.ts 경계에서 변환하거나, Pydantic alias로 맞춘다. (미션 3에서 결정)

## 4. 프론트 / 백엔드 역할 분리

| 기능 | 위치 | 비고 |
|---|---|---|
| Todo 저장/조회/CRUD | **백엔드** FastAPI + SQLite | localStorage 대체 |
| 슬롯 배치(`computeSlotItems`) | **프론트** | 순수 렌더 계산, DB 책임 아님 |
| 빈 슬롯/날짜 계산 | **프론트** | 생성 시 slot_index 산출 |
| 랜덤 아이템 부여 | 프론트 또는 백엔드 (미션 3-4에서 결정) | |
| 상태 필터(all/active/done) | 기본 프론트, **도전1에서 서버 쿼리** | URL 파라미터화 |
| 검색 | **백엔드** (도전2) | DB LIKE |
| 날짜 네비/주간 패널/모달/업적/토스트 | **프론트** | 순수 UI, 2차 그대로 |

## 5. 요청 흐름 (외워둘 그림)

```
생성/수정/삭제:
  브라우저(Client) → fetch('/api/todos') → route.ts(프록시) → FastAPI → SQLite → 역순 응답

목록 조회:
  Server Component/actions.ts → FastAPI(GET /todos) → 결과 렌더
```
- `route.ts` = HTTP 프록시(외부 요청 받아 FastAPI로 중계). CORS 회피 + 백엔드 주소 은닉.
- `actions.ts` = 페이지/컴포넌트에서 직접 import해 호출하는 서버 함수. 변경 후 `revalidatePath('/todos')`.

## 6. Server vs Client Component 판단 기준

- 기본 = **Server Component** (서버에서 렌더, 데이터만 보여주는 화면).
- `onClick`/`onChange`/`useState`/`useEffect`/마우스 호버 필요 → 파일 맨 위 **`"use client"`**.
- `useSearchParams()` 쓰는 컴포넌트는 **`<Suspense>`로 감싼다**.
- 예) 슬롯 호버 툴팁, 폼 입력, 필터 탭, 날짜 네비 = client / 인벤토리 배경·목록 골격 = server.

## 7. 기술 스택

| Frontend | Backend |
|---|---|
| Next.js 15+ (App Router) | FastAPI 0.111+ |
| React 18+, TypeScript 5 | Uvicorn |
| Tailwind CSS v4 (보조) + minecraft.css | SQLAlchemy 2 + SQLite |
| fetch / Server Actions | Pydantic v2 |

## 8. 미션 진행 순서 (체크리스트)

- [ ] **0** 구조 잡기: `frontend/`(create-next-app), `backend/` 분리
- [ ] **1** 프론트 세팅: TS/ESLint/Tailwind/App Router, src 디렉토리 No
- [ ] **2** 백엔드 세팅: venv + requirements + Hello World + `/docs`
- [ ] **3** FastAPI CRUD: 모델/스키마 → 앱+CORS+세션 → GET/POST/PUT/DELETE
- [ ] **4** Next 페이지: 스타일/유틸 이식 → page/new/[todoId]/loading/error, server·client 분리
- [ ] **5** 연동: route.ts(프록시) + actions.ts(Server Action) + 페이지 연결 + 업적/토스트 재현
- [ ] **6** 환경변수: 프론트/백엔드 `.env.local`, 하드코딩 제거, `.gitignore` 확인
- [ ] **도전1** 서버 필터: `?filter=active|completed` URL 파라미터 + FastAPI where
- [ ] **도전2** 서버 검색: `?search=키워드` 디바운스 + FastAPI LIKE, filter와 동시 적용

## 9. 검증 불변식 (2차와 동일하게 유지)

- 빈 제목 → "제목을 입력해주세요" / 빈 슬롯 없음 → "인벤토리가 가득 찼습니다"
- 인벤토리 가득참 판정은 **active만** 기준.
- 완료 탭에서 추가 → active 탭 자동 전환.
- 슬롯 충돌 없음: 다른 날짜의 같은 slot_index는 서로 영향 없음(날짜로 먼저 거름).
- all 탭 개수 == active 개수 + done 개수.
- 동시 알림 ≤ `MAX_ACHIEVEMENTS`(3), 초과 시 오래된 것부터 제거.
- 새로고침 후에도 데이터 유지(이제 서버에 있으므로 당연히 유지).

## 10. 완료 기준

`npm run dev`(3000) + `uvicorn main:app --reload`(8000) 동시 실행 시,
2차 앱과 **눈으로 구분 안 될 만큼 동일하게** 동작하고, 데이터가 SQLite에 영속되며,
콘솔 에러 0, 하드코딩 URL 0 이면 마이그레이션 완료.
