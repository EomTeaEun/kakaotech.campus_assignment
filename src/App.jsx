import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from './constants/config.js';
import { getDateString } from './utils/date.js';
import { getRandomItemImage, getFirstEmptySlotIndex, computeSlotItems } from './utils/slots.js';
import DateNavigator from './components/DateNavigator.jsx';
import AddTodoButton from './components/AddTodoButton.jsx';
import FilterTabs from './components/FilterTabs.jsx';
import InventoryGrid from './components/InventoryGrid.jsx';
import TodoListPanel from './components/TodoListPanel.jsx';
import TodoModal from './components/TodoModal.jsx';
import AchievementBar from './components/AchievementBar.jsx';
import MessageToast from './components/MessageToast.jsx';

export default function App() {
  const [todos, setTodos] = useState(() => {
    try { const raw = localStorage.getItem('todos'); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem('todos', JSON.stringify(todos)); }, [todos]);
  const [currentFilter, setCurrentFilter] = useState('active');
  const [panelViewMode, setPanelViewMode] = useState('daily');
  const [achievements, setAchievements] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', todoId: null });
  const [message, setMessage] = useState('');

  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  function handlePrevDate() {
    const d = new Date(currentViewDate);
    d.setDate(d.getDate() - 1);
    setCurrentViewDate(d);
  }

  function handleNextDate() {
    const d = new Date(currentViewDate);
    d.setDate(d.getDate() + 1);
    setCurrentViewDate(d);
  }

  const slotItems = computeSlotItems(todos, currentViewDate, currentFilter);
  const currentTodo = todos.find(t => t.id === modal.todoId) ?? null;

  function openModal(mode, todoId = null) {
    setModal({ isOpen: true, mode, todoId });
  }

  function closeModal() {
    setModal({ isOpen: false, mode: 'add', todoId: null });
  }

  function handleAddTodo(form) {
    if (!form.title.trim()) {
      setMessage('제목을 입력해주세요.');
      return;
    }
    const slotIndex = getFirstEmptySlotIndex(todos, currentViewDate);
    if (slotIndex === -1) {
      setMessage('인벤토리가 가득 찼습니다.');
      return;
    }
    setTodos(prev => [...prev, {
      id: Date.now(),
      text: form.title.trim(),
      detail: form.detail.trim(),
      deadline: form.deadline,
      priority: form.priority,
      status: 'active',
      itemImage: getRandomItemImage(),
      slotIndex,
      createdAt: getDateString(currentViewDate),
    }]);
    if (currentFilter === 'done') setCurrentFilter('active');
    closeModal();
  }

  function handleSaveEdit(form) {
    if (!form.title.trim()) {
      setMessage('제목을 입력해주세요.');
      return;
    }
    setTodos(prev => prev.map(t =>
      t.id === modal.todoId
        ? { ...t, text: form.title.trim(), detail: form.detail.trim(), deadline: form.deadline, priority: form.priority }
        : t
    ));
    closeModal();
  }

  function handleDeleteTodo() {
    setTodos(prev => prev.filter(t => t.id !== modal.todoId));
    closeModal();
  }

  function handleCompleteTodo() {
    const todo = todos.find(t => t.id === modal.todoId);
    setTodos(prev => prev.map(t =>
      t.id === modal.todoId ? { ...t, status: 'done' } : t
    ));
    if (todo) {
      setAchievements(prev => {
        const next = [...prev, { id: Date.now(), todo }];
        return next.length > CONFIG.MAX_ACHIEVEMENTS
          ? next.slice(next.length - CONFIG.MAX_ACHIEVEMENTS)
          : next;
      });
    }
    closeModal();
  }

  const handleAchievementExpire = useCallback((id) => {
    setAchievements(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearMessage = useCallback(() => setMessage(''), []);

  function handleSelectDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    setCurrentViewDate(new Date(y, m - 1, d));
    setPanelViewMode('daily');
  }

  function handleSlotClick(todo, isDone) {
    openModal(isDone ? 'done-view' : 'edit', todo.id);
  }

  return (
    <>
      <div className="app-container">
        <div className="inventory-wrapper">
          <img src="/assets/background.jpeg" alt="Minecraft Inventory" className="inventory-bg" />

          <DateNavigator currentDate={currentViewDate} onPrev={handlePrevDate} onNext={handleNextDate} />
          <AddTodoButton onClick={() => openModal('add')} />
          <FilterTabs currentFilter={currentFilter} onChange={setCurrentFilter} />
          <InventoryGrid slotItems={slotItems} onSlotClick={handleSlotClick} />
          <TodoListPanel
            todos={todos}
            currentViewDate={currentViewDate}
            currentFilter={currentFilter}
            panelViewMode={panelViewMode}
            onToggleMode={setPanelViewMode}
            onSelectDate={handleSelectDate}
          />
        </div>
      </div>

      {modal.isOpen && (
        <TodoModal
          key={`${modal.mode}-${modal.todoId}`}
          mode={modal.mode}
          todo={currentTodo}
          viewDate={currentViewDate}
          onConfirm={modal.mode === 'add' ? handleAddTodo : handleSaveEdit}
          onClose={closeModal}
          onDelete={handleDeleteTodo}
          onComplete={handleCompleteTodo}
        />
      )}
      <AchievementBar achievements={achievements} onExpire={handleAchievementExpire} />
      <MessageToast message={message} onClear={clearMessage} />
    </>
  );
}
