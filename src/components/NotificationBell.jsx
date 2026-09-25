import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/api";
import { useLanguage } from "../utils/i18n";
import "./NotificationBell.css";

const POLL_INTERVAL = 45000;

function typeIcon(type) {
  switch (String(type || "").toLowerCase()) {
    case "correction":
      return (
        <path d="M12 20h9" />
      );
    case "risk":
    case "warning":
      return (
        <>
          <path d="M12 4v9" />
          <path d="M12 17h.01" />
        </>
      );
    default:
      return (
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      );
  }
}

export default function NotificationBell({ className = "" }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!localStorage.getItem("token")) return;

    if (!silent) setLoading(true);

    try {
      const data = await getNotifications(30);

      setItems(
        Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data)
            ? data
            : []
      );
      setUnread(Number(data?.unread || 0));
    } catch {
      // Bell stays silent on failure — never blocks the page.
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);

    const timer = setInterval(() => load(true), POLL_INTERVAL);

    function onFocus() {
      load(true);
    }

    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (
        boxRef.current &&
        !boxRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  async function openItem(item) {
    try {
      if (!item.is_read) {
        await markNotificationRead(item.id);
        setItems((list) =>
          list.map((row) =>
            row.id === item.id
              ? { ...row, is_read: true }
              : row
          )
        );
        setUnread((count) => Math.max(0, count - 1));
      }
    } catch {
      // Navigation still works even if marking fails.
    } finally {
      setOpen(false);

      if (item.link) navigate(item.link);
    }
  }

  async function markAll() {
    try {
      await markAllNotificationsRead();
      setItems((list) =>
        list.map((row) => ({ ...row, is_read: true }))
      );
      setUnread(0);
    } catch {
      // Silent — panel stays usable.
    }
  }

  function timeAgo(value) {
    if (!value) return "";

    const date = new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000)
    );

    if (seconds < 60) return t("notif.justNow");
    if (seconds < 3600)
      return t("notif.minutesAgo").replace(
        "{n}",
        Math.floor(seconds / 60)
      );
    if (seconds < 86400)
      return t("notif.hoursAgo").replace(
        "{n}",
        Math.floor(seconds / 3600)
      );

    return date.toLocaleDateString();
  }

  return (
    <div
      ref={boxRef}
      className={`notif-bell-box ${className}`.trim()}
    >
      <button
        type="button"
        className={`notif-bell-button${unread > 0 ? " has-unread" : ""}`}
        aria-label={
          unread > 0
            ? t("notif.openWithUnread").replace("{n}", unread)
            : t("notif.open")
        }
        title={t("notif.title")}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          load(true);
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>

        {unread > 0 && (
          <span className="notif-bell-badge" aria-hidden="true">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          className="notif-bell-panel"
          role="dialog"
          aria-label={t("notif.title")}
        >
          <header className="notif-bell-header">
            <strong>{t("notif.title")}</strong>

            {unread > 0 && (
              <button type="button" onClick={markAll}>
                {t("notif.markAllRead")}
              </button>
            )}
          </header>

          <div className="notif-bell-list" role="log" aria-live="polite">
            {loading && items.length === 0 ? (
              <p className="notif-bell-muted">
                {t("notif.loading")}
              </p>
            ) : items.length === 0 ? (
              <div className="notif-bell-empty">
                <strong>{t("notif.empty")}</strong>
                <p>{t("notif.emptySub")}</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notif-bell-item${item.is_read ? "" : " unread"}`}
                  onClick={() => openItem(item)}
                >
                  <span
                    className={`notif-bell-item-icon type-${item.type || "general"}`}
                    aria-hidden="true"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {typeIcon(item.type)}
                    </svg>
                  </span>

                  <span className="notif-bell-item-text">
                    <strong>{item.title}</strong>
                    {item.message && <small>{item.message}</small>}
                    <span className="notif-bell-item-time">
                      {timeAgo(item.created_at)}
                    </span>
                  </span>

                  {!item.is_read && (
                    <span
                      className="notif-bell-item-dot"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
