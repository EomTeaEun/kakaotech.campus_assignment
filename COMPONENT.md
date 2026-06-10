# COMPONENT.md — Minecraft Todo React 마이그레이션 명세

Vanilla JS(`index.html` / `style.css` / `app.js`)로 만든 **마인크래프트 인벤토리 Todo 앱**을
React로 옮기기 위한 설계 문서다. Claude Code는 이 문서를 **단일 진실 공급원(SSOT)** 으로 삼아
모든 단계에서 동일한 구조·데이터 모델·렌더링 규칙을 따른다.

---

## 0. 마이그레이션 원칙 (반드시 지킬 것)

1. **기존 `style.css`의 픽셀 위치 값은 절대 바꾸지 않는다.**
   - 슬롯 격자(시작 `(421,409)`, 슬롯 56px, gap 7px), 버튼(`(840,338)`, 200×50), 패널(`(1120,329)`),
     날짜 네비, 모달 책 좌표 등은 Figma로 직접 측정한 값이다.
   - Tailwind 임의값으로 다시 쓰지 말 것. `style.css`를 그대로 복사해 전역 import 하고,
     컴포넌트는 **기존과 동일한 className**(`inventory-slot`, `todo-write-wrapper` 등)을 사용한다.
   - Tailwind v4는 셋업만 해두고, 새로 만드는 단순 유틸 스타일에만 보조적으로 쓴다.
2. **에셋(이미지/폰트)은 `public/`에 둔다.** 경로는 루트 절대경로(`/assets/...`, `/fonts/...`)로 참조.
3. **상태는 `App.jsx`로 끌어올린다(lifting state up).** 하위 컴포넌트는 props로 데이터·콜백을 받는
   표현(presentational) 컴포넌트로 만든다.
4. **DOM 직접 조작 금지.** `getElementById` / `innerHTML` / `classList` 조작을
   React 상태 + 조건부 렌더링으로 대체한다.
5. **불변 업데이트.** 배열·객체·날짜는 항상 새 값으로 교체한다.
   - 특히 `Date`는 `setDate()`로 직접 변형하지 말고 새 `Date`를 만들어 교체한다.
6. **기능 동작은 Vanilla 원본과 1:1로 동일**해야 한다 (아래 명세 기준).
7. **"계산/렌더 로직"과 "상태 변경"을 분리한다.** ← (피드백 반영)
   - `utils/`의 함수(예: `computeSlotItems`, `getFirstEmptySlotIndex`)는 **입력을 받아 결과만 반환하는 순수 함수**다. 절대 상태를 직접 바꾸지 않는다.
   - 상태를 바꾸는 일(`setTodos` 등)은 **App의 핸들러 안에서만** 한다.
   - "무엇을 그릴지 계산하는 코드"와 "데이터를 바꾸는 코드"를 한 함수에 섞지 않는다.
8. **매직넘버 금지 — 레이아웃·제한·타이밍 수치는 `constants/config.js` 한 곳에 모은다.** ← (피드백 반영)
   - 컴포넌트/핸들러 안에 `27`, `3`, `3000`, `2000` 같은 숫자를 직접 박지 말고 `CONFIG`에서 가져온다.

---

## 1. 기술 스택
- React 18+ / Vite / Tailwind CSS v4(보조) / JavaScript
- 영속화: Web Storage API (`localStorage`)

---

## 2. 폴더 구조

```
public/
├── assets/
│   ├── background.jpeg
│   ├── button.png
│   ├── todo_write.png
│   ├── achieve_bar.png
│   └── items/            # bed.png, diamond.png … (아이템 PNG)
└── fonts/
    └── Galmuri-v2.40.3/  # Galmuri11.woff2, Galmuri11.ttf

src/
├── main.jsx
├── App.jsx                  # 모든 상태 + 핸들러 + 합성(composition)
├── index.css               # @import "tailwindcss";  +  ./styles/minecraft.css
├── styles/
│   └── minecraft.css       # 기존 style.css 그대로 복사 (폰트 url만 /fonts/.. 로 수정)
├── constants/
│   ├── items.js            # ITEM_IMAGES (아이템 PNG 목록)
│   └── config.js           # 매직넘버 모음 (MAX_SLOTS, 알림/메시지 타이밍·치수)
├── utils/
│   ├── date.js             # 날짜 포맷 / 주간 계산 (순수 함수)
│   └── slots.js            # 랜덤 아이템, 빈 슬롯 찾기, 슬롯 배치 계산 (순수 함수)
└── components/
    ├── DateNavigator.jsx
    ├── AddTodoButton.jsx
    ├── FilterTabs.jsx
    ├── InventoryGrid.jsx
    ├── InventorySlot.jsx
    ├── SlotTooltip.jsx
    ├── TodoListPanel.jsx
    ├── TodoModal.jsx
    ├── AchievementBar.jsx   # 내부에 AchievementItem 서브컴포넌트
    └── MessageToast.jsx
```

---

## 3. 데이터 모델

```js
/**
 * @typedef {Object} Todo
 * @property {number} id         // Date.now()
 * @property {string} text       // 제목
 * @property {string} detail     // 세부 내용 (없으면 "")
 * @property {string} deadline   // "YYYY-MM-DD" (없으면 "")
 * @property {number} priority   // 1~64
 * @property {'active'|'done'} status
 * @property {string} itemImage  // 파일명, 예: "diamond.png"
 * @property {number} slotIndex  // 0~26 (생성 시점의 빈 슬롯)
 * @property {string} createdAt  // "YYYY-MM-DD" (생성 시 선택된 날짜)
 */
```

> 마인크래프트 슬롯 1칸 최대 보유량이 64라서 `priority`는 1~64.

---

## 4. 상태 설계 (App.jsx)

| 상태 | 타입 | 초기값 | 설명 |
|---|---|---|---|
| `todos` | `Todo[]` | localStorage 또는 `[]` (함수형 초기화) | 모든 할 일 |
| `currentViewDate` | `Date` | 오늘(자정, `setHours(0,0,0,0)`) | 현재 보고 있는 날짜 |
| `currentFilter` | `'all'\|'active'\|'done'` | `'active'` | 필터 탭 (원본 초기값과 동일) |
| `panelViewMode` | `'daily'\|'weekly'` | `'daily'` | 목록 패널 모드 |
| `modal` | `{ isOpen, mode, todoId }` | `{ false, 'add', null }` | 모달 상태 (`mode`: `'add'\|'edit'\|'done-view'`) |
| `message` | `string` | `''` | 안내 토스트 |
| `achievements` | `{ id, todo }[]` | `[]` | 완료 업적 알림 |

**App이 정의해 props로 내려주는 핸들러(예시):**
`handleAddTodo(form)`, `handleSaveEdit(form)`, `handleDeleteTodo()`, `handleCompleteTodo()`,
`handlePrevDate()`, `handleNextDate()`, `handleSelectDate(dateStr)`,
`setCurrentFilter`, `setPanelViewMode`, `openModal(mode, todoId)`, `closeModal()`,
`handleAchievementExpire(id)`, `setMessage`.

> 모달 폼 입력값(title/detail/deadline/priority)과 "보기→수정" 전환용 `isEditing`은
> **App이 아니라 `TodoModal` 내부 local state**로 관리한다. App의 modal 상태는 `{isOpen, mode, todoId}`만.

---

## 5. 컴포넌트 명세

### App.jsx
- 위 4번 상태 전부 보유. 핸들러 정의. `index.css` import.
- 마크업은 기존 `index.html`의 `.app-container > .inventory-wrapper` 구조를 그대로 옮긴다:
  배경 `<img class="inventory-bg">` 위에 DateNavigator / AddTodoButton / FilterTabs / InventoryGrid / TodoListPanel 배치.
  그 바깥에 SlotTooltip(또는 InventoryGrid 내부), TodoModal, AchievementBar, MessageToast.
- **상태 변경 핸들러만 여기 둔다. "무엇을 그릴지"는 utils의 순수 함수(computeSlotItems 등)에 맡긴다.**

### DateNavigator.jsx
- 역할: `[◀] [YYYY년 M월 D일] [▶]` 표시 및 날짜 이동.
- props: `currentDate: Date`, `onPrev()`, `onNext()`.
- 날짜 텍스트는 `getKoreanDateString(currentDate)`. 기존 `.date-nav`, `.date-nav-btn` 클래스 사용.

### AddTodoButton.jsx
- props: `onClick()`. 기존 `.add-todo-wrapper` 구조(`button.png` + 'TODO 추가하기' 라벨).

### FilterTabs.jsx
- 역할: 전체(all) / 진행중(active) / 완료(done) 세로 탭.
- props: `currentFilter`, `onChange(filter)`.
- 선택된 탭에 `.active`. 기존 `.filter-tabs`, `.filter-tab` 클래스.

### InventoryGrid.jsx
- 역할: 슬롯 27개 렌더 + **호버 툴팁 상태 관리**.
- props: `slotItems: (null | { todo, isDone })[]` (길이 `CONFIG.MAX_SLOTS`), `onSlotClick(todo, isDone)`.
- 내부 state: `hovered: { todo, x, y } | null`.
  - `onMouseMove`로 마우스 위치 추적, 아이템 있는 슬롯 위에서 `hovered` 갱신, 벗어나면 `null`.
  - `hovered`가 있으면 `<SlotTooltip>` 렌더.
- 기존 `.inventory-grid` 그리드. 슬롯을 `slotItems.map((item, i) => <InventorySlot key={i} ... />)`.

### InventorySlot.jsx
- props: `item: null | { todo, isDone }`, `onClick()`, 마우스 이벤트 핸들러(필요 시).
- `item`이 있으면 `.occupied`, 아이템 이미지(`/assets/items/${todo.itemImage}`) + 우하단 `.slot-priority`(=`todo.priority`).
- `item.isDone`이면 `.done-item`(흑백).
- **주의:** computeSlotItems가 슬롯별 `todo`를 직접 주므로, Vanilla처럼 `slotIndex`+날짜로 다시 찾을 필요 없다.

### SlotTooltip.jsx
- props: `todo`, `x`, `y`.
- 표시: 제목 / (있으면)세부 / (있으면)마감 / 우선순위 / (done이면)완료됨.
- `position: fixed`(기존 `.slot-tooltip`), 화면 밖으로 넘치지 않게 좌표 보정.

### TodoModal.jsx
- 역할: 추가 / 수정 / 완료-보기 모달.
- props: `isOpen`, `mode`(`'add'|'edit'|'done-view'`), `todo`(편집 대상 또는 null),
  `viewDate: Date`(기본 마감일용), `onConfirm(form)`, `onClose()`, `onDelete()`, `onComplete()`.
- 내부 local state:
  - `form = { title, detail, deadline, priority }` — **controlled input**.
  - `isEditing` — 'edit' 모드에서 보기↔수정 전환용.
- 열릴 때 `useEffect`로 `mode`/`todo`/`isOpen` 기준 폼 초기화:
  - `'add'`: 전부 빈 값, `deadline = getDateString(viewDate)`, `priority = 32`, 편집 가능.
  - `'edit'`/`'done-view'`: `todo` 값으로 채우고 읽기전용 시작.
- 마감 input `min = 오늘(getDateString(new Date()))` → 과거 날짜 선택 불가.
- 우선순위 슬라이더(1~64) 값 실시간 표시.
- **버튼/편집 가능 여부:**
  | 상태 | 편집 | 버튼 |
  |---|---|---|
  | `add` | O | [확인] [닫기] |
  | `edit` & 보기(`!isEditing`) | X | [닫기] [수정] [삭제] [완료] (수정 클릭→`isEditing=true`) |
  | `edit` & 수정중(`isEditing`) | O | [확인] |
  | `done-view` | X | [삭제] [닫기] |
- 확인: `add`면 `onConfirm`이 추가, `edit`이면 `onConfirm`이 수정.
- 오버레이 클릭 / ESC로 닫기. 기존 `.todo-modal-overlay`, `.todo-write-wrapper`, `.todo-field-*`, `.modal-btn-*` 클래스 그대로.

### TodoListPanel.jsx
- 역할: 항상 보이는 목록 패널, 일간/주간 토글.
- props: `todos`, `currentViewDate`, `currentFilter`, `panelViewMode`, `onToggleMode(mode)`, `onSelectDate(dateStr)`.
- 상단 `[일간][주간]` 토글(`.tl-toggle`), 현재 모드 `.active`.
- **일간:** `currentViewDate`의 todo를 필터(`done`이면 done, 그 외 active)한 뒤 **우선순위 내림차순** 정렬.
  헤더 `📝 {라벨} ({개수})`, 비면 `할 일 없음`. 각 행: 아이템/제목/(마감)/우선순위(`.tl-*`).
- **주간:** `getWeekDays(currentViewDate)`로 월~일 7일 **모두** 표시. 날짜별 헤더(오늘은 `.today` 강조)+개수,
  todo 없으면 `todo가 없습니다`. **날짜 헤더 클릭** 시 `onSelectDate(dateKey)` → App이 날짜 교체 + `panelViewMode='daily'`.
  (아이템 클릭은 날짜 이동 **안 함**)
- max-height = 가로의 1.4배(기존 CSS), 넘치면 스크롤.

### AchievementBar.jsx
- props: `achievements`, `onExpire(id)`.
- `achievements.map((a, i) => <AchievementItem key={a.id} todo={a.todo} index={i} onExpire={onExpire} />)`.

#### AchievementItem (AchievementBar 내부 서브컴포넌트)
- props: `todo`, `index`, `onExpire(id)`.
- 마운트 시 다음 프레임에 `.slide-in`(`useEffect` + `requestAnimationFrame`).
- `CONFIG.ACHIEVE_DISPLAY_MS` 후 `.slide-out` → `CONFIG.ACHIEVE_SLIDE_OUT_MS` 뒤 `onExpire(id)` 호출
  (`setTimeout`, cleanup으로 `clearTimeout` 필수). **3000/400 같은 숫자를 직접 쓰지 말 것.**
- 좌측 아이템 이미지, 우측 위 `{todo.text} 도전과제 달성!`, 우측 아래 `{todo.text}`. 기존 `.achieve-*` 클래스.
- `top` 위치는 `index` 기반으로 쌓이게: `CONFIG.ACHIEVE_TOP_BASE + index * (높이 + CONFIG.ACHIEVE_GAP)`.

### MessageToast.jsx
- props: `message`, `onClear()`.
- `message`가 있으면 표시, `CONFIG.MESSAGE_DURATION_MS` 후 `onClear`(`useEffect` + `setTimeout`, cleanup).
  기존 `.message-box`. **2000 직접 쓰지 말 것.**

---

## 6. 유틸 / 상수

### constants/items.js
```js
export const ITEM_IMAGES = [
  'bed.png', 'book.png', 'box.png', 'cookie.png',
  'diamond_stone.png', 'diamond.png', 'frog.png', 'gok.png',
  'grass.png', 'jakupdae.png', 'star.png', 'stone.png',
  'tnt.png', 'torch.png', 'totem.png', 'wood.png',
];
```

### constants/config.js  ← (피드백 반영: 매직넘버를 한 곳에)
레이아웃·제한·타이밍 수치를 **여기 한 곳**에 모은다. 컴포넌트/핸들러/유틸은 이 값을 import 해서 쓰고,
숫자(27, 3, 3000, 2000 …)를 코드에 직접 박지 않는다.
```js
export const CONFIG = {
  MAX_SLOTS: 27,               // 슬롯 개수 (3행 × 9열)
  MAX_ACHIEVEMENTS: 3,         // 동시에 떠 있는 알림 최대 개수
  MESSAGE_DURATION_MS: 2000,   // 안내 토스트 표시 시간
  ACHIEVE_DISPLAY_MS: 3000,    // 업적 알림 유지 시간
  ACHIEVE_SLIDE_OUT_MS: 400,   // 슬라이드 아웃 시간
  ACHIEVE_WIDTH: 360,          // 알림 가로(px)
  ACHIEVE_GAP: 8,              // 알림 간 세로 간격(px)
  ACHIEVE_TOP_BASE: 20,        // 첫 알림 top(px)
  DEFAULT_PRIORITY: 32,        // 우선순위 기본값
};
```
> 알림 높이는 이미지 비율로 계산(`ACHIEVE_WIDTH * 418 / 2144`)하거나 위 객체에 추가해도 된다.
> CSS의 픽셀 위치(슬롯 좌표 등)는 그대로 `minecraft.css`에 둔다. 위 config는 **JS에서 쓰는** 수치만 모은 것.
> (원하면 나중에 CSS 좌표도 CSS 변수로 묶을 수 있지만 이번 과제 범위 밖.)

### utils/date.js (순수 함수)
- `getDateString(date)` → `"YYYY-MM-DD"` (로컬 타임존 기준, `toISOString` 쓰지 말 것).
- `getKoreanDateString(date)` → `"YYYY년 M월 D일"`.
- `getTodoDateKey(todo)` → `todo.createdAt.split('T')[0]`.
- `getWeekDays(date)` → 그 주의 월~일 `Date[7]` (일요일=0 보정).

### utils/slots.js (순수 함수 — 상태를 직접 바꾸지 않음)
- `getRandomItemImage()` → `ITEM_IMAGES` 중 랜덤.
- `getFirstEmptySlotIndex(todos, viewDate)` → 해당 날짜의 **active** todo가 차지한 슬롯을 제외한 첫 빈 번호(0~`MAX_SLOTS-1`), 없으면 -1.
- `computeSlotItems(todos, viewDate, filter)` → 길이 `MAX_SLOTS` 배열, 각 칸 `null | { todo, isDone }` (아래 7번 규칙).

---

## 7. 슬롯 렌더링 규칙 (computeSlotItems)

```text
computeSlotItems(todos, viewDate, filter):
  todayKey = getDateString(viewDate)
  dayTodos = todos where getTodoDateKey(t) === todayKey   // ← 날짜로 먼저 거른다 (슬롯 충돌 방지의 핵심)
  slots    = Array(MAX_SLOTS).fill(null)

  if filter === 'done':
    dayTodos(status==='done').forEach((todo, i):
      if i < MAX_SLOTS: slots[i] = { todo, isDone:true })

  else if filter === 'all':
    active   = dayTodos(status==='active')
    occupied = Set(active.map(slotIndex))
    active.forEach(todo:
      if slots[todo.slotIndex] exists: slots[todo.slotIndex] = { todo, isDone:false })
    // 완료 항목은 남은 빈 슬롯에 순서대로(흑백)
    ptr = 0
    dayTodos(status==='done').forEach(todo:
      while ptr < MAX_SLOTS and occupied.has(ptr): ptr++
      if ptr >= MAX_SLOTS: return
      slots[ptr] = { todo, isDone:true }
      occupied.add(ptr); ptr++)

  else:  // 'active'
    dayTodos(status==='active').forEach(todo:
      if slots[todo.slotIndex] exists: slots[todo.slotIndex] = { todo, isDone:false })

  return slots
```

```text
getFirstEmptySlotIndex(todos, viewDate):
  todayKey = getDateString(viewDate)
  occupied = Set( todos where status==='active' and getTodoDateKey===todayKey -> slotIndex )
  for i in 0..MAX_SLOTS-1: if not occupied.has(i): return i
  return -1
```

---

## 8. CSS / 에셋 처리

- 기존 `style.css` → `src/styles/minecraft.css`로 **그대로 복사**.
  - `@font-face`의 `url('fonts/...')` → **`url('/fonts/Galmuri-v2.40.3/Galmuri11.woff2')`** 처럼 루트 절대경로로만 수정.
- `src/index.css`:
  ```css
  @import "tailwindcss";
  @import "./styles/minecraft.css";
  ```
- 모든 이미지 src는 `/assets/...` 절대경로(`public/` 기준).
- 컴포넌트는 기존 className을 그대로 쓴다 → CSS 수정 거의 없이 동작.

---

## 9. 동작 세부 사항 & 불변식 (원본과 동일하게 / 검증 포인트)

- 빈 제목 추가 시 → `message = '제목을 입력해주세요.'`
- 빈 슬롯 없을 때 추가 시 → `message = '인벤토리가 가득 찼습니다.'`
- 인벤토리 꽉참 판정은 **active만** 기준(완료 항목은 카운트 제외).
- **완료 탭에서 추가**하면 진행중(active) 탭으로 자동 전환.
- 우선순위 기본값 `CONFIG.DEFAULT_PRIORITY`. 마감 input min = 오늘. add 기본 마감 = 현재 보고 있는 날짜.
- 날짜 이동/패널 토글 시 `currentFilter` 유지.
- `map` 렌더에는 **`key={todo.id}`** (index 금지) — "unique key" 경고 방지.
- `Date`는 전부 새 객체로 교체(`new Date(prev)` 후 `setDate`).

**검증해야 할 불변식 (피드백 반영):**
- **슬롯 충돌 없음:** 다른 날짜의 같은 `slotIndex` todo는 서로 영향 없음 (computeSlotItems가 날짜로 먼저 거름).
- **개수 일치:** 같은 날짜에서 `전체(all)` 탭에 보이는 개수 == `진행중` 개수 + `완료` 개수.
- **알림 큐 한도:** 화면의 알림은 항상 `CONFIG.MAX_ACHIEVEMENTS` 이하, 초과 시 가장 오래된 것부터 제거.
- **관심사 분리:** utils의 compute/계산 함수는 상태를 바꾸지 않는다(순수). 상태 변경은 App 핸들러에서만.
- **매직넘버 0개:** 컴포넌트/핸들러/유틸에 숫자 리터럴 대신 `CONFIG`/상수 사용.