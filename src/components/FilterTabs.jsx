const TABS = [
  { filter: 'all', label: '전체' },
  { filter: 'active', label: '진행중' },
  { filter: 'done', label: '완료' },
];

export default function FilterTabs({ currentFilter, onChange }) {
  return (
    <div className="filter-tabs" id="filterTabs">
      {TABS.map(({ filter, label }) => (
        <div
          key={filter}
          className={`filter-tab${currentFilter === filter ? ' active' : ''}`}
          onClick={() => onChange(filter)}
        >
          <img src="/assets/button.png" alt="" className="filter-tab-bg" />
          <span className="filter-tab-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
