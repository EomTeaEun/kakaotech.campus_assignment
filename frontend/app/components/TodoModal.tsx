"use client";

import { useState, useEffect } from "react";
import { CONFIG } from "../lib/config";
import { getDateString } from "../lib/date";
import type { ModalMode, Todo, TodoFormInput } from "../lib/types";

function initForm(mode: ModalMode, todo: Todo | null, viewDate: Date): TodoFormInput {
  if (mode === "add") {
    return { title: "", detail: "", deadline: getDateString(viewDate), priority: CONFIG.DEFAULT_PRIORITY };
  }
  if (todo) {
    return { title: todo.text, detail: todo.detail || "", deadline: todo.deadline || "", priority: todo.priority };
  }
  return { title: "", detail: "", deadline: "", priority: CONFIG.DEFAULT_PRIORITY };
}

interface TodoModalProps {
  mode: ModalMode;
  todo: Todo | null;
  viewDate: Date;
  onConfirm: (form: TodoFormInput) => void;
  onClose: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

export default function TodoModal({ mode, todo, viewDate, onConfirm, onClose, onDelete, onComplete }: TodoModalProps) {
  const [form, setForm] = useState<TodoFormInput>(() => initForm(mode, todo, viewDate));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isReadOnly = mode === "done-view" || (mode === "edit" && !isEditing);
  const isAdd = mode === "add";
  const isDoneView = mode === "done-view";
  const isEditMode = mode === "edit";

  const showConfirm = isAdd || (isEditMode && isEditing);
  const showEdit = isEditMode && !isEditing;
  const showDelete = (isEditMode && !isEditing) || isDoneView;
  const showComplete = isEditMode && !isEditing;
  const showClose = isAdd || (isEditMode && !isEditing) || isDoneView;

  const twoBtn = [showConfirm, showEdit, showDelete, showComplete, showClose].filter(Boolean).length <= 2;

  function change<K extends keyof TodoFormInput>(field: K, value: TodoFormInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleConfirm() {
    onConfirm({ ...form, priority: Number(form.priority) });
  }

  return (
    <div
      className="todo-modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="todo-modal-container">
        <div className="todo-write-wrapper">
          <img src="/assets/todo_write.png" alt="" className="todo-write-bg" />

          <span className="todo-field-label" id="labelTitle">제목</span>
          <input
            type="text"
            className="todo-field-input"
            id="todoTitle"
            placeholder="할 일 제목"
            readOnly={isReadOnly}
            value={form.title}
            onChange={(e) => change("title", e.target.value)}
          />

          <span className="todo-field-label" id="labelDetail">내용</span>
          <textarea
            className="todo-field-textarea"
            id="todoDetail"
            placeholder="세부 내용 (선택)"
            readOnly={isReadOnly}
            value={form.detail}
            onChange={(e) => change("detail", e.target.value)}
          />

          <span className="todo-field-label" id="labelDeadline">마감 기한</span>
          <input
            type="date"
            className="todo-field-input"
            id="todoDeadline"
            min={getDateString(new Date())}
            disabled={isReadOnly}
            value={form.deadline}
            onChange={(e) => change("deadline", e.target.value)}
          />

          <span className="todo-field-label" id="labelPriority">
            우선순위&nbsp;<span id="priorityValue">{form.priority}</span>
          </span>
          <input
            type="range"
            className="todo-field-range"
            id="todoPriority"
            min={CONFIG.PRIORITY_MIN}
            max={CONFIG.PRIORITY_MAX}
            disabled={isReadOnly}
            value={form.priority}
            onChange={(e) => change("priority", Number(e.target.value))}
          />

          <div className={`todo-modal-buttons${twoBtn ? " two-btn" : ""}`}>
            {showConfirm && (
              <div className="modal-btn-wrapper" onClick={handleConfirm}>
                <img src="/assets/button.png" alt="" className="modal-btn-bg" />
                <span className="modal-btn-label">확인</span>
              </div>
            )}
            {showEdit && (
              <div className="modal-btn-wrapper" onClick={() => setIsEditing(true)}>
                <img src="/assets/button.png" alt="" className="modal-btn-bg" />
                <span className="modal-btn-label">수정</span>
              </div>
            )}
            {showDelete && (
              <div className="modal-btn-wrapper" onClick={onDelete}>
                <img src="/assets/button.png" alt="" className="modal-btn-bg" />
                <span className="modal-btn-label">삭제</span>
              </div>
            )}
            {showComplete && (
              <div className="modal-btn-wrapper" onClick={onComplete}>
                <img src="/assets/button.png" alt="" className="modal-btn-bg" />
                <span className="modal-btn-label">완료</span>
              </div>
            )}
            {showClose && (
              <div className="modal-btn-wrapper" onClick={onClose}>
                <img src="/assets/button.png" alt="" className="modal-btn-bg" />
                <span className="modal-btn-label">닫기</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
