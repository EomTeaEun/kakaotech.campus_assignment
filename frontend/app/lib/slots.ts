import { ITEM_IMAGES } from "./items";
import { CONFIG } from "./config";
import { getDateString, getTodoDateKey } from "./date";
import type { Todo, FilterType, SlotItem } from "./types";

export function getRandomItemImage(): string {
  return ITEM_IMAGES[Math.floor(Math.random() * ITEM_IMAGES.length)];
}

export function getFirstEmptySlotIndex(todos: Todo[], viewDate: Date): number {
  const todayKey = getDateString(viewDate);
  const occupied = new Set(
    todos
      .filter((t) => t.status === "active" && getTodoDateKey(t) === todayKey)
      .map((t) => t.slotIndex)
  );
  for (let i = 0; i < CONFIG.MAX_SLOTS; i++) {
    if (!occupied.has(i)) return i;
  }
  return -1;
}

export function computeSlotItems(
  todos: Todo[],
  viewDate: Date,
  filter: FilterType
): (SlotItem | null)[] {
  const todayKey = getDateString(viewDate);
  const dayTodos = todos.filter((t) => getTodoDateKey(t) === todayKey);
  const slots: (SlotItem | null)[] = Array(CONFIG.MAX_SLOTS).fill(null);

  if (filter === "done") {
    dayTodos.filter((t) => t.status === "done").forEach((todo, i) => {
      if (i < CONFIG.MAX_SLOTS) slots[i] = { todo, isDone: true };
    });
  } else if (filter === "all") {
    const active = dayTodos.filter((t) => t.status === "active");
    const occupied = new Set(active.map((t) => t.slotIndex));
    active.forEach((todo) => {
      if (todo.slotIndex < CONFIG.MAX_SLOTS) slots[todo.slotIndex] = { todo, isDone: false };
    });
    let ptr = 0;
    dayTodos.filter((t) => t.status === "done").forEach((todo) => {
      while (ptr < CONFIG.MAX_SLOTS && occupied.has(ptr)) ptr++;
      if (ptr >= CONFIG.MAX_SLOTS) return;
      slots[ptr] = { todo, isDone: true };
      occupied.add(ptr);
      ptr++;
    });
  } else {
    dayTodos.filter((t) => t.status === "active").forEach((todo) => {
      if (todo.slotIndex < CONFIG.MAX_SLOTS) slots[todo.slotIndex] = { todo, isDone: false };
    });
  }

  return slots;
}
