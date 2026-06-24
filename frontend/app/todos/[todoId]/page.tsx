import { Suspense } from "react";
import EditTodoForm from "../../components/EditTodoForm";
import { getTodos } from "../../actions";

export default async function EditTodoPage({
  params,
}: {
  params: Promise<{ todoId: string }>;
}) {
  const { todoId } = await params;
  const todos = await getTodos();
  const todo = todos.find((t) => t.id === Number(todoId)) ?? null;

  if (!todo) {
    return (
      <div className="todo-modal-overlay active">
        <div className="message-box" style={{ position: "static" }}>
          Todo를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <EditTodoForm todo={todo} />
    </Suspense>
  );
}
