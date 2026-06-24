"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TodoModal from "./TodoModal";
import MessageToast from "./MessageToast";
import { getDateString } from "../lib/date";
import { getFirstEmptySlotIndex, getRandomItemImage } from "../lib/slots";
import { parseFilterParam } from "../lib/filter";
import { buildTodosQuery, parseSearchParam } from "../lib/search";
import type { Todo, TodoFormInput } from "../lib/types";

function parseViewDate(dateParam: string | null): Date {
  if (!dateParam) return new Date();
  const [y, m, d] = dateParam.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

interface NewTodoFormProps {
  todos: Todo[];
}

export default function NewTodoForm({ todos }: NewTodoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewDate = parseViewDate(searchParams.get("date"));
  const filter = parseFilterParam(searchParams.get("filter"));
  const search = parseSearchParam(searchParams.get("search"));
  const [message, setMessage] = useState("");

  async function handleConfirm(form: TodoFormInput) {
    if (!form.title.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }
    const slotIndex = getFirstEmptySlotIndex(todos, viewDate);
    if (slotIndex === -1) {
      setMessage("인벤토리가 가득 찼습니다.");
      return;
    }
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: form.title.trim(),
        detail: form.detail.trim(),
        deadline: form.deadline,
        priority: form.priority,
        itemImage: getRandomItemImage(),
        slotIndex,
        createdAt: getDateString(viewDate),
      }),
    });
    // 완료 탭에서 추가하면 active 탭으로 자동 전환 (2차 동작 동일)
    const nextFilter = filter === "done" ? "active" : filter;
    router.push(`/todos?${buildTodosQuery(nextFilter, search)}`);
    router.refresh();
  }

  function handleClose() {
    router.push(`/todos?${buildTodosQuery(filter, search)}`);
  }

  return (
    <>
      <TodoModal
        mode="add"
        todo={null}
        viewDate={viewDate}
        onConfirm={handleConfirm}
        onClose={handleClose}
        onDelete={handleClose}
        onComplete={handleClose}
      />
      <MessageToast message={message} onClear={() => setMessage("")} />
    </>
  );
}
