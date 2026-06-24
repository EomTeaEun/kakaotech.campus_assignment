"use client";

import { useEffect } from "react";

export default function TodosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "#f0e0c8",
        fontFamily: "'Galmuri11', sans-serif",
      }}
    >
      <p>문제가 발생했습니다.</p>
      <button onClick={() => reset()} style={{ cursor: "pointer" }}>
        다시 시도
      </button>
    </div>
  );
}
