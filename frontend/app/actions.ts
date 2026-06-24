"use server";

import { revalidatePath } from "next/cache";
import type { FilterType, Todo } from "./lib/types";

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not set. Check frontend/.env.local");
}

interface TodoWriteInput {
  text?: string;
  detail?: string;
  deadline?: string;
  priority?: number;
  status?: "active" | "done";
  itemImage?: string;
  slotIndex?: number;
  createdAt?: string;
}

export async function getTodos(filter?: FilterType, search?: string): Promise<Todo[]> {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (search) params.set("search", search);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BACKEND_URL}/todos${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch todos");
  return res.json();
}

export async function createTodo(input: TodoWriteInput): Promise<Todo> {
  const res = await fetch(`${BACKEND_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  const todo = await res.json();
  revalidatePath("/todos");
  return todo;
}

export async function updateTodo(id: number, input: TodoWriteInput): Promise<Todo> {
  const res = await fetch(`${BACKEND_URL}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update todo");
  const todo = await res.json();
  revalidatePath("/todos");
  return todo;
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/todos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete todo");
  revalidatePath("/todos");
}
