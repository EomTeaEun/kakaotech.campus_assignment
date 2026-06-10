import { useEffect } from 'react';
import { CONFIG } from '../constants/config.js';

export default function MessageToast({ message, onClear }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClear, CONFIG.MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;
  return <div className="message-box">{message}</div>;
}
