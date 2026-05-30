import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import NOTIFICATIONS from "../../services/notificationService";

const POLL_INTERVAL_MS = 45_000;

function formatTimeAgo(value) {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";

  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export default function NotificationBell({ theme = "dark", onNotificationNavigate }) {
  const isLight = theme === "light";
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const panelClassName = useMemo(
    () =>
      isLight
        ? "absolute right-0 top-14 z-30 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ef_100%)] shadow-[0_28px_80px_-36px_rgba(15,23,42,0.35)]"
        : "absolute right-0 top-14 z-30 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,15,15,0.98)_0%,rgba(8,8,8,0.98)_100%)] shadow-[0_28px_80px_-36px_rgba(0,0,0,0.85)]",
    [isLight]
  );

  const unreadBadgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const fetchUnreadCount = async () => {
    const response = await NOTIFICATIONS.FETCH_UNREAD_COUNT();
    if (response?.status === 200) {
      setUnreadCount(Number(response.data?.data?.unreadCount || 0));
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    const response = await NOTIFICATIONS.FETCH({ page: 1, limit: 8 });

    if (response?.status === 200) {
      setNotifications(Array.isArray(response.data?.data) ? response.data.data : []);
      setLoading(false);
      return;
    }

    setNotifications([]);
    setError(response?.data?.message || "Notifications could not be loaded.");
    setLoading(false);
  };

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = window.setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkRead = async (notification, { navigateAfter = false } = {}) => {
    if (!notification || notification.isRead) {
      if (navigateAfter) {
        onNotificationNavigate?.(notification);
      }
      return;
    }

    setUpdatingId(String(notification.id));
    const response = await NOTIFICATIONS.MARK_READ(notification.id);
    setUpdatingId("");

    if (response?.status === 200) {
      setNotifications((current) =>
        current.map((entry) =>
          String(entry.id) === String(notification.id)
            ? { ...entry, isRead: true, readAt: response.data?.data?.readAt || new Date().toISOString() }
            : entry
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    if (navigateAfter) {
      onNotificationNavigate?.(notification);
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const response = await NOTIFICATIONS.MARK_ALL_READ();
    setMarkingAll(false);

    if (response?.status === 200) {
      setNotifications((current) =>
        current.map((entry) => ({
          ...entry,
          isRead: true,
          readAt: entry.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open notifications"
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors ${
          isLight
            ? "border-black/10 bg-white text-slate-800 hover:bg-slate-50"
            : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.3rem] items-center justify-center rounded-full border border-black/30 bg-[#D4AF37] px-1.5 py-0.5 text-[10px] font-semibold text-black">
            {unreadBadgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={panelClassName}>
          <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${
            isLight ? "border-black/10" : "border-white/10"
          }`}>
            <div>
              <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-[#F5E7B2]"}`}>Notifications</div>
              <div className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>
                Stay on top of leads, follow-ups, and access updates.
              </div>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                isLight
                  ? "border-black/10 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/10 hover:text-white disabled:opacity-50"
              }`}
            >
              {markingAll ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className={`px-5 py-10 text-center text-sm ${isLight ? "text-slate-500" : "text-white/55"}`}>
                Loading notifications...
              </div>
            ) : error ? (
              <div className="space-y-3 px-5 py-8">
                <div className={`text-sm ${isLight ? "text-slate-700" : "text-white/75"}`}>{error}</div>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="gold-btn px-4 py-2 text-xs"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className={`px-5 py-12 text-center text-sm ${isLight ? "text-slate-500" : "text-white/55"}`}>
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b px-5 py-4 transition ${
                    isLight ? "border-black/8" : "border-white/8"
                  } ${notification.isRead ? "" : isLight ? "bg-[#FFF7E0]/55" : "bg-[#D4AF37]/8"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notification, { navigateAfter: true })}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{notification.title}</div>
                      <div className={`mt-1 text-sm leading-6 ${isLight ? "text-slate-600" : "text-white/72"}`}>{notification.message}</div>
                      <div className={`mt-2 text-[11px] uppercase tracking-[0.18em] ${isLight ? "text-slate-400" : "text-white/40"}`}>
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </button>
                    {!notification.isRead ? (
                      <button
                        type="button"
                        aria-label="Mark notification as read"
                        onClick={() => handleMarkRead(notification)}
                        disabled={updatingId === String(notification.id)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                          isLight
                            ? "border-black/10 bg-white text-slate-600 hover:bg-slate-50"
                            : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {updatingId === String(notification.id) ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
