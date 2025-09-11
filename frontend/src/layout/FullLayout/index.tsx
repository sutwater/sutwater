import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "./index.css";

const FullLayout: React.FC = () => {
  return (
    <div className="full-layout">
      <Navbar />
      <div className="main-scroll-area">
        {/* ทุกหน้าลูกของ path "/" จะถูกเรนเดอร์ตรงนี้ */}
        <Outlet />
      </div>
    </div>
  );
};

export default FullLayout;
