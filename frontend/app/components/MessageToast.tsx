"use client";

import { useEffect } from "react";
import { CONFIG } from "../lib/config";

interface MessageToastProps {
  message: string;
  onClear: () => void;
}

export default function MessageToast({ message, onClear }: MessageToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClear, CONFIG.MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;
  return <div className="message-box">{message}</div>;
}
