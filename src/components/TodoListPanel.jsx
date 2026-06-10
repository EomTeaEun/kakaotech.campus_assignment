import { getDateString, getTodoDateKey, getWeekDays } from '../utils/date.js';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const FILTER_LABEL = { done: '완료', active: '진행중', all: '전체' };

function filterAndSort(todos, filter) {
  const list = filter === 'done'
    ? todos.filter(t => t.status === 'done')
    : todos.filter(t => t.status === 'active');
  return list.slice().sort((a, b) => b.priority - a.priority);
}

function TodoItem({ todo }) {
  return (
    <div className="tl-item">
      <img
        src={`/assets/items/${todo.itemImage}`}
        className="tl-icon-img"
        style={todo.status === 'done' ? { filter: 'grayscale(100%)', opacity: 0.6 } : undefined}
        alt=""
      />
      <div className="tl-name-wrap">
        <span className={`tl-title${todo.status === 'done' ? ' done' : ''}`}>{todo.text}</span>
        {todo.deadline && <span className="tl-deadline">~{todo.deadline}</span>}
      </div>
      <span className="tl-priority">{todo.priority}</span>
    </div>
  );
}

function DailyView({ todos, currentViewDate, currentFilter }) {
  const dayKey = getDateString(currentViewDate);
  const filtered = filterAndSort(
    todos.filter(t => getTodoDateKey(t) === dayKey),
    currentFilter
  );

  if (filtered.length === 0) return <div className="tl-empty">할 일 없음</div>;

  return (
    <>
      <div className="tl-header">📝 {FILTER_LABEL[currentFilter]} ({filtered.length})</div>
      {filtered.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </>
  );
}

function WeeklyView({ todos, currentViewDate, currentFilter, onSelectDate }) {
  const todayKey = getDateString(new Date());

  return (
    <>
      {getWeekDays(currentViewDate).map(day => {
        const key = getDateString(day);
        const filtered = filterAndSort(
          todos.filter(t => getTodoDateKey(t) === key),
          currentFilter
        );
        const isToday = key === todayKey;
        const label = `${day.getMonth() + 1}월 ${day.getDate()}일 (${DAY_NAMES[day.getDay()]})`;

        return (
          <div key={key} className="tl-day-group">
            <div
              className={`tl-day-header${isToday ? ' today' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectDate(key)}
            >
              {label} · {filtered.length}개
            </div>
            {filtered.length === 0
              ? <div className="tl-empty tl-empty-week">todo가 없습니다</div>
              : filtered.map(todo => <TodoItem key={todo.id} todo={todo} />)
            }
          </div>
        );
      })}
    </>
  );
}

export default function TodoListPanel({ todos, currentViewDate, currentFilter, panelViewMode, onToggleMode, onSelectDate }) {
  return (
    <div className="todo-list-panel" id="todoListPanel">
      <div className="tl-toggle">
        <span
          className={`tl-toggle-btn${panelViewMode === 'daily' ? ' active' : ''}`}
          onClick={() => onToggleMode('daily')}
        >일간</span>
        <span
          className={`tl-toggle-btn${panelViewMode === 'weekly' ? ' active' : ''}`}
          onClick={() => onToggleMode('weekly')}
        >주간</span>
      </div>

      {panelViewMode === 'daily'
        ? <DailyView todos={todos} currentViewDate={currentViewDate} currentFilter={currentFilter} />
        : <WeeklyView todos={todos} currentViewDate={currentViewDate} currentFilter={currentFilter} onSelectDate={onSelectDate} />
      }
    </div>
  );
}
