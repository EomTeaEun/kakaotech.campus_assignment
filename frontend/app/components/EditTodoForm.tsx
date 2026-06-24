"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TodoModal from "./TodoModal";
import MessageToast from "./MessageToast";
import { parseFilterParam } from "../lib/filter";
import { buildTodosQuery, parseSearchParam } from "../lib/search";
import type { Todo, TodoFormInput } from "../lib/types";

interface EditTodoFormProps {
  todo: Todo;
}

export default function EditTodoForm({ todo }: EditTodoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = parseFilterParam(searchParams.get("filter"));
  const search = parseSearchParam(searchParams.get("search"));
  const [message, setMessage] = useState("");
  const mode = todo.status === "done" ? "done-view" : "edit";

  function backToTodos(extraQuery?: string) {
    router.push(`/todos?${buildTodosQuery(filter, search)}${extraQuery ? `&${extraQuery}` : ""}`);
  }

  async function handleConfirm(form: TodoFormInput) {
    if (!form.title.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: form.title.trim(),
        detail: form.detail.trim(),
        deadline: form.deadline,
        priority: form.priority,
      }),
    });
    backToTodos();
    router.refresh();
  }

  async function handleDelete() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${todo.id}`, { method: "DELETE" });
    backToTodos();
    router.refresh();
  }

  async function handleComplete() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    // status가 done으로 바뀌면 목록 페이지의 현재 필터(예: active)에서 빠질 수 있으니,
    // 알림에 필요한 정보(text/itemImage)를 직접 들고 돌아간다.
    backToTodos(
      `completed=${todo.id}&completedText=${encodeURIComponent(todo.text)}&completedImage=${encodeURIComponent(todo.itemImage)}`
    );
    router.refresh();
  }

  function handleClose() {
    backToTodos();
  }

  return (
    <>
      <TodoModal
        mode={mode}
        todo={todo}
        viewDate={new Date()}
        onConfirm={handleConfirm}
        onClose={handleClose}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />
      <MessageToast message={message} onClear={() => setMessage("")} />
    </>
  );
}
