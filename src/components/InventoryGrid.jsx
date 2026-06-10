import { useState } from 'react';
import InventorySlot from './InventorySlot.jsx';
import SlotTooltip from './SlotTooltip.jsx';

export default function InventoryGrid({ slotItems, onSlotClick }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div
      className="inventory-grid"
      id="inventoryGrid"
      onMouseMove={(e) => {
        const slot = e.target.closest('.inventory-slot.occupied');
        if (!slot) { setHovered(null); return; }
        const index = [...slot.parentElement.children].indexOf(slot);
        const item = slotItems[index];
        if (item) setHovered({ todo: item.todo, x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => setHovered(null)}
    >
      {slotItems.map((item, i) => (
        <InventorySlot
          key={i}
          item={item}
          onClick={() => item && onSlotClick(item.todo, item.isDone)}
        />
      ))}
      {hovered && <SlotTooltip todo={hovered.todo} x={hovered.x} y={hovered.y} />}
    </div>
  );
}
