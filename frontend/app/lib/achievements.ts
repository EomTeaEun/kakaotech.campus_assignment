export interface Achievement {
  id: number;
  text: string;
  itemImage: string;
}

const STORAGE_KEY = "pendingAchievements";

// 완료 처리는 /todos/[todoId] -> /todos 라우트 이동을 거치는데, 이건 같은
// 페이지 안의 검색 파라미터 변경이 아니라 실제 라우트 세그먼트 전환이라
// TodosView가 매번 새로 마운트되며 achievements 상태가 초기화된다.
// sessionStorage로 마운트 사이의 큐를 들고 다녀서 빠르게 연속 완료해도
// 알림이 누적/캡 되도록 한다.
export function readAchievements(): Achievement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Achievement[]) : [];
  } catch {
    return [];
  }
}

export function writeAchievements(achievements: Achievement[]): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
}
