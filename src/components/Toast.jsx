import { useEffect, useState } from "react";

import "./Toast.css";

let pushListener = null;
let toastSeq = 0;

function push(type, message) {
  if (!message) return;

  if (typeof pushListener === "function") {
    pushListener({ id: ++toastSeq, type, message });
    return;
  }

  // Host not mounted (should not happen): fall back silently.
  console.log(`[toast:${type}]`, message);
}

export const toast = {
  success: (message) => push("success", message),
  error: (message) => push("error", message),
  info: (message) => push("info", message),
};

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

export function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    pushListener = (item) => {
      setItems((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), item]);

      window.setTimeout(() => {
        setItems((prev) =>
          prev.filter((entry) => entry.id !== item.id)
        );
      }, AUTO_DISMISS_MS);
    };

    return () => {
      pushListener = null;
    };
  }, []);

  function dismiss(id) {
    setItems((prev) =>
      prev.filter((entry) => entry.id !== id)
    );
  }

  if (!items.length) return null;

  return (
    <div
      className="toast-host"
      role="status"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`toast-item toast-item-${item.type}`}
        >
          <span className="toast-text">{item.message}</span>

          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => dismiss(item.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
