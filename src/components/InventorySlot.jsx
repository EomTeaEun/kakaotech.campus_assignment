export default function InventorySlot({ item, onClick, onMouseEnter, onMouseLeave }) {
  if (!item) {
    return <div className="inventory-slot" />;
  }

  const { todo, isDone } = item;
  return (
    <div
      className={`inventory-slot occupied${isDone ? ' done-item' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <img
        src={`/assets/items/${todo.itemImage}`}
        alt={todo.text}
        className="slot-item-img"
      />
      <span className="slot-priority">{todo.priority}</span>
    </div>
  );
}
