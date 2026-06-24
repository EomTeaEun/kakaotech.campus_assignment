"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { parseFilterParam } from "../lib/filter";
import { buildTodosQuery, parseSearchParam } from "../lib/search";
import type { FilterType } from "../lib/types";

const TABS: { filter: FilterType; label: string }[] = [
  { filter: "all", label: "전체" },
  { filter: "active", label: "진행중" },
  { filter: "done", label: "완료" },
];

export default function FilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = parseFilterParam(searchParams.get("filter"));
  const currentSearch = parseSearchParam(searchParams.get("search"));

  function handleChange(filter: FilterType) {
    router.push(`/todos?${buildTodosQuery(filter, currentSearch)}`);
  }

  return (
    <div className="filter-tabs" id="filterTabs">
      {TABS.map(({ filter, label }) => (
        <div
          key={filter}
          className={`filter-tab${currentFilter === filter ? " active" : ""}`}
          onClick={() => handleChange(filter)}
        >
          <img src="/assets/button.png" alt="" className="filter-tab-bg" />
          <span className="filter-tab-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
