# 마인크래프트 인벤토리 Todo — Next.js + FastAPI 마이그레이션

2차 과제(React + Vite, `localStorage`)였던 마인크래프트 인벤토리 Todo 앱을 **Next.js(App Router) 프론트 + FastAPI 백엔드**로 그대로 옮긴 3차 과제입니다. 기능과 디자인은 2차와 동일하며, 바뀐 건 데이터 저장소(`localStorage` → FastAPI + SQLite)와 구조(App Router, Server/Client Component 분리)뿐입니다.

## 폴더 구조

```
assignment3/
├── frontend/        # Next.js App Router
│   ├── app/
│   │   ├── api/todos/        # FastAPI로 프록시하는 Route Handler
│   │   ├── todos/            # 목록(/todos), 생성(/todos/new), 수정(/todos/[todoId])
│   │   ├── components/       # 2차 컴포넌트 1:1 이식
│   │   ├── lib/               # config/items/date/slots/types (2차 utils/constants 이식)
│   │   ├── styles/minecraft.css  # 2차 minecraft.css 그대로 복사 (픽셀 좌표 미수정)
│   │   └── actions.ts        # Server Action (목록 조회)
│   └── public/assets, public/fonts
└── backend/          # FastAPI
    ├── main.py        # 모델 + 스키마 + CRUD 엔드포인트
    └── requirements.txt
```

## 실행 방법

### backend (FastAPI, :8000)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### frontend (Next.js, :3000)

```bash
cd frontend
npm install
npm run dev
```

두 서버를 모두 띄운 뒤 `http://localhost:3000/todos`로 접속하면 됩니다. API 문서는 `http://localhost:8000/docs`에서 확인할 수 있습니다.

## 환경변수

각 디렉토리에 `.env.local`을 만들고(git에는 커밋되지 않습니다) 아래 값을 채워주세요.

**`backend/.env.local`**

```
DATABASE_URL=sqlite:///./todos.db
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`**

```
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

| 변수 | 위치 | 용도 |
|---|---|---|
| `DATABASE_URL` | backend | SQLite 연결 문자열 |
| `FRONTEND_URL` | backend | CORS 허용 origin |
| `BACKEND_URL` | frontend (서버 전용) | Server Component/Route Handler가 FastAPI를 호출하는 주소 |
| `NEXT_PUBLIC_API_URL` | frontend (클라이언트) | 클라이언트 컴포넌트가 직접 fetch하는 Next.js API 베이스 주소 |

## 2차 과제 대비 변경점

2차 과제 피드백 2건을 이번엔 구조적으로 해결했습니다.

1. **Todo `id` 발급 방식** — 2차는 `Date.now()`로 프론트에서 직접 id를 만들어 고유성이 보장되지 않았습니다. 3차는 `TodoCreate` 스키마에 `id` 필드 자체가 없어서 프론트가 id를 보낼 방법이 없고, 백엔드 DB의 auto-increment Primary Key로만 발급됩니다.
2. **README 부실** — 2차는 Vite 기본 템플릿 문구가 그대로 남아 있었습니다. 이 문서가 그 피드백을 반영한 결과물입니다.
3. **데이터 저장소** — `localStorage` → FastAPI + SQLite. 새로고침/재배포와 무관하게 데이터가 서버에 영속됩니다.
4. **구조** — 단일 `App.jsx` → Next.js 파일 기반 라우팅(`/todos`, `/todos/new`, `/todos/[todoId]`) + Server/Client Component 분리. 2차의 모달 오버레이는 별도 라우트가 되면서, 날짜/필터/검색 상태는 URL 쿼리 파라미터로 페이지 간에 전달됩니다.

## 구현 미션 체크리스트

- [x] 전체 구조 잡기 (frontend/backend 분리)
- [x] 프론트엔드 세팅 (Next.js + TS + Tailwind)
- [x] 백엔드 세팅 (FastAPI + venv)
- [x] FastAPI Todo CRUD 구현
- [x] Next.js Todo 페이지 구현 (목록/생성/수정/loading/error)
- [x] API Route + Server Action 연동
- [x] 환경변수 분리
- [x] 도전1: 서버 기반 상태별 필터링 (`?filter=`)
- [x] 도전2: 서버 기반 Todo 검색 (`?search=`)

자세한 작업 단계별 기록과 AI 활용 내역은 [`SUBMISSION.md`](./SUBMISSION.md)를 참고하세요.
