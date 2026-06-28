import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GetUsersById } from "../services/https/user";
import {
  LayoutDashboard,
  Map,
  Cpu,
  Gauge,
  Wrench,
  User,
  ChevronUp,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import logo from "../assets/suth-noname.png";

type NavItem = { label: string; icon: React.ReactNode; path: string };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  "1": [
    { label: "แดชบอร์ด", icon: <LayoutDashboard size={18} />, path: "/" },
    { label: "แผนที่มิเตอร์", icon: <Map size={18} />, path: "/water-map" },
    { label: "อุปกรณ์", icon: <Cpu size={18} />, path: "/device" },
    { label: "มิเตอร์", icon: <Gauge size={18} />, path: "/meter" },
    { label: "บันทึกบำรุงรักษา", icon: <Wrench size={18} />, path: "/maintain-log" },
    { label: "ผู้ใช้", icon: <User size={18} />, path: "/user" },
  ],
  "2": [
    { label: "แดชบอร์ด", icon: <LayoutDashboard size={18} />, path: "/" },
    { label: "แผนที่มิเตอร์", icon: <Map size={18} />, path: "/water-map" },
    { label: "อุปกรณ์", icon: <Cpu size={18} />, path: "/device" },
    { label: "มิเตอร์", icon: <Gauge size={18} />, path: "/meter" },
    { label: "บันทึกบำรุงรักษา", icon: <Wrench size={18} />, path: "/maintain-log" },
    { label: "ผู้ใช้", icon: <User size={18} />, path: "/user" },
  ],
  "3": [
    { label: "แดชบอร์ด", icon: <LayoutDashboard size={18} />, path: "/" },
    { label: "แผนที่มิเตอร์", icon: <Map size={18} />, path: "/water-map" },
    { label: "บันทึกบำรุงรักษา", icon: <Wrench size={18} />, path: "/maintain-log" },
  ],
  "4": [
    { label: "แดชบอร์ด", icon: <LayoutDashboard size={18} />, path: "/" },
    { label: "แผนที่มิเตอร์", icon: <Map size={18} />, path: "/water-map" },
    { label: "แจ้งปัญหา", icon: <Wrench size={18} />, path: "/maintain-noti" },
  ],
};

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userOpen, setUserOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("");

  const email = localStorage.getItem("email") ?? "user@suth.ac.th";
  const firstname = localStorage.getItem("first_name") ?? "";
  const lastname = localStorage.getItem("last_name") ?? "";
  const initials = (firstname[0] ?? email[0] ?? "U").toUpperCase();
  const roleId = localStorage.getItem("role_id") ?? "4";
  const navItems = NAV_BY_ROLE[roleId] ?? NAV_BY_ROLE["4"];
  const fullname = `${firstname} ${lastname}`.trim();

  useEffect(() => {
    const uid = localStorage.getItem("id");
    if (!uid) return;
    GetUsersById(uid).then((res) => {
      if (res?.status === 200) {
        const u = res.data?.data ?? res.data;
        if (u?.profile_image) setProfileImage(u.profile_image);
      }
    });
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleNav = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const sidebarContent = (
    <aside
      className={`
        flex flex-col h-full select-none
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* ——— Header ——— */}
      <div className={`flex items-center shrink-0
        border-b border-gray-200 dark:border-gray-800
        ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"}`}
      >
        <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
          <img src={logo} alt="logo" className="w-7 h-7 object-contain" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">Suranaree Hospital</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">โรงพยาบาล มทส</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1 rounded-md cursor-pointer border-0 transition-colors shrink-0
            text-gray-400 hover:text-gray-600 hover:bg-gray-100
            dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800"
          title={collapsed ? "ขยาย sidebar" : "ย่อ sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* ——— Nav ——— */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!collapsed && (
          <p className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider
            text-gray-400 dark:text-gray-500">
            เมนู
          </p>
        )}
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center rounded-md text-sm
                transition-colors duration-100 cursor-pointer border-0
                ${collapsed ? "justify-center p-2.5" : "gap-2.5 px-2 py-2"}
                ${active
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"}
              `}
            >
              <span className={active ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>
                {item.icon}
              </span>
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* ——— User footer ——— */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-2 py-2 shrink-0">
        {userOpen && !collapsed && (
          <>
            <button
              onClick={() => handleNav("/profile")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-0.5
                text-gray-600 dark:text-gray-300
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors cursor-pointer border-0"
            >
              <User size={15} />
              โปรไฟล์
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1
                text-red-500 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-950
                transition-colors cursor-pointer border-0"
            >
              <LogOut size={15} />
              ออกจากระบบ
            </button>
          </>
        )}
        {userOpen && collapsed && (
          <>
            <button
              onClick={() => handleNav("/profile")}
              title="โปรไฟล์"
              className="w-full flex justify-center p-2 rounded-md mb-0.5
                text-gray-500 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors cursor-pointer border-0"
            >
              <User size={16} />
            </button>
            <button
              onClick={handleLogout}
              title="ออกจากระบบ"
              className="w-full flex justify-center p-2 rounded-md mb-1
                text-red-500 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-950
                transition-colors cursor-pointer border-0"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
        <button
          onClick={() => setUserOpen((v) => !v)}
          className={`w-full flex items-center rounded-md cursor-pointer border-0
            hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
            ${collapsed ? "justify-center p-2" : "gap-2.5 px-2 py-2"}`}
        >
          {profileImage ? (
            <img src={profileImage} alt="avatar"
              className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">{fullname}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">{email}</p>
              </div>
              <ChevronUp
                size={14}
                className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${userOpen ? "" : "rotate-180"}`}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ——— Desktop sidebar ——— */}
      <div className="hidden md:flex h-screen">
        {sidebarContent}
      </div>

      {/* ——— Mobile overlay ——— */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative z-50 flex h-full w-60">
            {sidebarContent}
            <button
              onClick={onMobileClose}
              className="absolute top-3 right-3 p-1 rounded-md cursor-pointer border-0
                text-gray-400 hover:text-gray-600 hover:bg-gray-100
                dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
