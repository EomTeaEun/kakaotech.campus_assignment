import { Suspense } from "react";
import NewTodoForm from "../../components/NewTodoForm";
import { getTodos } from "../../actions";

export default async function NewTodoPage() {
  const todos = await getTodos();
  return (
    <Suspense fallback={null}>
      <NewTodoForm todos={todos} />
    </Suspense>
  );
}
