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

// ─── Todo 저장소 ────────────────────────────────
let todos = [];

// ─── 필터 / 모달 상태 ───────────────────────────
let currentFilter = 'all';   // 'all' | 'active' | 'done'
let modalMode     = 'add';   // 'add' | 'edit' | 'done-view'
let currentTodoId = null;
let isEditingText = false;   // edit 모드에서 수정 버튼 눌렀는지

// ─── DOM 캐싱 ────────────────────────────────────
const inventoryGrid  = document.getElementById('inventoryGrid');
const addTodoBtn     = document.getElementById('addTodoBtn');
const todoModal      = document.getElementById('todoModal');
const slotTooltip    = document.getElementById('slotTooltip');
const filterTabs     = document.getElementById('filterTabs');

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

/* 활성 todo가 없는 첫 번째 빈 슬롯 번호 반환 (-1: 전부 사용 중) */
function getFirstEmptySlotIndex() {
  const occupied = new Set(
    todos.filter(t => t.status === 'active').map(t => t.slotIndex)
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

  // 모든 슬롯 초기화
  slots.forEach(slot => {
    slot.innerHTML = '';
    slot.classList.remove('occupied', 'done-item');
    delete slot.dataset.todoId;
  });

  if (currentFilter === 'done') {
    // 완료 탭: done 상태 todo를 순서대로 슬롯에 배치 (흑백)
    const doneTodos = todos.filter(t => t.status === 'done');
    doneTodos.forEach((todo, i) => {
      const slot = slots[i];
      if (!slot) return;

      slot.classList.add('occupied', 'done-item');
      slot.dataset.todoId = todo.id;

      const img = document.createElement('img');
      img.src = `assets/items/${todo.itemImage}`;
      img.alt = todo.text;
      img.className = 'slot-item-img';
      slot.appendChild(img);
    });
  } else {
    // 전체 / 진행중 탭: active 상태 todo만 원래 슬롯 위치에 배치
    todos
      .filter(t => t.status === 'active')
      .forEach(todo => {
        const slot = slots[todo.slotIndex];
        if (!slot) return;

        slot.classList.add('occupied');

        const img = document.createElement('img');
        img.src = `assets/items/${todo.itemImage}`;
        img.alt = todo.text;
        img.className = 'slot-item-img';
        slot.appendChild(img);
      });
  }
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
      // 진행중/전체 탭: slotIndex로 조회
      const idx = parseInt(slot.dataset.slotIndex);
      todo = todos.find(t => t.slotIndex === idx && t.status === 'active');
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
    // 수정 입력 중: 확인 + 닫기 + 삭제 + 완료
    btnConfirm.style.display  = 'flex';
    btnClose.style.display    = 'flex';
    btnEdit.style.display     = 'none';
    btnDelete.style.display   = 'flex';
    btnComplete.style.display = 'flex';
  } else {
    // 보기 모드: 닫기 + 수정 + 삭제 + 완료
    btnConfirm.style.display  = 'none';
    btnClose.style.display    = 'flex';
    btnEdit.style.display     = 'flex';
    btnDelete.style.display   = 'flex';
    btnComplete.style.display = 'flex';
  }
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

  if (mode === 'add') {
    titleInput.value           = '';
    detailInput.value          = '';
    deadlineInput.value        = '';
    prioritySlider.value       = 50;
    priorityValue.textContent  = '50';
    setFieldsEditable(true);
    setTimeout(() => titleInput.focus(), 50);
  } else {
    // 'edit' 또는 'done-view': 기존 todo 표시, 읽기 전용
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    titleInput.value           = todo.text;
    detailInput.value          = todo.detail   || '';
    deadlineInput.value        = todo.deadline || '';
    prioritySlider.value       = todo.priority ?? 50;
    priorityValue.textContent  = todo.priority ?? 50;
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
    createdAt: new Date().toISOString()
  });

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

  renderSlots();
  closeModal();
}

/* Todo 삭제 */
function deleteTodo() {
  todos = todos.filter(t => t.id !== currentTodoId);
  renderSlots();
  closeModal();
}

/* Todo 완료 */
function completeTodo() {
  const todo = todos.find(t => t.id === currentTodoId);
  if (todo) todo.status = 'done';

  renderSlots();
  closeModal();
  // TODO: 달성 알림(achieve_bar.png) 표시 — 다음 단계에서 구현
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
    // 진행중/전체 탭의 슬롯: edit 모달
    const idx  = parseInt(slot.dataset.slotIndex);
    const todo = todos.find(t => t.slotIndex === idx && t.status === 'active');
    if (!todo) return;
    openModal('edit', todo.id);
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

// ─── 초기화 ─────────────────────────────────────
renderSlots();
