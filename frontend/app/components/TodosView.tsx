"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CONFIG } from "../lib/config";
import { getDateString } from "../lib/date";
import { computeSlotItems } from "../lib/slots";
import DateNavigator from "./DateNavigator";
import AddTodoButton from "./AddTodoButton";
import FilterTabs from "./FilterTabs";
import SearchInput from "./SearchInput";
import InventoryGrid from "./InventoryGrid";
import TodoListPanel from "./TodoListPanel";
import AchievementBar from "./AchievementBar";
import MessageToast from "./MessageToast";
import { buildTodosQuery, parseSearchParam } from "../lib/search";
import { readAchievements, writeAchievements, type Achievement } from "../lib/achievements";
import type { Todo, FilterType } from "../lib/types";

interface TodosViewProps {
  initialTodos: Todo[];
  currentFilter: FilterType;
}

export default function TodosView({ initialTodos, currentFilter }: TodosViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // initialTodos는 매 네비게이션마다 Server Component가 새로 내려주는 서버 데이터라
  // useState로 한 번만 캡처하면 필터/검색이 바뀌어도 화면이 갱신되지 않는다.
  const todos = initialTodos;
  const [panelViewMode, setPanelViewMode] = useState<"daily" | "weekly">("daily");
  const [achievements, setAchievements] = useState<Achievement[]>(() => readAchievements());
  const [message] = useState("");

  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const completedId = searchParams.get("completed");
  const completedText = searchParams.get("completedText");
  const completedImage = searchParams.get("completedImage");
  const currentSearch = parseSearchParam(searchParams.get("search"));
  const processedCompletedRef = useRef<string | null>(null);

  useEffect(() => {
    // completed 시점에 status가 done으로 바뀌면서 현재 필터(예: active)
    // 목록에서 빠질 수 있어, todos 배열을 다시 찾는 대신 URL로 받은
    // text/itemImage를 그대로 사용한다.
    if (!completedId || !completedText || !completedImage) return;
    // 개발 모드 Strict Mode는 같은 completedId에 대해 effect를 두 번
    // 호출한다(mount->cleanup->mount). ref로 처리 여부를 기억해 중복 추가를 막는다.
    if (processedCompletedRef.current === completedId) return;
    processedCompletedRef.current = completedId;
    setAchievements((prev) => {
      const next = [...prev, { id: Date.now(), text: completedText, itemImage: completedImage }];
      const capped =
        next.length > CONFIG.MAX_ACHIEVEMENTS ? next.slice(next.length - CONFIG.MAX_ACHIEVEMENTS) : next;
      writeAchievements(capped);
      return capped;
    });
    router.replace(`/todos?${buildTodosQuery(currentFilter, currentSearch)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedId]);

  function handlePrevDate() {
    const d = new Date(currentViewDate);
    d.setDate(d.getDate() - 1);
    setCurrentViewDate(d);
  }

  function handleNextDate() {
    const d = new Date(currentViewDate);
    d.setDate(d.getDate() + 1);
    setCurrentViewDate(d);
  }

  const slotItems = computeSlotItems(todos, currentViewDate, currentFilter);

  const handleAchievementExpire = useCallback((id: number) => {
    setAchievements((prev) => {
      const next = prev.filter((a) => a.id !== id);
      writeAchievements(next);
      return next;
    });
  }, []);

  const clearMessage = useCallback(() => {}, []);

  function handleSelectDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    setCurrentViewDate(new Date(y, m - 1, d));
    setPanelViewMode("daily");
  }

  function handleSlotClick(todo: Todo) {
    router.push(`/todos/${todo.id}?${buildTodosQuery(currentFilter, currentSearch)}`);
  }

  function handleAddClick() {
    router.push(
      `/todos/new?date=${getDateString(currentViewDate)}&${buildTodosQuery(currentFilter, currentSearch)}`
    );
  }

  return (
    <>
      <div className="app-container">
        <div className="inventory-wrapper">
          <img src="/assets/background.jpeg" alt="Minecraft Inventory" className="inventory-bg" />

          <DateNavigator currentDate={currentViewDate} onPrev={handlePrevDate} onNext={handleNextDate} />
          <AddTodoButton onClick={handleAddClick} />
          <FilterTabs />
          <SearchInput />
          <InventoryGrid slotItems={slotItems} onSlotClick={handleSlotClick} />
          <TodoListPanel
            todos={todos}
            currentViewDate={currentViewDate}
            currentFilter={currentFilter}
            panelViewMode={panelViewMode}
            onToggleMode={setPanelViewMode}
            onSelectDate={handleSelectDate}
          />
        </div>
      </div>

      <AchievementBar achievements={achievements} onExpire={handleAchievementExpire} />
      <MessageToast message={message} onClear={clearMessage} />
    </>
  );
}
