"use client";

import { useState } from "react";
import InventorySlot from "./InventorySlot";
import SlotTooltip from "./SlotTooltip";
import type { SlotItem, Todo } from "../lib/types";

interface InventoryGridProps {
  slotItems: (SlotItem | null)[];
  onSlotClick: (todo: Todo, isDone: boolean) => void;
}

interface Hovered {
  todo: Todo;
  x: number;
  y: number;
}

export default function InventoryGrid({ slotItems, onSlotClick }: InventoryGridProps) {
  const [hovered, setHovered] = useState<Hovered | null>(null);

  return (
    <div
      className="inventory-grid"
      id="inventoryGrid"
      onMouseMove={(e) => {
        const target = e.target as HTMLElement;
        const slot = target.closest(".inventory-slot.occupied");
        if (!slot || !slot.parentElement) {
          setHovered(null);
          return;
        }
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
