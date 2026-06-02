/* =============================================
   Minecraft Todo App — app.js
   ============================================= */

// assets/items/ 폴더의 아이템 PNG 목록
const ITEM_IMAGES = [
  'bed.png', 'book.png', 'box.png', 'cookie.png',
  'diamond_stone.png', 'diamond.png', 'frog.png', 'gok.png',
  'grass.png', 'jakupdae.png', 'star.png', 'stone.png',
  'tnt.png', 'torch.png', 'totem.png', 'wood.png'
];

const MAX_SLOTS = 27;
const MAX_ACHIEVEMENTS = 3;
const ACHIEVE_WIDTH    = 360;
const ACHIEVE_HEIGHT   = Math.round(ACHIEVE_WIDTH * 418 / 2144); // ≈ 70px
const ACHIEVE_GAP      = 8;
const ACHIEVE_TOP_BASE = 20;

// ─── Todo 저장소 ────────────────────────────────
let todos = [];

// ─── 업적 알림 상태 ──────────────────────────────
let activeAchievements = [];

// ─── 날짜 뷰 상태 ────────────────────────────────
let currentViewDate = new Date();
currentViewDate.setHours(0, 0, 0, 0);

// ─── 필터 / 모달 상태 ───────────────────────────
let currentFilter = 'all';   // 'all' | 'active' | 'done'
let modalMode     = 'add';   // 'add' | 'edit' | 'done-view'
let currentTodoId = null;
let isEditingText = false;   // edit 모드에서 수정 버튼 눌렀는지
let panelViewMode = 'daily'; // 'daily' | 'weekly'

// ─── DOM 캐싱 ────────────────────────────────────
// (날짜 관련 DOM은 하단 이벤트 바인딩 섹션에서 캐싱)
const inventoryGrid  = document.getElementById('inventoryGrid');
const addTodoBtn     = document.getElementById('addTodoBtn');
const todoModal      = document.getElementById('todoModal');
const slotTooltip    = document.getElementById('slotTooltip');
const filterTabs     = document.getElementById('filterTabs');
const modalButtons   = document.querySelector('.todo-modal-buttons');

// 모달 필드
const titleInput     = document.getElementById('todoTitle');
const detailInput    = document.getElementById('todoDetail');
const deadlineInput  = document.getElementById('todoDeadline');
const prioritySlider = document.getElementById('todoPriority');
const priorityValue  = document.getElementById('priorityValue');

// 모달 버튼
const btnConfirm  = document.getElementById('btnConfirm');
const btnClose    = document.getElementById('btnClose');
const btnEdit     = document.getElementById('btnEdit');
const btnDelete   = document.getElementById('btnDelete');
const btnComplete = document.getElementById('btnComplete');

// ─── 유틸 ───────────────────────────────────────

function getRandomItemImage() {
  return ITEM_IMAGES[Math.floor(Math.random() * ITEM_IMAGES.length)];
}

/* Date → "2025-06-01" 형식 문자열 (로컬 타임존 기준) */
function getDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* Date → "2025년 6월 1일" 한국어 표기 */
function getKoreanDateString(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/* Todo의 날짜 키 반환 (전체 ISO 문자열 및 날짜만 있는 포맷 모두 대응) */
function getTodoDateKey(todo) {
  return todo.createdAt.split('T')[0];
}

/* 날짜 표시 갱신 */
function updateDateDisplay() {
  document.getElementById('dateText').textContent = getKoreanDateString(currentViewDate);
}

/* 현재 날짜 기준 활성 todo가 없는 첫 번째 빈 슬롯 번호 반환 (-1: 전부 사용 중) */
function getFirstEmptySlotIndex() {
  const todayKey = getDateString(currentViewDate);
  const occupied = new Set(
    todos
      .filter(t => t.status === 'active' && getTodoDateKey(t) === todayKey)
      .map(t => t.slotIndex)
  );
  for (let i = 0; i < MAX_SLOTS; i++) {
    if (!occupied.has(i)) return i;
  }
  return -1;
}

/* 안내 메시지 2초 표시 */
function showMessage(text) {
  const existing = document.getElementById('messageBox');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.id = 'messageBox';
  box.className = 'message-box';
  box.textContent = text;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2000);
}

// ─── localStorage ───────────────────────────────

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
  try {
    const raw = localStorage.getItem('todos');
    todos = raw ? JSON.parse(raw) : [];
  } catch {
    todos = [];
  }
}

// ─── 업적 알림 ──────────────────────────────────

function updateAchievementPositions() {
  activeAchievements.forEach((entry, i) => {
    entry.el.style.top = (ACHIEVE_TOP_BASE + i * (ACHIEVE_HEIGHT + ACHIEVE_GAP)) + 'px';
  });
}

function removeAchievement(entry, immediate) {
  clearTimeout(entry.timeoutId);
  const el = entry.el;

  const cleanup = () => {
    el.remove();
    activeAchievements = activeAchievements.filter(a => a !== entry);
    updateAchievementPositions();
  };

  if (immediate) {
    cleanup();
  } else {
    el.classList.remove('slide-in');
    el.classList.add('slide-out');
    setTimeout(cleanup, 400);
  }
}

function showAchievement(todo) {
  if (activeAchievements.length >= MAX_ACHIEVEMENTS) {
    removeAchievement(activeAchievements[0], true);
  }

  const bar = document.createElement('div');
  bar.className = 'achieve-bar';
  bar.innerHTML = `
    <div class="achieve-bar-inner">
      <img src="assets/achieve_bar.png" class="achieve-bar-bg" alt="">
      <div class="achieve-bar-content">
        <img src="assets/items/${todo.itemImage}" class="achieve-item-img" alt="">
        <div class="achieve-text">
          <div class="achieve-title">${todo.text} 도전과제 달성!</div>
          <div class="achieve-detail">${todo.text}</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(bar);

  const entry = { el: bar, timeoutId: null };
  activeAchievements.push(entry);
  updateAchievementPositions();

  requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('slide-in')));

  entry.timeoutId = setTimeout(() => removeAchievement(entry, false), 3000);
}

// ─── 필터 탭 ────────────────────────────────────

function setFilter(filter) {
  currentFilter = filter;

  filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });

  renderSlots();
}

// ─── 슬롯 렌더링 ────────────────────────────────

function renderSlots() {
  const slots = inventoryGrid.querySelectorAll('.inventory-slot');

  slots.forEach(slot => {
    slot.innerHTML = '';
    slot.classList.remove('occupied', 'done-item');
    delete slot.dataset.todoId;
  });

  // 현재 선택된 날짜의 todo만 대상으로 함
  const todayKey  = getDateString(currentViewDate);
  const dayTodos  = todos.filter(t => getTodoDateKey(t) === todayKey);

  if (currentFilter === 'done') {
    dayTodos.filter(t => t.status === 'done').forEach((todo, i) => {
      const slot = slots[i];
      if (!slot) return;

      slot.classList.add('occupied', 'done-item');
      slot.dataset.todoId = todo.id;

      const img = document.createElement('img');
      img.src = `assets/items/${todo.itemImage}`;
      img.alt = todo.text;
      img.className = 'slot-item-img';
      slot.appendChild(img);

      const pri = document.createElement('span');
      pri.className = 'slot-priority';
      pri.textContent = todo.priority;
      slot.appendChild(pri);
    });
  } else {
    dayTodos.filter(t => t.status === 'active').forEach(todo => {
      const slot = slots[todo.slotIndex];
      if (!slot) return;

      slot.classList.add('occupied');

      const img = document.createElement('img');
      img.src = `assets/items/${todo.itemImage}`;
      img.alt = todo.text;
      img.className = 'slot-item-img';
      slot.appendChild(img);

      const pri = document.createElement('span');
      pri.className = 'slot-priority';
      pri.textContent = todo.priority;
      slot.appendChild(pri);
    });
  }

  renderTodoList();
}

// ─── 상시 Todo 목록 패널 ─────────────────────────

/* todo 한 행 HTML 생성 / dateKey: 주간 뷰에서 날짜 이동용 */
function renderTodoItem(todo, dateKey = '') {
  const doneClass   = todo.status === 'done' ? ' done' : '';
  const imgStyle    = todo.status === 'done' ? ' style="filter:grayscale(100%);opacity:0.6"' : '';
  const deadline    = todo.deadline ? `<span class="tl-deadline">~${todo.deadline}</span>` : '';
  const dateAttr    = dateKey ? ` data-date="${dateKey}"` : '';
  const cursorStyle = dateKey ? ' style="cursor:pointer"' : '';
  return `
    <div class="tl-item"${dateAttr}${cursorStyle}>
      <img src="assets/items/${todo.itemImage}" class="tl-icon-img"${imgStyle}>
      <div class="tl-name-wrap">
        <span class="tl-title${doneClass}">${todo.text}</span>
        ${deadline}
      </div>
      <span class="tl-priority">${todo.priority}</span>
    </div>`;
}

/* currentViewDate가 속한 주의 월~일 Date 배열 반환 */
function getWeekDays(date) {
  const d   = new Date(date);
  const day = d.getDay(); // 0=일
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon);
    dd.setDate(mon.getDate() + i);
    return dd;
  });
}

function renderTodoList() {
  const panel = document.getElementById('todoListPanel');

  const toggleHTML = `
    <div class="tl-toggle">
      <span class="tl-toggle-btn${panelViewMode === 'daily'  ? ' active' : ''}" data-mode="daily">일간</span>
      <span class="tl-toggle-btn${panelViewMode === 'weekly' ? ' active' : ''}" data-mode="weekly">주간</span>
    </div>`;

  const filterTodos = (list) => (currentFilter === 'done'
    ? list.filter(t => t.status === 'done')
    : list.filter(t => t.status === 'active')
  ).sort((a, b) => b.priority - a.priority);

  let contentHTML = '';

  if (panelViewMode === 'daily') {
    const todayKey = getDateString(currentViewDate);
    const filtered = filterTodos(todos.filter(t => getTodoDateKey(t) === todayKey));
    const filterLabel = currentFilter === 'done' ? '완료' : currentFilter === 'active' ? '진행중' : '전체';

    contentHTML = filtered.length === 0
      ? `<div class="tl-empty">할 일 없음</div>`
      : `<div class="tl-header">📝 ${filterLabel} (${filtered.length})</div>${filtered.map(renderTodoItem).join('')}`;

  } else {
    const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
    const realTodayKey = getDateString(new Date());

    const groups = getWeekDays(currentViewDate)
      .map(day => {
        const key      = getDateString(day);
        const filtered = filterTodos(todos.filter(t => getTodoDateKey(t) === key));
        return { day, key, filtered };
      })
      .filter(g => g.filtered.length > 0);

    if (groups.length === 0) {
      contentHTML = `<div class="tl-empty">이번 주 할 일 없음</div>`;
    } else {
      contentHTML = groups.map(({ day, key, filtered }) => {
        const isToday  = key === realTodayKey;
        const label    = `${day.getMonth() + 1}월 ${day.getDate()}일 (${DAY_NAMES[day.getDay()]})`;
        return `
          <div class="tl-day-group">
            <div class="tl-day-header${isToday ? ' today' : ''}">${label} · ${filtered.length}개</div>
            ${filtered.map(todo => renderTodoItem(todo, key)).join('')}
          </div>`;
      }).join('');
    }
  }

  panel.innerHTML = toggleHTML + contentHTML;
}

// ─── 슬롯 호버 툴팁 ─────────────────────────────

let lastHoveredSlot = null;

inventoryGrid.addEventListener('mousemove', (e) => {
  const slot = e.target.closest('.inventory-slot.occupied');

  if (!slot) {
    slotTooltip.style.display = 'none';
    lastHoveredSlot = null;
    return;
  }

  if (slot !== lastHoveredSlot) {
    lastHoveredSlot = slot;

    let todo;
    if (slot.classList.contains('done-item')) {
      // 완료 탭: data-todo-id로 todo 조회
      const todoId = parseInt(slot.dataset.todoId);
      todo = todos.find(t => t.id === todoId);
    } else {
      // 진행중/전체 탭: slotIndex + 날짜로 조회
      const idx      = parseInt(slot.dataset.slotIndex);
      const todayKey = getDateString(currentViewDate);
      todo = todos.find(t => t.slotIndex === idx && t.status === 'active' && getTodoDateKey(t) === todayKey);
    }

    if (!todo) return;

    const deadlineText = todo.deadline
      ? `<div class="tooltip-row">📅 마감: ${todo.deadline}</div>`
      : '';
    const detailText = todo.detail
      ? `<div class="tooltip-row">📝 ${todo.detail}</div>`
      : '';
    const statusText = todo.status === 'done'
      ? `<div class="tooltip-row">✅ 완료됨</div>`
      : '';

    slotTooltip.innerHTML = `
      <div class="tooltip-title">${todo.text}</div>
      ${detailText}
      ${deadlineText}
      <div class="tooltip-row">⭐ 우선순위: ${todo.priority}</div>
      ${statusText}
    `;
  }

  slotTooltip.style.display = 'block';

  const tw = slotTooltip.offsetWidth;
  const th = slotTooltip.offsetHeight;
  const x  = e.clientX + 14;
  const y  = e.clientY + 14;

  slotTooltip.style.left = (x + tw > window.innerWidth  ? e.clientX - tw - 8 : x) + 'px';
  slotTooltip.style.top  = (y + th > window.innerHeight ? e.clientY - th - 8 : y) + 'px';
});

inventoryGrid.addEventListener('mouseleave', () => {
  slotTooltip.style.display = 'none';
  lastHoveredSlot = null;
});

// ─── 모달 버튼 표시 상태 ─────────────────────────

function updateModalButtons() {
  if (modalMode === 'add') {
    // 추가 모드: 확인 + 닫기
    btnConfirm.style.display  = 'flex';
    btnClose.style.display    = 'flex';
    btnEdit.style.display     = 'none';
    btnDelete.style.display   = 'none';
    btnComplete.style.display = 'none';
  } else if (modalMode === 'done-view') {
    // 완료 아이템 보기: 삭제 + 닫기
    btnConfirm.style.display  = 'none';
    btnClose.style.display    = 'flex';
    btnEdit.style.display     = 'none';
    btnDelete.style.display   = 'flex';
    btnComplete.style.display = 'none';
  } else if (isEditingText) {
    // 수정 입력 중: 확인만
    btnConfirm.style.display  = 'flex';
    btnClose.style.display    = 'none';
    btnEdit.style.display     = 'none';
    btnDelete.style.display   = 'none';
    btnComplete.style.display = 'none';
  } else {
    // 보기 모드: 닫기 + 수정 + 삭제 + 완료
    btnConfirm.style.display  = 'none';
    btnClose.style.display    = 'flex';
    btnEdit.style.display     = 'flex';
    btnDelete.style.display   = 'flex';
    btnComplete.style.display = 'flex';
  }

  // 보이는 버튼이 2개일 때 two-btn 클래스 적용
  const visibleCount = [btnConfirm, btnClose, btnEdit, btnDelete, btnComplete]
    .filter(btn => btn.style.display === 'flex').length;
  modalButtons.classList.toggle('two-btn', visibleCount <= 2);
}

// ─── 모달 열기/닫기 ─────────────────────────────

function setFieldsEditable(editable) {
  titleInput.readOnly     = !editable;
  detailInput.readOnly    = !editable;
  deadlineInput.disabled  = !editable;
  prioritySlider.disabled = !editable;
}

/* mode: 'add' | 'edit' | 'done-view' */
function openModal(mode, todoId = null) {
  modalMode     = mode;
  currentTodoId = todoId;
  isEditingText = false;

  deadlineInput.min = getDateString(new Date()); // 오늘 이전 날짜 선택 불가

  if (mode === 'add') {
    titleInput.value           = '';
    detailInput.value          = '';
    deadlineInput.value        = getDateString(currentViewDate);
    prioritySlider.value       = 32;
    priorityValue.textContent  = '32';
    setFieldsEditable(true);
    setTimeout(() => titleInput.focus(), 50);
  } else {
    // 'edit' 또는 'done-view': 기존 todo 표시, 읽기 전용
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    titleInput.value           = todo.text;
    detailInput.value          = todo.detail   || '';
    deadlineInput.value        = todo.deadline || '';
    prioritySlider.value       = todo.priority ?? 32;
    priorityValue.textContent  = todo.priority ?? 32;
    setFieldsEditable(false);
  }

  updateModalButtons();
  todoModal.classList.add('active');
}

function closeModal() {
  todoModal.classList.remove('active');
  currentTodoId = null;
  isEditingText = false;
  setFieldsEditable(true);
}

// ─── CRUD ───────────────────────────────────────

/* Todo 추가 */
function addTodo() {
  const text = titleInput.value.trim();

  if (!text) {
    showMessage('제목을 입력해주세요.');
    return;
  }

  const slotIndex = getFirstEmptySlotIndex();
  if (slotIndex === -1) {
    showMessage('인벤토리가 가득 찼습니다.');
    return;
  }

  todos.push({
    id:        Date.now(),
    text,
    detail:    detailInput.value.trim(),
    deadline:  deadlineInput.value,
    priority:  parseInt(prioritySlider.value),
    status:    'active',
    itemImage: getRandomItemImage(),
    slotIndex,
    createdAt: getDateString(currentViewDate)
  });

  saveTodos();

  // 완료 탭에서 추가하면 진행중 탭으로 전환
  if (currentFilter === 'done') {
    setFilter('active');
  } else {
    renderSlots();
  }
  closeModal();
}

/* 수정 모드 전환 */
function enableEditing() {
  isEditingText = true;
  setFieldsEditable(true);
  titleInput.focus();
  const len = titleInput.value.length;
  titleInput.setSelectionRange(len, len);
  updateModalButtons();
}

/* 수정 내용 저장 */
function saveEdit() {
  const text = titleInput.value.trim();
  if (!text) {
    showMessage('제목을 입력해주세요.');
    return;
  }

  const todo = todos.find(t => t.id === currentTodoId);
  if (todo) {
    todo.text     = text;
    todo.detail   = detailInput.value.trim();
    todo.deadline = deadlineInput.value;
    todo.priority = parseInt(prioritySlider.value);
  }

  saveTodos();
  renderSlots();
  closeModal();
}

/* Todo 삭제 */
function deleteTodo() {
  todos = todos.filter(t => t.id !== currentTodoId);
  saveTodos();
  renderSlots();
  closeModal();
}

/* Todo 완료 */
function completeTodo() {
  const todo = todos.find(t => t.id === currentTodoId);
  if (todo) {
    todo.status = 'done';
    showAchievement(todo);
  }

  saveTodos();
  renderSlots();
  closeModal();
}

// ─── 이벤트 바인딩 ──────────────────────────────

addTodoBtn.addEventListener('click', () => openModal('add'));

btnConfirm.addEventListener('click', () => {
  if (modalMode === 'add') addTodo();
  else saveEdit();
});

btnClose.addEventListener('click', closeModal);
btnEdit.addEventListener('click', enableEditing);
btnDelete.addEventListener('click', deleteTodo);
btnComplete.addEventListener('click', completeTodo);

/* 필터 탭 클릭 */
filterTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  setFilter(tab.dataset.filter);
});

/* 슬롯 클릭: 아이템 있는 슬롯만 모달 오픈 */
inventoryGrid.addEventListener('click', (e) => {
  const slot = e.target.closest('.inventory-slot.occupied');
  if (!slot) return;

  slotTooltip.style.display = 'none';

  if (slot.classList.contains('done-item')) {
    // 완료 탭의 슬롯: done-view 모달
    const todoId = parseInt(slot.dataset.todoId);
    openModal('done-view', todoId);
  } else {
    // 진행중/전체 탭의 슬롯: edit 모달 (날짜 필터 포함)
    const idx      = parseInt(slot.dataset.slotIndex);
    const todayKey = getDateString(currentViewDate);
    const todo     = todos.find(t => t.slotIndex === idx && t.status === 'active' && getTodoDateKey(t) === todayKey);
    if (!todo) return;
    openModal('edit', todo.id);
  }
});

/* 패널 일간/주간 토글 + 주간 아이템 클릭 시 날짜 이동 */
document.getElementById('todoListPanel').addEventListener('click', (e) => {
  const btn = e.target.closest('.tl-toggle-btn');
  if (btn) {
    panelViewMode = btn.dataset.mode;
    renderTodoList();
    return;
  }

  if (panelViewMode === 'weekly') {
    const item = e.target.closest('.tl-item[data-date]');
    if (!item) return;
    const [y, m, d] = item.dataset.date.split('-').map(Number);
    currentViewDate = new Date(y, m - 1, d);
    panelViewMode = 'daily';
    updateDateDisplay();
    renderSlots();
  }
});

/* 우선순위 슬라이더 실시간 값 표시 */
prioritySlider.addEventListener('input', () => {
  priorityValue.textContent = prioritySlider.value;
});

/* 오버레이 클릭으로 모달 닫기 */
todoModal.addEventListener('click', (e) => {
  if (e.target === todoModal) closeModal();
});

/* ESC 키로 모달 닫기 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ─── 날짜 네비게이션 이벤트 ──────────────────────

document.getElementById('datePrev').addEventListener('click', () => {
  currentViewDate.setDate(currentViewDate.getDate() - 1);
  updateDateDisplay();
  renderSlots();
});

document.getElementById('dateNext').addEventListener('click', () => {
  currentViewDate.setDate(currentViewDate.getDate() + 1);
  updateDateDisplay();
  renderSlots();
});

// ─── 초기화 ─────────────────────────────────────
loadTodos();
updateDateDisplay();
setFilter('active'); // 복원 후 진행중 탭으로 시작
