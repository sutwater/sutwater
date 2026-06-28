import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "./index.css";

const FullLayout: React.FC = () => {
  const isLoggedIn = localStorage.getItem("isLogin") === "true";

  return (
    <div className="full-layout">
      {isLoggedIn && <Navbar />}
      <div className="main-scroll-area">
        <Outlet />
      </div>
    </div>
  );
};

export default FullLayout;
