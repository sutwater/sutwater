import React from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import WaterPage from "../../pages/water";
import NotificationPage from "../../pages/notification";
import ContactPage from "../../pages/contact";
import logo from "../../assets/logo.png";
import "./index.css";

const FullLayout: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const user = {
    name: "User",
    avatar: "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // หากมีลิงก์รูปโปรไฟล์ใส่ตรงนี้ เช่น "https://example.com/profile.jpg"
  };

  return (
    <div className="full-layout">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <img src={logo} alt="logo" className="logo" />
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
          <div className="user-btn">
            {user.avatar ? (
              <img src={user.avatar} alt="profile" className="avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user.name?.charAt(0).toUpperCase() || ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <Routes>
        <Route
          path="/"
          element={
            <div className="content-wrapper">
              <div className="content-box">
                <p>
                  ที่มาและความสำคัญของโครงการ <br />
                  <br />
                  โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ประกอบด้วยอาคารทั้งหมด{" "}
                  <strong>11</strong> ตึก
                  และมีการใช้น้ำประปาอย่างต่อเนื่องตลอดเวลา
                  ส่งผลให้ในแต่ละเดือนมีค่าใช้จ่ายด้านค่าน้ำประปาจำนวนมาก
                  ปัจจุบันมีการใช้วิธีให้เจ้าหน้าที่เดินตรวจสอบและจดค่ามิเตอร์น้ำด้วยตนเอง
                  เพื่อนำข้อมูลไปคำนวณและเปรียบเทียบกับค่าน้ำที่ต้องชำระ
                  อย่างไรก็ตาม กระบวนการดังกล่าวอาจทำให้การตรวจพบปัญหา เช่น
                  ท่อประปารั่วหรืออุปกรณ์ชำรุด ล่าช้า
                  เนื่องจากมักทราบปัญหาดังกล่าวได้ก็ต่อเมื่อมีผู้ใช้งานแจ้งเข้ามา
                  ส่งผลให้เกิดการสูญเสียน้ำและค่าใช้จ่ายโดยไม่จำเป็น ดังนั้น
                  การพัฒนาระบบที่ช่วยตรวจสอบและแจ้งเตือนความผิดปกติของการใช้น้ำแบบอัตโนมัติ
                  จะช่วยลดภาระงานเจ้าหน้าที่ เพิ่มความแม่นยำในการตรวจสอบ
                  และลดความสูญเสียที่อาจเกิดขึ้นได้อย่างทันท่วงที
                </p>
              </div>
            </div>
          }
        />
        <Route path="/water" element={<WaterPage />} />
        <Route path="/notification" element={<NotificationPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </div>
  );
};

export default FullLayout;
