import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Filter,
  Info,
  Network,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notificationsApi";
import { type SystemNotification } from "@/services/mock/notificationsMock";
import { focusRing } from "@/constants/permissions";

const severityTone: Record<string, string> = {
  High: "bg-[#fbe7e7] text-[#8c3636] border-[#f3c1c1]",
  Medium: "bg-[#fff4d8] text-[#8a6200] border-[#f5dfa5]",
  Low: "bg-[#edf1f4] text-[#5b6d7d] border-[#d4de86]",
  Info: "bg-[#eaf2f7] text-[#277da1] border-[#c4e0f0]",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterType, setFilterType] = useState("All");

  const loadData = () => {
    setLoading(true);
    setError(false);
    getNotifications()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setItems((curr) => curr.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setItems((curr) => curr.map((n) => ({ ...n, read: true })));
  };

  const filteredItems = useMemo(() => {
    return items.filter((n) => {
      if (filterType === "Unread") return !n.read;
      if (filterType === "High") return n.severity === "High";
      return true;
    });
  }, [items, filterType]);

  const unreadCount = items.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading notifications">
        <div className="h-24 animate-pulse rounded-md bg-[#e4ebf1]" />
        <div className="h-96 animate-pulse rounded-md bg-[#e4ebf1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#e7c9c9] bg-[#fff9f9] p-12 text-center">
        <AlertTriangle className="mx-auto text-[#a34d4d]" size={32} />
        <h2 className="mt-4 text-lg font-semibold text-[#7c3030]">Unable to load notifications</h2>
        <p className="mt-2 text-sm text-[#8b5b5b]">Error reaching notification center service.</p>
        <button
          onClick={loadData}
          className={`mt-5 rounded-md border border-[#a34d4d] px-4 py-2 text-sm font-semibold text-[#7c3030] ${focusRing}`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#b27b00]">
            <Bell size={14} /> Operational Alerts
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
            System Notifications
          </h1>
          <p className="mt-1 text-sm text-[#607387]">
            Real-time alerts for fraud risk signals, collusion detections, and project status transitions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className={`inline-flex items-center gap-1.5 rounded-md border border-[#dce5ee] bg-white px-3.5 py-2 text-xs font-semibold text-[#102a43] hover:bg-[#f8fafc] ${focusRing}`}
          >
            <CheckCheck size={16} className="text-[#277da1]" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#dce5ee] pb-3">
        <div className="flex gap-2">
          {["All", "Unread", "High"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === tab
                  ? "bg-[#102a43] text-white"
                  : "text-[#607387] hover:bg-[#eaf2f7] hover:text-[#102a43]"
              } ${focusRing}`}
            >
              {tab === "All" && `All (${items.length})`}
              {tab === "Unread" && `Unread (${unreadCount})`}
              {tab === "High" && `High Priority (${items.filter((n) => n.severity === "High").length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#b8c8d5] bg-white p-12 text-center">
          <Bell className="mx-auto text-[#8aa0b2]" size={32} />
          <h2 className="mt-4 font-semibold text-[#102a43]">No notifications match filter</h2>
          <p className="mt-1 text-sm text-[#607387]">All clear! You have no pending alerts under this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((n) => (
            <article
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-md border p-4 shadow-sm transition-all ${
                n.read ? "border-[#dce5ee] bg-white" : "border-[#b8c8d5] bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                  {n.type === "collusion" ? (
                    <Network size={20} className="text-[#a34d4d]" />
                  ) : n.type === "risk_flag" ? (
                    <ShieldAlert size={20} className="text-[#a34d4d]" />
                  ) : (
                    <Info size={20} className="text-[#277da1]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${severityTone[n.severity]}`}>
                      {n.severity}
                    </span>
                    {!n.read && (
                      <span className="rounded bg-[#f0b323] px-2 py-0.5 text-[10px] font-extrabold text-[#071a2c]">
                        NEW
                      </span>
                    )}
                    <span className="text-xs text-[#71859a]">
                      {new Date(n.timestamp).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-sm font-semibold text-[#102a43]">{n.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#607387]">{n.message}</p>

                  {n.linkHref && (
                    <Link
                      href={n.linkHref}
                      className={`mt-2.5 inline-flex items-center text-xs font-semibold text-[#277da1] hover:text-[#102a43] ${focusRing}`}
                    >
                      {n.linkLabel || "View Details"} <ChevronRight size={14} className="ml-0.5" />
                    </Link>
                  )}
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  title="Mark as Read"
                  className={`rounded-md p-1.5 text-[#71859a] hover:bg-[#eaf2f7] hover:text-[#102a43] ${focusRing}`}
                  aria-label="Mark notification as read"
                >
                  <Check size={16} />
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
