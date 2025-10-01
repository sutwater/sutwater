import { assets, menuLinks } from "../assets/assets";
// ฟังก์ชันสำหรับดึงตัวอักษรตัวแรกที่ไม่ใช่สระ (ภาษาไทย)
function getThaiInitial(name: string): string {
  if (!name) return "U";
  // รายการสระนำหน้าที่ไม่ควรใช้เป็น Avatar
  const vowels = [
    "ะ","ั","า","ำ","ิ","ี","ึ","ื","ุ","ู","เ","แ","โ","ใ","ไ","ๅ","็","๋","้","๊","์","่","ํ"
  ];
  for (const ch of name) {
    if (!vowels.includes(ch)) {
      return ch.toUpperCase();
    }
  }
  return name.charAt(0).toUpperCase() || "U";
}
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { readAllNotifications, readNotificationByID, deleteNotificationByID } from "../services/https";
import { useAppContext } from "../contexts/AppContext";
import {
  ChevronDown,
  Settings,
  LogOut,
  Edit,
  X,
  Check,
  Bell,
} from "lucide-react";
import { NotificationInterface } from "../interfaces/InterfaceAll";

// User Profile Dropdown Component
const UserProfileDropdown = ({
  user,
  onLogout,
}: {
  user: any;
  onLogout: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  const handleEditProfile = () => {
    window.location.href = "/profile";
    setIsOpen(false);
  };

  const handleSettings = () => {
    console.log("การตั้งค่า");
    // ใส่โค้ดการตั้งค่าที่นี่
    setIsOpen(false);
  };

  const handleAdminDashboard = () => {
    window.location.href = "/admin";
    setIsOpen(false);
  };

  return (
    <div className="relative z-1000 inline-block text-left" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      >
        {/* Avatar */}
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            getThaiInitial(user?.first_name)
          )}
        </div>

        {/* Welcome Text - ซ่อนในหน้าจอเล็ก */}
        <div
          className="hidden sm:flex flex-col items-start"
          style={{ cursor: "pointer" }}
        >
          <span className="text-xs text-gray-600 leading-tight">
            ยินดีต้อนรับ
          </span>
          <span className="text-sm font-semibold text-gray-900 leading-tight">
            {user?.first_name} {user?.last_name}
          </span>
        </div>

        <div
            className="flex flex-col items-start sm:hidden" // 👈 แก้ตรงนี้
            style={{ cursor: "pointer" }}
          >
            <span className="text-xs text-gray-600 leading-tight">
              
            </span>
            <span className="text-sm font-semibold text-gray-900 leading-tight">
              {user?.first_name} {user?.last_name}
            </span>
          </div>


        {/* Arrow */}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  getThaiInitial(user?.first_name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              style={{ cursor: "pointer" }} // เพิ่ม cursor: pointer
            >
              <Edit className="w-4 h-4" />
              แก้ไขข้อมูลส่วนตัว
            </button>

            {user?.isAdmin && (
              <button
                onClick={handleAdminDashboard}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                style={{ cursor: "pointer" }} // เพิ่ม cursor: pointer
              >
                <Settings className="w-4 h-4" />
                Admin Dashboard
              </button>
            )}

            <div className="border-t border-gray-100 mt-2 pt-2 hidden sm:block">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                style={{ cursor: "pointer" }} // เพิ่ม cursor: pointer
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationDropdown = ({
  notification,
}: {
  notification: NotificationInterface[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getNotification } = useAppContext();
  const [localNotifications, setLocalNotifications] =

  
    useState<NotificationInterface[]>(notification);
  const dropdownRef = useRef<HTMLDivElement>(null);
localNotifications.forEach((n, i) => {
  console.log(i, n.IsRead, typeof n.IsRead);
});


  useEffect(() => {
    setLocalNotifications(notification);
  }, [notification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = localNotifications.filter((n) => !n.IsRead).length;
  console.log("unreadCount:", unreadCount);

  
const markAsRead = async (id: string) => {
    try {
      await readNotificationByID(id);
      await getNotification(); // โหลดใหม่หลังอ่าน
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await readAllNotifications();
      await getNotification(); // โหลดใหม่หลังอ่านทั้งหมด
    } catch (err) {
      console.error(err);
    }
  };

  const clearNotification = async (id: string) => {
    try {
      await deleteNotificationByID(id);
      await getNotification(); // โหลดใหม่หลังลบ
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative z-50 inline-block text-left" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 cursor-pointer"
        aria-label="การแจ้งเตือน"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white shadow-md ">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              การแจ้งเตือน
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  อ่านทั้งหมด
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {localNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Bell className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-center">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              localNotifications.map((n) => (
                <div
                  key={n.ID}
                  className={`group relative p-4 border-b border-gray-50 hover:bg-gray-25 transition-all duration-150 ${
                    !n.IsRead ? "bg-blue-25 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !n.IsRead ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    ></div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-5 ${
                          !n.IsRead
                            ? "text-gray-900 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {n.Message}
                      </p>
                      {n.CameraDevice?.MeterLocation?.Name && (
                        <p className="text-xs text-purple-600 mt-1">
                          📍 ตำแหน่ง: {n.CameraDevice?.MeterLocation?.Name}
                        </p>
                      )}
                      {n.CreatedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(n.CreatedAt).toLocaleString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.IsRead && (
                        <button
                          onClick={() => markAsRead(n.ID.toString())}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
                          title="ทำเครื่องหมายว่าอ่านแล้ว"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(n.ID.toString())}
                        className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors cursor-pointer"
                        title="ลบการแจ้งเตือน"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const { setUser, user, notifications } = useAppContext();
  console.log(notifications)
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  return (
    <div
      className={`flex items-center z-50 justify-between px-6 md:px-16 lg:px-24
        xl:px-32 text-gray-600 border-b border-borderColor relative transition-all
        ${location.pathname === "/" && "bg-light"}`}
    >
      {/* Logo */}
      <Link to="/">
        <img src={assets.suth_logo} alt="logo" className="logo" />
      </Link>

      {/* เมนู (จอใหญ่) */}
      <div
        className={`max-sm:fixed max-sm:h-screen max-sm:w-full max-sm:top-20 
            max-sm:border-t border-borderColor right-0 flex flex-col sm:flex-row 
            items-center sm:items-center gap-4 sm:gap-8 max-sm:p-4 transition-all 
            duration-300 z-40 ${
              location.pathname === "/" ? "bg-light" : "bg-white"
            } 
            ${open ? "max-sm:translate-x-0" : "max-sm:-translate-x-full"}`}
      >
        {menuLinks.map((link: { name: string; path: string }, index: number) => {
  const isActive = location.pathname === link.path;
  return (
    <Link
      key={index}
      to={link.path}
      onClick={() => setOpen(false)}
      className={`
        relative px-3 py-2 rounded transition-all duration-300 cursor-pointer
        ${isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-500"}
      `}
    >
      {link.name}

      {/* underline animation */}
      <span
        className={`
          absolute left-0 bottom-0 h-0.5 bg-blue-500 transition-all duration-300
          ${isActive ? "w-full" : "w-0 group-hover:w-full"}
        `}
      />
    </Link>
  );
})}


        

        {/* แสดงแจ้งเตือนเฉพาะจอใหญ่ */}
        {notifications && (
          <div className="hidden sm:block">
            <NotificationDropdown notification={notifications} />
          </div>
        )}

        {/* User Profile */}
        {user ? (
          <UserProfileDropdown user={user} onLogout={handleLogout} />
        ) : (
          <Link to="/login" className="text-blue-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        )}

        {user && (
    <button
      onClick={handleLogout}
      className="sm:hidden text-red-600 font-bold text-xl underline cursor-pointer"
    >
      ออกจากระบบ
    </button>
  )}
      </div>
      

      {/* Mobile Right Side (แจ้งเตือน + Hamburger) */}
      <div className="flex items-center gap-8 sm:hidden">
        {notifications && (
          <NotificationDropdown notification={notifications} />
        )}
        <button
          className="cursor-pointer"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <img src={open ? assets.close_icon : assets.menu_icon} alt="menu" />
        </button>
      </div>
    </div>
  );
};


export default Navbar;