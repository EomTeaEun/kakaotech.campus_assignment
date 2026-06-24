"use client";

import { getKoreanDateString } from "../lib/date";

interface DateNavigatorProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function DateNavigator({ currentDate, onPrev, onNext }: DateNavigatorProps) {
  return (
    <div className="date-nav" id="dateNav">
      <div className="date-nav-btn" onClick={onPrev}>
        <img src="/assets/button.png" alt="" className="date-nav-btn-bg" />
        <span className="date-nav-btn-label">◀</span>
      </div>
      <span className="date-text">{getKoreanDateString(currentDate)}</span>
      <div className="date-nav-btn" onClick={onNext}>
        <img src="/assets/button.png" alt="" className="date-nav-btn-bg" />
        <span className="date-nav-btn-label">▶</span>
      </div>
    </div>
  );
}
