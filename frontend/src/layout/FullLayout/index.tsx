import React, { useState } from "react";
import {
  Routes,
  Route,

  Navigate,
  useLocation,
} from "react-router-dom";
import { Carousel } from "antd";
//import { UserOutlined, LogoutOutlined, LoginOutlined } from "@ant-design/icons";

import WaterPage from "../../pages/water/HospitalMapImage";
import NotificationPage from "../../pages/notification";
import ContactPage from "../../pages/contact";
import WaterDetailPage from "../../pages/water/WaterDetail";
import SignInPages from "../../pages/authentication/Login/SignInPages";
import SignUpPages from "../../pages/authentication/Register/SignUpPages";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import ProfilePage from "../../pages/profile/ProfilePage";
//import logo from "../../assets/logo.png";
import Navbar from '../../components/Navbar';
import "./index.css";

const FullLayout: React.FC = () => {
  //const location = useLocation();
  //const navigate = useNavigate();
  //const isActive = (path: string) => location.pathname === path;
  const [showLogin, setShowLogin] = useState(false);
  const isAdminPath = useLocation().pathname.startsWith('/admin');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    localStorage.getItem("isLogin") === "true"
  );

  // const handleMenuClick: MenuProps["onClick"] = (e) => {
  //   if (e.key === "logout") {
  //     localStorage.clear();
  //     setIsLoggedIn(false);
  //     navigate("/login");
  //   } else if (e.key === "profile") {
  //     navigate("/profile");
  //   } else if (e.key === "register") {
  //     navigate("/signup");
  //   }
  // };

  // const menuItems: MenuProps["items"] = isLoggedIn
  //   ? [
  //     {
  //       key: "profile",
  //       label: "โปรไฟล์",
  //       icon: <UserOutlined />,
  //     },
  //     {
  //       key: "logout",
  //       label: "ออกจากระบบ",
  //       icon: <LogoutOutlined />,
  //       danger: true,
  //     },
  //   ]
  //   : [
  //     {
  //       key: "register",
  //       label: "ลงทะเบียน",
  //       icon: <LoginOutlined />,
  //     },
  //   ];

  // const user = {
  //   name: "User",
  //   avatar: "",
  // };

  return (
    <div className="full-layout">
      {/* <div className="header">
        <div className="header-left">
          <Link to="/">
            <img src={logo} alt="logo" className="logo" />
          </Link>
          <div className="sut-info">
            <h1 className="sut-title">มหาวิทยาลัยเทคโนโลยีสุรนารี</h1>
            <p className="sut-subtitle">suranaree university of technology</p>
          </div>
        </div>

        <div className="nav-links">
          <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
            หน้าแรก
          </Link>
          <Link
            to="/water"
            className={`nav-item ${isActive("/water") ? "active" : ""}`}
          >
            ตรวจสอบการใช้น้ำ
          </Link>
          <Link
            to="/notification"
            className={`nav-item ${isActive("/notification") ? "active" : ""}`}
          >
            แจ้งเตือนการใช้น้ำ
          </Link>
          <Link
            to="/contact"
            className={`nav-item ${isActive("/contact") ? "active" : ""}`}
          >
            ติดต่อสอบถาม
          </Link>

          {localStorage.getItem("isAdmin") === "true" && (
            <Link
              to="/admin"
              className={`nav-item ${isActive("/admin") ? "active" : ""}`}
            >
              แอดมิน
            </Link>
          )}

          <Dropdown
            menu={{ items: menuItems, onClick: handleMenuClick }}
            placement="bottomRight"
            trigger={["hover"]}
            arrow
          >
            <div className="user-btn">
              {user.avatar ? (
                <img src={user.avatar} alt="profile" className="avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {user.name?.charAt(0).toUpperCase() || ""}
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </div> */}
      {!isAdminPath && <Navbar setShowLogin={setShowLogin} />}


      {/* Main Content Area */}
      {/* Scrollable Main Content */}
      <div className="main-scroll-area">
        <Routes>
          <Route
            path="/"
            element={
              <div className="content-wrapper">
                <Carousel
                  autoplay
                  effect="fade"
                  dotPosition="bottom"
                  pauseOnHover
                >
                  <div>
                    <img
                      src="https://beta.sut.ac.th/wp-content/uploads/2022/09/banner-01-2-scaled.jpg"
                      alt="SUT Banner 1"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "80vh",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div>
                    <img
                      src="https://beta.sut.ac.th/wp-content/uploads/2022/09/sutbanner-01-scaled.jpg"
                      alt="SUT Banner 2"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "80vh",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                </Carousel>
              </div>
            }
          />
          <Route path="/water" element={<WaterPage />} />
          <Route
            path="/notification"
            element={
              isLoggedIn ? <NotificationPage /> : <Navigate to="/login" />
            }
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/water/:name" element={<WaterDetailPage />} />
          <Route path="/login" element={<SignInPages />} />
          <Route path="/signup" element={<SignUpPages />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={
              localStorage.getItem("isAdmin") === "true" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default FullLayout;
