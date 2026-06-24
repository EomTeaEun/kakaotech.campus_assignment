import { Suspense } from "react";
import TodosView from "../components/TodosView";
import { getTodos } from "../actions";
import { parseFilterParam } from "../lib/filter";
import { parseSearchParam } from "../lib/search";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const currentFilter = parseFilterParam(params.filter);
  const currentSearch = parseSearchParam(params.search);
  const todos = await getTodos(currentFilter, currentSearch);

  return (
    <Suspense fallback={null}>
      <TodosView initialTodos={todos} currentFilter={currentFilter} />
    </Suspense>
  );
}
