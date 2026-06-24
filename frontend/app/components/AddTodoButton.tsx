"use client";

interface AddTodoButtonProps {
  onClick: () => void;
}

export default function AddTodoButton({ onClick }: AddTodoButtonProps) {
  return (
    <div className="add-todo-wrapper" onClick={onClick}>
      <img src="/assets/button.png" alt="" className="add-todo-btn" />
      <span className="add-todo-label">TODO 추가하기</span>
    </div>
  );
}
