import type { FilterType } from "./types";

export function parseSearchParam(value: string | string[] | undefined | null): string {
  return typeof value === "string" ? value : "";
}

export function buildTodosQuery(filter: FilterType, search: string): string {
  const params = new URLSearchParams({ filter });
  if (search) params.set("search", search);
  return params.toString();
}
