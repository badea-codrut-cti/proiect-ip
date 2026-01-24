import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import { notificationsClient, type NotificationItem } from "~/utils/notificationsClient";

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement | null>(null);

  const unreadCount = items.filter((n) => !n.is_read).length;

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsClient.list();
      setItems(data);

      // Mark all read (backend supports /mark-read)
      if (data.some((n) => !n.is_read)) {
        try {
          await notificationsClient.markAllRead();
          // update local state so badge disappears immediately
          setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch {
          // If marking read fails, still show notifications; badge may remain
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4 text-slate-600 dark:text-slate-200" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[0.9rem] h-[0.9rem] px-1 rounded-full bg-red-500 text-white text-[0.6rem] leading-[0.9rem] text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
              Notifications
            </div>
            <button
              type="button"
              onClick={load}
              className="text-[0.7rem] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-80 overflow-auto">
            {loading && (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                Loading…
              </div>
            )}

            {error && !loading && (
              <div className="px-4 py-3 text-xs text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No notifications yet.
              </div>
            )}

            {!loading &&
              !error &&
              items.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs text-slate-800 dark:text-slate-100">
                      {n.message}
                    </div>
                    <div className="text-[0.65rem] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatTime(n.created_at)}
                    </div>
                  </div>
                  <div className="mt-1 text-[0.65rem] text-slate-400 dark:text-slate-500">
                    {String(n.type).replaceAll("_", " ")}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
