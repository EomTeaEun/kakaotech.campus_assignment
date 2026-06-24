import type { FilterType } from "./types";

const VALID_FILTERS: readonly FilterType[] = ["all", "active", "done"];

export function parseFilterParam(value: string | string[] | undefined | null): FilterType {
  if (typeof value === "string" && (VALID_FILTERS as readonly string[]).includes(value)) {
    return value as FilterType;
  }
  return "active";
}
