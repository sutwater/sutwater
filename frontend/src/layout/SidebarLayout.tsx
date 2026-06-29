import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Sun, Moon, Bell } from "lucide-react";
import { useAppContext } from "../contexts/AppContextDef";

const PATH_LABELS: Record<string, string> = {
  "/":             "แดชบอร์ด",
  "/water-map":    "แผนที่มิเตอร์",
  "/device":       "อุปกรณ์",
  "/meter":        "มิเตอร์",
  "/meter-edit":   "แก้ไขค่าน้ำ",
  "/water-detail": "รายละเอียดการใช้น้ำ",
  "/maintain-log": "บันทึกบำรุงรักษา",
  "/user":         "ผู้ใช้",
  "/profile":      "โปรไฟล์",
  "/maintain-noti":      "แจ้งปัญหา",
  "/notification":       "การแจ้งเตือน",
};
import Sidebar from "./Sidebar";
import { useTheme } from "../contexts/useTheme";

export default function SidebarLayout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle }            = useTheme();
  const { notifications }           = useAppContext();
  const location  = useLocation();
  const navigate  = useNavigate();
  const pageLabel = PATH_LABELS[location.pathname] ?? "";

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="flex w-full h-full">

        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* ——— Top bar ——— */}
          <header className="flex items-center px-4 h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-0 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Page label */}
            {pageLabel && (
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                &gt; {pageLabel}
              </span>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Date & time */}
            <span className="mr-3 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {now.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
              {" "}
              {now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>

            {/* Notification bell */}
            <button
              onClick={() => navigate("/notification")}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg mr-2
                border border-gray-200 dark:border-gray-700
                text-gray-500 dark:text-gray-400
                bg-white dark:bg-gray-800
                hover:bg-gray-50 dark:hover:bg-gray-700
                cursor-pointer transition-colors"
              title="การแจ้งเตือน"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Theme toggle — top right */}
            <button
              onClick={toggle}
              className="flex items-center justify-center w-8 h-8 rounded-lg
                border border-gray-200 dark:border-gray-700
                text-gray-500 dark:text-gray-400
                bg-white dark:bg-gray-800
                hover:bg-gray-50 dark:hover:bg-gray-700
                cursor-pointer transition-colors"
              title={dark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </header>

          {/* ——— Page content ——— */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
