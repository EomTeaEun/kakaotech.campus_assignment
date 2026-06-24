export type TodoStatus = "active" | "done";
export type FilterType = "all" | "active" | "done";
export type ModalMode = "add" | "edit" | "done-view";

export interface Todo {
  id: number;
  text: string;
  detail: string;
  deadline: string;
  priority: number;
  status: TodoStatus;
  itemImage: string;
  slotIndex: number;
  createdAt: string;
}

export interface TodoFormInput {
  title: string;
  detail: string;
  deadline: string;
  priority: number;
}

export interface SlotItem {
  todo: Todo;
  isDone: boolean;
}
