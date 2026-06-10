import { useState, useEffect } from 'react';
import { CONFIG } from '../constants/config.js';

function AchievementItem({ id, todo, index, onExpire }) {
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    let raf1 = 0, raf2 = 0;
    let expireTimer;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAnimClass('slide-in'));
    });

    const slideOutTimer = setTimeout(() => {
      setAnimClass('slide-out');
      expireTimer = setTimeout(() => onExpire(id), CONFIG.ACHIEVE_SLIDE_OUT_MS);
    }, CONFIG.ACHIEVE_DISPLAY_MS);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(slideOutTimer);
      clearTimeout(expireTimer);
    };
  }, [id, onExpire]);

  const top = CONFIG.ACHIEVE_TOP_BASE + index * (CONFIG.ACHIEVE_HEIGHT + CONFIG.ACHIEVE_GAP);

  return (
    <div className={`achieve-bar${animClass ? ` ${animClass}` : ''}`} style={{ top }}>
      <div className="achieve-bar-inner">
        <img src="/assets/achieve_bar.png" className="achieve-bar-bg" alt="" />
        <div className="achieve-bar-content">
          <img src={`/assets/items/${todo.itemImage}`} className="achieve-item-img" alt="" />
          <div className="achieve-text">
            <div className="achieve-title">{todo.text} 도전과제 달성!</div>
            <div className="achieve-detail">{todo.text}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AchievementBar({ achievements, onExpire }) {
  return (
    <>
      {achievements.map((a, i) => (
        <AchievementItem key={a.id} id={a.id} todo={a.todo} index={i} onExpire={onExpire} />
      ))}
    </>
  );
}
