
## 프롬프트 0 — 맥락 전달 (가장 먼저)

이 저장소의 `COMPONENT.md`를 먼저 정독해줘. 우리는 Vanilla JS로 만든 마인크래프트 인벤토리 Todo 앱(`index.html`, `style.css`, `app.js`)을 React로 마이그레이션한다. 앞으로 내가 단계별로 기능을 요청할 거고, 너는 매 단계마다 `COMPONENT.md`의 폴더 구조 / 데이터 모델 / 상태 설계 / 컴포넌트 명세 / 슬롯 렌더링 규칙(7번) / 동작 세부·불변식(9번)을 그대로 따라야 한다.

핵심 원칙:
- 기존 `style.css`의 픽셀 위치 값은 절대 바꾸지 말고 그대로 재사용한다. Tailwind 임의값으로 다시 쓰지 않는다.
- 상태는 `App.jsx`로 끌어올리고 하위 컴포넌트는 props로 받는다.
- DOM 직접 조작(`getElementById`/`innerHTML`/`classList`) 금지 → 상태 + 조건부 렌더링.
- `Date`는 변형하지 말고 항상 새 객체로 교체.
- **"무엇을 그릴지 계산하는 순수 함수(utils)"와 "상태를 바꾸는 핸들러(App)"를 분리한다.** 계산 함수는 상태를 직접 바꾸지 않는다.
- **매직넘버 금지.** 슬롯 개수·알림 개수·타이밍 등 수치는 전부 `constants/config.js`의 `CONFIG`에서 가져온다.
- 기능 동작은 Vanilla 원본과 1:1로 동일해야 한다.
- **각 단계 프롬프트에는 "기대 결과"와 "검증 기준"이 같이 있다. 너는 작업 후 그 검증 기준을 스스로 점검해서 통과 여부를 체크리스트로 보고하고, 브라우저에서 어떻게 확인하는지 알려줘.**

지금은 코드를 작성하지 말고, `COMPONENT.md`를 읽고 전체 구조를 이해했으면 '준비됐어'라고만 답해줘. 마이그레이션 시 우려되는 점이나 빠진 정보가 있으면 질문해줘.

---

## 프롬프트 1 — 프로젝트 골격 + 정적 레이아웃

[1단계: 프로젝트 골격 + 정적 레이아웃]

기대 결과: 기능 없이, 마인크래프트 배경 위에 빈 슬롯 27개가 기존과 똑같이 정렬돼 보인다.

작업:
1. `assets/`와 `fonts/` 폴더 전체를 `public/`로 복사해줘 (`public/assets/...`, `public/fonts/...`).
2. 기존 `style.css`를 `src/styles/minecraft.css`로 복사하고, `@font-face`의 url을 `/fonts/Galmuri-v2.40.3/Galmuri11.woff2`, `.ttf`처럼 루트 절대경로로만 바꿔줘. 나머지 내용은 그대로 둬.
3. `src/index.css`는 다음 두 줄만 남겨줘:
   `@import "tailwindcss";`
   `@import "./styles/minecraft.css";`
4. `COMPONENT.md` 폴더 구조대로 `src/constants/`(items.js, config.js), `src/utils/`, `src/components/`와 명세된 컴포넌트 파일들을 생성해줘. `constants/config.js`에는 `COMPONENT.md` 6번의 `CONFIG` 객체를 그대로 만들어줘(매직넘버는 앞으로 전부 여기서 가져온다). 로직이 없는 컴포넌트는 최소 뼈대(정적 마크업 반환)로 만들어도 된다.
5. `App.jsx`에 기존 `index.html`의 `.app-container > .inventory-wrapper` 구조를 그대로 옮겨줘:
   - 배경 `<img class="inventory-bg" src="/assets/background.jpeg">`
   - `DateNavigator`, `AddTodoButton`, `FilterTabs` (이번 단계는 클릭 동작 없이 정적)
   - `InventoryGrid`: `.inventory-slot`을 `CONFIG.MAX_SLOTS`개 (빈 칸)
   - 빈 `TodoListPanel`
   - 모든 이미지 src는 `/assets/...` 절대경로.
6. 슬롯 정렬 확인용으로 `.inventory-slot`의 반투명 테두리는 잠깐 남겨둬도 된다(마지막 단계에서 정리).

검증 기준:
- `npm run dev` → localhost:5173에 기존과 동일한 배경 + 27칸 슬롯 격자가 배경 이미지에 딱 맞게 정렬돼 보인다.
- 슬롯 개수가 정확히 27개다(`CONFIG.MAX_SLOTS`에서 옴, 코드에 27 직접 안 박힘).
- 콘솔 에러 없음.

끝나면 검증 결과 체크리스트 + 확인 방법 알려줘.

---

## 프롬프트 2 — Todo 데이터 + CRUD + 모달

[2단계: Todo 데이터 + CRUD + 모달]

기대 결과: Todo를 추가/수정/삭제/완료할 수 있고, 슬롯에 아이템이 뜬다. 데이터 모델은 `COMPONENT.md` 3번 그대로.

상태 (App.jsx):
- `todos`: `useState([])` — (localStorage는 5단계에서 붙임)
- `modal`: `useState({ isOpen:false, mode:'add', todoId:null })`
- `message`: `useState('')`

작업:
1. `utils/slots.js`에 `getRandomItemImage()`, `getFirstEmptySlotIndex(todos, viewDate)`, `computeSlotItems(todos, viewDate, filter)`를 **순수 함수**로 구현(`COMPONENT.md` 6·7번). 이 함수들은 상태를 직접 바꾸지 않고 결과만 반환한다. 이번 단계에선 viewDate는 `new Date()`(오늘), filter는 `'active'` 고정으로 호출해도 된다. `MAX_SLOTS`는 `CONFIG`에서 가져온다.
2. `TodoModal` 구현(`COMPONENT.md` 5번 명세대로):
   - 제목/세부내용/마감기한(date)/우선순위(range 1~64) 모두 controlled input, 모달 내부 local state로 폼 관리.
   - 마감 input min = 오늘, add 기본 마감 = 오늘, 우선순위 기본 `CONFIG.DEFAULT_PRIORITY`, 슬라이더 값 실시간 표시.
   - 모달 내부 local `isEditing`으로 버튼/편집가능 여부 제어(add / edit-보기 / edit-수정중 / done-view 4가지).
   - 오버레이 클릭·ESC로 닫기. 기존 마크업·클래스 그대로.
3. App 핸들러(여기서만 상태 변경):
   - `handleAddTodo(form)`: 제목 공백 → message '제목을 입력해주세요.'; 빈 슬롯 없음 → message '인벤토리가 가득 찼습니다.'; 아니면 todos 추가(id `Date.now()`, status 'active', itemImage 랜덤, slotIndex `getFirstEmptySlotIndex`, createdAt 오늘).
   - `handleSaveEdit(form)`: 해당 todo의 text/detail/deadline/priority 갱신(불변, map으로 새 배열).
   - `handleDeleteTodo()`: 해당 id 제거(filter로 새 배열).
   - `handleCompleteTodo()`: 해당 todo status='done' (업적 알림은 7단계).
4. `InventoryGrid`/`InventorySlot`: `computeSlotItems` 결과를 받아 렌더. 아이템 이미지 + 우상단 우선순위. 아이템 있는 슬롯 클릭 → `onSlotClick(todo, isDone)` → active면 `openModal('edit', id)`, done이면 `openModal('done-view', id)`.
5. `MessageToast`: message가 있으면 `CONFIG.MESSAGE_DURATION_MS` 동안 표시 후 자동 사라짐.

검증 기준:
- 빈 제목으로 확인 → 추가 안 되고 '제목을 입력해주세요.' 토스트.
- 슬롯 27개를 다 채운 뒤 추가 시도 → '인벤토리가 가득 찼습니다.' 토스트, 추가 안 됨.
- 추가한 아이템이 슬롯에 뜨고 우하단에 우선순위 숫자 표시.
- 슬롯 클릭 → 수정 후 확인 시 **같은 슬롯에서 내용만** 바뀜(위치 안 변함).
- 삭제 시 **그 칸만** 비고 다른 칸 영향 없음.
- 완료 시 진행중 목록에서 사라짐.
- `setTimeout`/숫자는 `CONFIG`에서 옴(코드에 2000 직접 없음).

끝나면 검증 결과 체크리스트 + 확인 방법.

---

## 프롬프트 3 — 상태별 필터링

[3단계: 상태별 필터링]

기대 결과: 전체/진행중/완료 탭으로 슬롯 표시 전환.

상태: App에 `currentFilter`: `useState('active')` 추가(원본 초기값과 동일).

작업:
1. `FilterTabs`: 전체(all)/진행중(active)/완료(done) 세로 탭, 선택 탭 `.active` 강조. props: `currentFilter`, `onChange(filter)`.
2. `computeSlotItems(todos, viewDate, filter)`를 `COMPONENT.md` 7번 규칙대로 완성(여전히 순수 함수):
   - done: done todo를 슬롯 0,1,2…에 흑백으로.
   - all: active는 각자 `slotIndex` 위치, done은 남은 빈 슬롯에 순서대로 흑백.
   - active: active만 각자 `slotIndex`.
3. 완료 아이템은 `.done-item`(흑백). 인벤토리 꽉참 판정은 active만 기준.
4. 완료 탭에서 추가하면 진행중(active) 탭으로 전환.

검증 기준:
- 같은 날짜에서: **`전체` 탭 표시 개수 == `진행중` 개수 + `완료` 개수** (피드백에서 짚은 개수 일치).
- 진행중 탭은 active만, 완료 탭은 done만 흑백으로 표시.
- 완료 아이템은 인벤토리 꽉참 카운트에 안 들어감(완료 여러 개여도 진행중 새로 추가 가능).
- 완료 아이템 클릭 → done-view 모달.
- 완료 탭에서 추가 → 진행중 탭으로 전환됨.

끝나면 검증 결과 체크리스트 + 확인 방법.

---

## 프롬프트 4 — 일간 뷰 (날짜 네비게이션)

[4단계: 일간 뷰]

기대 결과: 날짜별로 Todo가 분리되고, 이전/다음 날짜로 이동.

상태: App에 `currentViewDate`: `useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; })`.

작업:
1. `utils/date.js`에 `getDateString`, `getKoreanDateString`, `getTodoDateKey`, `getWeekDays`를 **순수 함수**로 구현(`COMPONENT.md` 6번). `getDateString`은 로컬 기준(`toISOString` 금지).
2. `DateNavigator`: `[◀][YYYY년 M월 D일][▶]`. props: `currentDate`, `onPrev`, `onNext`. 라벨은 `getKoreanDateString`.
3. App `handlePrevDate`/`handleNextDate`: **새 Date를 만들어** 하루 이동 후 `setCurrentViewDate`. 예:
   `const d = new Date(currentViewDate); d.setDate(d.getDate() - 1); setCurrentViewDate(d);`
   (`currentViewDate.setDate(...)` 직접 변형 금지)
4. `computeSlotItems`·패널·슬롯은 모두 `currentViewDate` 기준으로 필터(날짜로 먼저 거른 뒤 슬롯 적용). `handleAddTodo`의 createdAt도 `getDateString(currentViewDate)`로.
5. 날짜 이동해도 `currentFilter` 유지.

검증 기준 (★ 피드백에서 짚은 "동일 슬롯 충돌" 집중 검증):
- **슬롯 충돌 테스트:** 6/1에서 슬롯 0에 todo 추가 → 6/2로 이동 → 6/2 슬롯 0에 다른 todo 추가 → 다시 6/1로 돌아오면 **6/1의 슬롯 0 todo가 그대로 남아있다**(날짜만 다르고 슬롯이 같다고 사라지면 버그).
- 날짜 이동 시 해당 날짜 todo만 표시.
- 날짜 이동/추가 후에도 현재 필터 탭 유지.
- 날짜 버튼을 빠르게 여러 번 눌러도 날짜가 정확히 1일씩 이동(Date 직접 변형 안 해서 꼬임 없음).

끝나면 검증 결과 체크리스트 + 확인 방법.

---

## 프롬프트 5 — localStorage 연동

[5단계: localStorage 연동]

기대 결과: 새로고침 후에도 데이터 유지.

작업:
1. App의 `todos` 선언을 함수형 초기화로 변경:
   ```
   const [todos, setTodos] = useState(() => {
     try { const raw = localStorage.getItem('todos'); return raw ? JSON.parse(raw) : []; }
     catch { return []; }
   });
   ```
2. `useEffect`로 todos 변경 시 자동 저장:
   ```
   useEffect(() => { localStorage.setItem('todos', JSON.stringify(todos)); }, [todos]);
   ```
3. 저장 키는 `'todos'`. 더 이상 수동 save 호출은 필요 없으니(있다면) 제거.

검증 기준:
- Todo 추가 후 새로고침 → 데이터 그대로 유지.
- DevTools → Application → Local Storage의 `'todos'` 키에 JSON 배열이 들어있음.
- todo를 전부 삭제하고 새로고침 → 빈 상태 유지(에러 없음).
- 저장 호출이 함수마다 흩어져 있지 않고 `useEffect([todos])` 한 곳뿐.

끝나면 검증 결과 체크리스트 + 확인 방법.

---

## 프롬프트 6 — 상시 목록 패널 + 주간 뷰 (도전)

[6단계: 상시 목록 패널 + 주간 뷰]

기대 결과: 항상 보이는 Todo 목록 패널, 일간/주간 토글, 주간에서 날짜 클릭 시 이동.

상태: App에 `panelViewMode`: `useState('daily')`.

작업:
1. `TodoListPanel` props: `todos`, `currentViewDate`, `currentFilter`, `panelViewMode`, `onToggleMode(mode)`, `onSelectDate(dateStr)`.
2. 상단 `[일간][주간]` 토글, 현재 모드 `.active`.
3. 일간 모드: `currentViewDate`의 todo를 필터(done이면 done, 그 외 active)한 뒤 **우선순위 내림차순** 정렬. 헤더 `📝 {라벨} ({개수})`, 비면 `할 일 없음`. 각 행에 아이템/제목/(마감)/우선순위(기존 `.tl-*`).
4. 주간 모드: `getWeekDays(currentViewDate)`로 월~일 7일 **모두** 표시. 날짜별 헤더(오늘은 `.today` 강조)+개수, todo 없으면 `todo가 없습니다`. **날짜 헤더 클릭** 시 `onSelectDate(dateKey)` → App에서 `currentViewDate` 교체 + `panelViewMode='daily'`. (아이템 클릭은 날짜 이동 안 함)
5. 패널 max-height는 가로의 1.4배(기존 CSS 그대로), 넘치면 스크롤.

검증 기준:
- 일간/주간 토글 정상 전환.
- 주간에 월~일 7칸이 **항상** 보이고, todo 없는 날엔 'todo가 없습니다'.
- 주간 날짜 헤더 클릭 → 그 날짜 일간 뷰로 이동(슬롯·날짜 네비게이터 같이 바뀜). 아이템 클릭은 날짜 이동 안 함.
- 일간 패널 목록이 우선순위 내림차순.
- 패널이 길어지면 세로로 안 늘어나고 스크롤(가로의 1.4배에서 멈춤).

끝나면 검증 결과 체크리스트 + 확인 방법.

---

## 프롬프트 7 — 완료 업적 알림 (추가 기능)

[7단계: 완료 업적 알림]

기대 결과: Todo 완료 시 우상단 마인크래프트 업적 알림.

상태: App에 `achievements`: `useState([])`. 각 항목 `{ id, todo }`.

작업:
1. `handleCompleteTodo`에서 status를 done으로 바꾼 뒤 achievements에 `{ id: 고유값, todo }` 추가. **`CONFIG.MAX_ACHIEVEMENTS` 초과 시 가장 오래된 것부터 제거**.
2. `AchievementBar` props: `achievements`, `onExpire(id)`. 위에서부터 쌓아 렌더(기존 위치/간격 CSS). 내부에 `AchievementItem` 서브컴포넌트.
3. `AchievementItem` props: `todo`, `index`, `onExpire(id)`:
   - 마운트 시 다음 프레임에 `.slide-in`(`useEffect` + `requestAnimationFrame`).
   - `CONFIG.ACHIEVE_DISPLAY_MS` 후 `.slide-out` → `CONFIG.ACHIEVE_SLIDE_OUT_MS` 뒤 `onExpire(id)` 호출(`setTimeout`, cleanup으로 `clearTimeout` 필수). **숫자 직접 박지 말 것.**
   - 좌측 아이템 이미지, 우측 위 `{todo.text} 도전과제 달성!`, 우측 아래 `{todo.text}`. 기존 `.achieve-*` 클래스.
4. 알림 `top`은 `index` 기반으로 쌓이게: `CONFIG.ACHIEVE_TOP_BASE + index * (높이 + CONFIG.ACHIEVE_GAP)`.

검증 기준 (★ 피드백에서 짚은 "알림 큐 최대 개수"):
- 완료 시 우상단에서 슬라이드 인.
- todo 4개를 빠르게 연속 완료 → 화면엔 **동시에 최대 3개만**, 가장 오래된 것부터 사라짐.
- 각 알림은 표시 시간 후 자동으로 슬라이드 아웃되며 사라짐(타이머 누수로 안 사라지는 일 없음).
- 알림 여러 개일 때 세로로 일정 간격으로 쌓임.
- 타이밍·개수 숫자가 전부 `CONFIG`에서 옴(코드에 3000/400/3 직접 없음).

끝나면 검증 결과 체크리스트 + 확인 방법.

---

## 프롬프트 8 — 호버 툴팁 + 최종 정리

[8단계: 호버 툴팁 + 정리]

기대 결과: 슬롯 호버 시 Todo 상세 툴팁, 코드/화면 정리.

작업:
1. `SlotTooltip`: 마우스 올린 슬롯의 todo 상세(제목, (있으면)세부, (있으면)마감, 우선순위, (done이면)완료됨)를 마우스 근처에 `fixed`로 표시. 화면 밖으로 안 넘치게 위치 보정.
   - `InventoryGrid`에서 hover 중인 todo + 마우스 좌표를 local state로 관리해 `SlotTooltip`에 전달(`onMouseMove`/`onMouseLeave`).
2. 슬롯 정렬용 임시 테두리 제거(`.inventory-slot` border 정리) — 기존 Vanilla 최종본과 동일하게.
3. **관심사 분리 점검:** utils의 compute/계산 함수가 상태를 직접 바꾸지 않는지, 상태 변경이 App 핸들러에만 있는지 확인하고 어긋난 곳이 있으면 정리.
4. **매직넘버 점검:** 컴포넌트/핸들러/유틸에 숫자 리터럴이 남아있으면 `CONFIG`/상수로 옮긴다.
5. 사용하지 않는 `console.log`·주석·죽은 코드 제거. 변수·함수명 의미 명확히.
6. (선택) `README.md`에 구현 기능 / 실행법 / "픽셀 정밀 레이아웃은 기존 CSS를 의도적으로 보존, Tailwind는 보조 사용, 수치는 config로 일원화" 한 줄.

검증 기준:
- 슬롯 호버 시 상세 툴팁이 마우스를 따라 이동, 화면 밖으로 안 넘침.
- 콘솔에 "unique key" 경고 없음(map 렌더에 `key={todo.id}`).
- utils의 계산 함수가 상태를 바꾸지 않음(순수).
- 컴포넌트/핸들러에 매직넘버 없음(전부 `CONFIG`/상수).
- 콘솔 에러·경고 0.

끝나면 검증 결과 체크리스트 + 확인 방법.

---
