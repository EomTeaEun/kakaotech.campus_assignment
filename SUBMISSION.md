## 과제 목표

이번 과제를 통해 무엇을 배우고자 했는지 간단하게 작성해요.

* React(Vite) 구조를 Next.js App Router로 옮기면서 파일 기반 라우팅과 Server/Client Component 구분을 직접 느껴기

* localStorage 기반 상태 관리에서 FastAPI + SQLite 서버 기반 데이터 흐름으로 바뀌었을 때 뭐가 달라지는지 이해하기

* 2차 과제 때 피드백(id 고유성, README 없음) 받은 부분을 채우기

* AI 한테 끌려가지 않고, 미션 단위로 직접 끊어서 단계별로 진행하기

* 새 기능을 추가하는 게 아니라 "그대로 옮기기"

## 과제 위치

* 브랜치명 : `week-03-eomtaeeun`

* 주요 파일 :

* `frontend/app/` (page.tsx, todos/*, api/todos/*, actions.ts, components/*, lib/*)

* `backend/main.py`

* `CLAUDE.md`, `MIGRATION_PROMPTS.md`

* 사용한 도구 : vs code, claude code

## 구현한 기능

기본 미션 중 구현한 항목에 체크해요.

* [x] 전체 구조 잡기 (frontend/backend 분리)

* [x] 프론트엔드 세팅 (Next.js + TS + Tailwind)

* [x] 백엔드 세팅 (FastAPI + venv)

* [x] FastAPI Todo CRUD 구현

* [x] Next.js Todo 페이지 구현 (목록/생성/수정/loading/error)

* [x] API Route + Server Action 연동

* [x] 환경변수 분리

## 도전 기능

도전 미션 구현을 시도했다면 구현 항목에 체크해요.

* [x] 서버 기반 상태별 필터링 (`?filter=`)

* [x] 서버 기반 Todo 검색 (`?search=`)

## 추가 기능

개인적으로 넣고 싶어서 만든 추가 기능입니다.

* 완료 알림(AchievementBar) 기능

## AI 활용 내역

  먼저 `CLAUDE.md`에 전체 구조(목표 디렉토리, 데이터 모델, 프론트/백엔드 역할 분리표, Server/Client 판단 기준, 검증 불변식)를 미리 정리해두고 클로드에게 그걸 기준으로 따라가게 했다. 저번과 동일하게 전체적인 plan 을 주고 단계별 프롬프트 작업과 병행 하였다.

프롬프트 내용과 claude.md 내용도 AI 의 도움을 받았다.
react 를 공부하고 있긴 하지만 각각의 개념정도와 코드 예시만 보고 읽을 정도지 
실제 프로젝트에 적용시키는 건 아직도 감이 하나도 오지 않아 프로젝트 설계도 클로드와 깊은 대화를 나누며 진행하였다. 

### 0단계 — 맥락 전달

```

이 저장소의 CLAUDE.md를 먼저 정독해줘. 우리는 2차 과제

(/Users/User/Kakao/assignment2, React+Vite, localStorage)의 마인크래프트

인벤토리 Todo 앱을 frontend/(Next.js App Router) + backend/(FastAPI)로

마이그레이션한다. 앞으로 내가 단계별로 기능을 요청할 거고, 너는 매 단계마다

CLAUDE.md의 절대 원칙 / 디렉토리 구조 / 데이터 모델 / 역할 분리표 /

Server·Client Component 판단 기준 / 검증 불변식을 그대로 따라야 한다.

지금은 코드를 작성하지 말고, CLAUDE.md를 읽고 전체 구조를 이해했으면

'준비됐어'라고만 답해줘. 마이그레이션 시 우려되는 점이나 빠진 정보가

있으면 질문해줘.

```

이번엔 0~2단계(전체 구조, 프론트 세팅, 백엔드 세팅)는 AI 없이 직접 진행했다. 가이드에 나온 명령어(`create-next-app`, `venv` + `uvicorn`)만 따라가면 되는 부분이라 굳이 AI를 거치지 않고 손으로 하면서 Next.js 프로젝트 구조 자체를 눈으로 먼저 익혔다.

### 프롬프트 1 - FastAPI Todo CRUD 구현

```
[3단계: FastAPI로 Todo CRUD API 구현하기]

기대 결과: `localhost:8000/docs`에서 모든 엔드포인트가 보이고, Todo를 생성/조회/수정/삭제할 수 있다.

작업:

1. `backend/main.py`에 SQLAlchemy + SQLite(`todos.db`)로 Todo 모델을 정의한다. 필드는 `CLAUDE.md` 3절 데이터 모델 그대로: `id`(PK, autoincrement), `text`, `detail`, `deadline`, `priority`(1~64, 기본 32), `status`('active'|'done', 기본 'active'), `item_image`, `slot_index`(0~26), `created_at`.

2. **id는 DB의 auto-increment PK로만 발급한다.** 프론트가 id를 보내거나 생성하지 않도록 `TodoCreate` 스키마에 `id` 필드를 넣지 않는다. (2차 과제 피드백: `Date.now()` 기반 id는 고유성이 보장되지 않으므로, 이번엔 PK로 명확히 해결한다.)

3. Pydantic 스키마는 `TodoCreate`, `TodoUpdate`, `TodoResponse`로 분리한다. DB는 snake_case, 응답은 camelCase(`itemImage`, `slotIndex`, `createdAt`)로 나가도록 alias 처리한다.

4. CORS는 `http://localhost:3000`만 허용한다.

5. DB 세션은 `get_db` 의존성으로 분리한다.

6. 엔드포인트: `GET /todos`, `POST /todos`, `PUT /todos/{id}`, `DELETE /todos/{id}`.

7. `DATABASE_URL`은 `.env.local`에서 읽어오게 한다. 하드코딩 금지.

검증 기준:

- `/docs`에서 4개 엔드포인트가 모두 보인다.

- Todo 생성 시 응답 id가 매번 다른 값으로 자동 발급된다(직접 지정 불가능함을 확인).

- 생성 → 목록 조회 시 방금 만든 데이터가 포함된다.

- 수정/삭제 후 목록이 정확히 반영된다.

- `backend/todos.db` 파일이 생성된다.

끝나면 검증 결과 체크리스트 + `/docs`에서 확인하는 방법을 알려줘.

```

2차 과제 피드백에서 `id: Date.now()`를 수정하는게 좋다 하셔서 3차에선 어차피 데이터가 DB로 넘어가니까 id 를 pk 로 만들었다. 

### 프롬프트2 - Next.js 페이지 구현 (스타일/유틸 이식)

```
[4단계: Next.js에서 Todo 페이지 구현하기]

기대 결과: 더미 데이터로라도 2차와 동일한 화면이 `/todos`, `/todos/new`, `/todos/[todoId]`에서 보인다.

작업:

1. `/Users/User/Kakao/assignment2`의 `src/styles/minecraft.css`를 `frontend/app/styles/minecraft.css`로 그대로 복사(픽셀 좌표 수정 금지)하고 전역 import한다.

2. `src/constants/config.js`, `items.js` → `frontend/app/lib/config.ts`, `items.ts`로 타입만 추가해 이식(매직넘버 그대로 유지).

3. `src/utils/date.js`, `slots.js` → `frontend/app/lib/date.ts`, `slots.ts`로 이식. `computeSlotItems` 등은 순수 함수 그대로 유지.

4. Todo 관련 타입은 `frontend/app/lib/types.ts`에 정의한다. **id는 number(PK) 타입으로 명시하고 프론트에서 생성하지 않는다는 걸 타입 주석 없이도 알 수 있게 생성 폼 타입에서 id를 제외한다.**

5. `src/components/*.jsx` 9개를 `frontend/app/components/*.tsx`로 이식한다.

6. `public/assets`, `public/fonts`는 `frontend/public/`에 두고 루트 절대경로로 참조한다.

7. `app/todos/page.tsx`(목록), `app/todos/new/page.tsx`(생성), `app/todos/[todoId]/page.tsx`(수정), `app/todos/loading.tsx`, `app/todos/error.tsx`를 만든다. 이번 단계는 백엔드 연동 없이 더미 데이터/props로만 동작시킨다.

8. 어떤 컴포넌트가 Server Component이고 어떤 게 `"use client"`가 필요한지 표로 정리해서 알려주고, 그 기준대로 적용한다.

9. `app/page.tsx`는 `/todos`로 redirect만 한다.

검증 기준:

- `/todos`, `/todos/new`, `/todos/[todoId]`가 2차와 픽셀 단위로 동일하게 보인다.

- 콘솔 에러 없음.

- `"use client"`가 정말 필요한 컴포넌트(인터랙션 있는 것)에만 붙어있다.

끝나면 검증 결과 체크리스트 + 확인 방법을 알려줘.
```

2차 과제 때는 모든 컴포넌트가 그냥 클라이언트에서 돌아갔는데, 이번엔 어떤 컴포넌트를 Server로 둘지 먼저 클로드한테 표로 정리해달라고 한 다음 그 표를 보고 내가 한 번 더 점검했다. (인벤토리 배경/슬롯 골격처럼 그냥 보여주기만 하는 건 Server, 슬롯 호버 툴팁/폼 입력/필터 탭처럼 인터랙션 있는 건 Client.)

### 프롬프트 3 - API Route + Server Action 연동

```
[5단계: API Route 작성하고 프론트-백엔드 연동하기]

기대 결과: 더미 데이터가 실제 FastAPI/SQLite 데이터로 교체되고, CRUD가 실제로 동작한다.

작업:

1. `frontend/app/api/todos/route.ts`(GET, POST), `frontend/app/api/todos/[id]/route.ts`(PUT, DELETE)를 작성해서 FastAPI로 프록시한다.

2. `frontend/app/actions.ts`에 `getTodos`, `createTodo`, `updateTodo`, `deleteTodo` Server Action을 작성한다. 목록 조회는 `actions.ts`에서 FastAPI를 직접 호출하고, 생성/수정/삭제는 클라이언트에서 `fetch('/api/todos')`로 `route.ts`를 거친다.

3. `createTodo` 호출 시 프론트는 id를 만들지 않고, 백엔드 응답으로 받은 id를 그대로 사용해 화면을 갱신한다.

4. 변경 작업 후 `revalidatePath('/todos')`를 호출한다.

5. 프롬프트 2의 더미 데이터를 실제 호출로 교체하고, 2차의 업적 알림(`MessageToast`, `AchievementBar`) 동작이 그대로 재현되는지 확인한다.

검증 기준:

- Todo 생성 시 FastAPI DB에 실제로 저장되고, 응답받은 id로 화면에 반영된다.

- 목록/수정/삭제가 새로고침 없이 갱신된다.

- 브라우저 네트워크 탭에서 요청 순서(클라이언트 → route.ts → FastAPI)를 확인한다.

- 같은 todo를 두 번 생성해도 id가 절대 겹치지 않는다(DB PK 보장 확인).

끝나면 검증 결과 체크리스트 + 확인 방법을 알려줘.
```

### 프롬프트4 - 환경변수 분리

```
[6단계: 환경변수 설정하기]

기대 결과: 코드에 하드코딩된 URL이 0개.

작업:

1. `frontend/.env.local`에 `NEXT_PUBLIC_API_URL`, `BACKEND_URL`을 추가한다.

2. `backend/.env.local`에 `DATABASE_URL`을 추가한다.

3. 클라이언트 컴포넌트에서 쓰는 값만 `NEXT_PUBLIC_` 접두사를 쓰고, 서버 전용 값은 접두사 없이 관리한다.

4. 코드 전체에서 `localhost:8000`, `localhost:3000` 하드코딩이 남아있는지 grep해서 확인하고 전부 제거한다.

5. `frontend/.gitignore`, `backend/.gitignore`에 `.env.local`이 포함되어 있는지 확인한다.

검증 기준:

- grep으로 하드코딩된 URL이 0건.

- 환경변수 교체 후에도 기능이 동일하게 동작한다.

- `.env.local`이 git에 추적되지 않는다.

끝나면 검증 결과 체크리스트 + 확인 방법을 알려줘.

```

2차 과제는 외부 서버 통신이 없어서 환경변수가 필요 없었는데, 
프론트/백엔드가 분리되니까 이 단계부터 "값이 환경마다 달라질 수 있는 건 전부 env로 빼야 한다"는 것을 좀 더 명확하게 알게 되었다.

### 프롬프트 5 - 도전 미션 (서버 기반 필터링)

```
[도전1: 서버 기반 상태별 필터링 구현하기]

기대 결과: 전체/진행 중/완료 필터가 URL 파라미터로 관리되고, 필터링이 서버(FastAPI)에서 처리된다.

작업:

1. `FilterTabs`는 `useSearchParams`로 현재 필터(`?filter=active|completed`)를 읽고, 탭 클릭 시 `router.push`로 URL을 변경한다. `useSearchParams`를 쓰는 컴포넌트는 `<Suspense>`로 감싼다.

2. `backend/main.py`의 `GET /todos`에 `filter` 쿼리 파라미터를 추가해서 SQLAlchemy `where` 조건으로 서버에서 필터링한다.

3. `frontend/app/actions.ts`의 `getTodos`가 filter 값을 FastAPI로 그대로 전달한다.

검증 기준:

- 필터 탭 클릭 시 URL이 바뀐다.

- URL 직접 입력해도 해당 필터가 적용된다.

- 새로고침/새 Todo 추가 후에도 필터가 유지된다.

- 네트워크 탭에서 필터링이 클라이언트가 아닌 FastAPI(`/todos?filter=...`)에서 처리됨을 확인한다.

끝나면 검증 결과 체크리스트 + 확인 방법을 알려줘.
```

### 프롬프트 6 - 도전 미션 (서버 기반 검색)
```
[도전2: 서버 기반 Todo 검색 기능 구현하기]

기대 결과: 검색어가 URL 파라미터로 관리되고, 필터와 동시에 적용 가능하며, 검색이 서버에서 처리된다.

작업:

1. 검색 입력 컴포넌트는 `"use client"`로 만들고, 입력값을 debounce 처리한 뒤 `router.push`로 `?search=키워드` URL을 갱신한다. debounce 시간은 `config.ts`의 매직넘버로 분리한다.

2. `backend/main.py`의 `GET /todos`에 `search` 쿼리 파라미터를 추가해서 `text` 또는 `detail`에 대해 LIKE 조건으로 검색한다. `filter`와 동시 적용 시 AND 조건으로 묶는다.

3. 검색어가 비어있을 때는 전체 목록이 다시 보이게 한다.

검증 기준:

- 검색어 입력 시 URL이 바뀐다(디바운스 후).

- 네트워크 탭에서 서버가 필터링된 결과를 반환함을 확인한다.

- `?filter=active&search=키워드` 동시 적용이 정상 동작한다.

- 검색어를 지우면 전체 목록이 다시 표시된다.

끝나면 검증 결과 체크리스트 + 확인 방법을 알려줘.
```

### 프롬프트 7 - 최종 점검
```
[최종 점검]

기대 결과: 2차 과제와 눈으로 구분 안 될 만큼 동일하게 동작하고, 데이터는 SQLite에 영속되며, 콘솔 에러 0.

작업:

1. `CLAUDE.md` 9절 검증 불변식을 전부 다시 점검한다(빈 제목/슬롯 가득찼을 때 메시지, 완료 탭 추가 시 active 전환, 슬롯 충돌 없음, all == active + done, 동시 알림 ≤ MAX_ACHIEVEMENTS, 새로고침 후 데이터 유지).

2. 사용하지 않는 `console.log`, 주석 처리된 죽은 코드를 제거한다.

3. 코드 전체에서 하드코딩 URL, 매직넘버가 남아있지 않은지 마지막으로 grep한다.

4. id 생성 로직이 전부 백엔드(DB PK)에 있고, 프론트에 `Date.now()` 같은 임의 id 생성 코드가 없는지 다시 확인한다.

5. README가 실행 가능한 안내를 담고 있는지 최종 확인한다.

검증 기준:

- 브라우저 콘솔 에러 0.

- 모든 기본/도전 미션 체크리스트 통과.

- 2차 과제 피드백 2건(고유 id, README) 모두 해결됨.

끝나면 최종 체크리스트를 표로 정리해서 보고해줘.
```

### 프롬프트8 - README 

```
[README 정비]

기대 결과: 프로젝트를 처음 보는 사람이 무엇을 어떻게 실행하면 되는지 알 수 있는 README.

> 2차 과제 피드백: "README가 Vite 기본 템플릿 내용 그대로 남아 있다"는 지적을 받았다. 3차에서는 이걸 반드시 고친다.

작업:

1. `assignment3/README.md`(루트)에 다음을 포함해서 작성한다:

- 프로젝트 한 줄 소개(2차 React 앱을 Next.js + FastAPI로 마이그레이션했다는 맥락).

- 폴더 구조 요약(`frontend/`, `backend/`).

- 실행 방법: `frontend`(`npm install` → `npm run dev`, 3000), `backend`(venv → `pip install -r requirements.txt` → `uvicorn main:app --reload`, 8000).

- 환경변수 설정 방법(`.env.local` 예시, 민감값은 실제 값 적지 말고 placeholder로).

- 2차 대비 변경점: localStorage → FastAPI+SQLite, id 발급 방식(Date.now() → DB auto-increment PK)처럼 피드백을 반영해 바뀐 부분을 명시.

- 구현한 기본/도전 미션 체크리스트.

2. `frontend/README.md`(create-next-app이 만든 기본 템플릿 문구)가 남아있다면, 위 루트 README로 대체하거나 삭제하고 루트 README만 유지한다.

검증 기준:

- README에 Next.js/Vite 기본 템플릿 문구("This is a Next.js project bootstrapped with...")가 남아있지 않다.

- README만 보고 다른 사람이 두 서버를 실행할 수 있다.

끝나면 README 최종본을 보여주고 빠진 정보 없는지 점검 결과를 알려줘.

```

2차 과제 피드백에서 "README가 Vite 기본 템플릿 그대로 남아있다"는 지적을 받았던 게 계속 마음에 걸렸어서, 이번엔 README 작성을 아예 독립된 단계로 떼어내서 미션 끝에 빠뜨리지 않게 챙겼다.

## 구현하면서 고민한 점

구현 과정에서 막혔던 부분이나 고민했던 내용, 해결 방법을 자유롭게 작성해요.

* 고민한 점 : (예시) route.ts와 actions.ts 둘 다 서버에서 도는데 왜 굳이 나눠야 하는지 처음엔 잘 안 와닿았다 / Server Component에서 받은 데이터를 Client Component로 넘길 때 타입을 어떻게 맞춰야 하는지 헷갈렸다 / camelCase ↔ snake_case 변환을 어느 경계에서 할지 고민했다 등 — 실제로 부딪힌 지점을 채우기

* 해결 방법 : (위 고민에 대해 실제로 어떻게 풀었는지 적기. 예: route.ts는 외부에서 오는 HTTP 요청을 받는 창구라서 클라이언트 fetch 대상이 되고, actions.ts는 서버 컴포넌트가 직접 import해서 부르는 함수라 역할이 다르다는 걸 직접 호출 흐름을 그려보면서 이해했다, 등)

## 과제 회고

과제를 마치고 느낀 점, 아쉬운 점, 다음에 개선하고 싶은 점을 자유롭게 작성해요.

* 잘한 점 : 과제 결과물이 잘 동작하는 것 말곤 없는 것 같다.

* 아쉬운 점 (느낀 점) : 1단계 과제는 html,css, vanilla js 라 쉬웠고, 코드 파악도 하기 좋았지만 2단계 과제를 이해할 무렵 3단계 과제가 나가 따라가기 너무 벅찼다 ㅠㅠ... 클로드가 없었으면 안됐을 것 같다. 
  백엔드의 fast api 는 매핑해서 필요한 기능을 끌어다 쓰는 느낌으로 이해 했더니 조금 구조가 보이는데, next js 는 파일도 너무 많고 화면 요소 별로 나뉘는 것도 너무 많아서 혼란스럽다. 
  이론 강의나 실습 때는 쉽게쉽게 지나갔었는데, 과제로 몸소 겪어보니까 정말 부족함을 많이 느꼈다. 
  1단계를 잘 따라갈 수 있을지도 걱정되기 시작했다. 

