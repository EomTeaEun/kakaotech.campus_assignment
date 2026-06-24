"use client";

import { useRef, useLayoutEffect, useState } from "react";
import type { Todo } from "../lib/types";

interface SlotTooltipProps {
  todo: Todo;
  x: number;
  y: number;
}

export default function SlotTooltip({ todo, x, y }: SlotTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 14, top: y + 14 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const { offsetWidth: tw, offsetHeight: th } = ref.current;
    setPos({
      left: x + tw > window.innerWidth ? x - tw - 8 : x + 14,
      top: y + th > window.innerHeight ? y - th - 8 : y + 14,
    });
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="slot-tooltip"
      style={{ display: "block", position: "fixed", left: pos.left, top: pos.top }}
    >
      <div className="tooltip-title">{todo.text}</div>
      {todo.detail && <div className="tooltip-row">📝 {todo.detail}</div>}
      {todo.deadline && <div className="tooltip-row">📅 마감: {todo.deadline}</div>}
      <div className="tooltip-row">⭐ 우선순위: {todo.priority}</div>
      {todo.status === "done" && <div className="tooltip-row">✅ 완료됨</div>}
    </div>
  );
}
