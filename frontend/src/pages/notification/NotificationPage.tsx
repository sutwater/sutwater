import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { useAppContext } from "../../contexts/AppContextDef";
import { NotificationInterface } from "../../interfaces/InterfaceAll";
import {
  ReadAllNotifications,
  ReadNotificationByID,
  DeleteNotificationByID,
} from "../../services/https/message";

type Filter = "all" | "unread";

function timeLabel(dateStr?: string) {
  if (!dateStr) return "";
  return dayjs(dateStr).format("D MMM YYYY · HH:mm");
}

export default function NotificationPage() {
  const { notifications, getNotification } = useAppContext();
  const [items, setItems] = useState<NotificationInterface[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    setItems([...notifications].sort((a, b) =>
      dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
    ));
  }, [notifications]);

  const unreadCount = items.filter((n) => !n.is_read).length;
  const visible = filter === "unread" ? items.filter((n) => !n.is_read) : items;

  const markRead = async (id: number) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    await ReadNotificationByID(String(id));
    getNotification();
  };

  const remove = async (id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await DeleteNotificationByID(String(id));
    getNotification();
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await ReadAllNotifications();
    await getNotification();
    setMarkingAll(false);
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ——— Header ——— */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              การแจ้งเตือน
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-teal-500 text-white text-[11px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-60 transition-colors bg-transparent cursor-pointer"
            >
              <CheckCheck size={13} />
              อ่านทั้งหมด
            </button>
          )}
        </div>

        {/* ——— Filter tabs ——— */}
        <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          {(["all", "unread"] as Filter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border-0 cursor-pointer ${
                filter === tab
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent"
              }`}
            >
              {tab === "all" ? "ทั้งหมด" : `ยังไม่ได้อ่าน${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>

        {/* ——— List ——— */}
        <div className="space-y-2">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-gray-600">
              <BellOff size={36} strokeWidth={1.5} />
              <p className="text-sm">
                {filter === "unread" ? "ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน" : "ไม่มีการแจ้งเตือน"}
              </p>
            </div>
          ) : (
            visible.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`relative flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  n.is_read
                    ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                    : "bg-teal-50/60 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/50 cursor-pointer"
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1 shrink-0">
                  {n.is_read ? (
                    <Bell size={16} className="text-gray-300 dark:text-gray-600" />
                  ) : (
                    <div className="relative">
                      <Bell size={16} className="text-teal-500" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-500" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${
                    n.is_read
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-900 dark:text-gray-100 font-medium"
                  }`}>
                    {n.message ?? "ไม่มีข้อความ"}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                    {timeLabel(n.created_at)}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                  title="ลบ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
