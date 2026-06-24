"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CONFIG } from "../lib/config";
import { parseFilterParam } from "../lib/filter";
import { buildTodosQuery, parseSearchParam } from "../lib/search";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = parseFilterParam(searchParams.get("filter"));
  const [value, setValue] = useState(() => parseSearchParam(searchParams.get("search")));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      router.push(`/todos?${buildTodosQuery(currentFilter, next)}`);
    }, CONFIG.SEARCH_DEBOUNCE_MS);
  }

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        className="search-input"
        id="todoSearch"
        placeholder="검색"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
