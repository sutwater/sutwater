import React from "react";
import { BellOutlined } from "@ant-design/icons";
import "./index.css";

const NotificationPage: React.FC = () => {
  const notifications = [
    "มีความผิดปกติในการใช้น้ำที่จุดบริเวณสนามหญ้า กรุณาตรวจสอบด้วย",
    "มีความผิดปกติในการใช้น้ำที่จุดบริเวณหน้าโรงพยาบาล กรุณาตรวจสอบด้วย",
    "มีความผิดปกติในการใช้น้ำที่จุดบริเวณห้องน้ำ กรุณาตรวจสอบด้วย",
    "มีความผิดปกติในการใช้น้ำที่จุดบริเวณโรงจอดรถ กรุณาตรวจสอบด้วย",
  ];

  return (
    <div className="notify-container">
      <div className="notify-box">
        <div className="notify-icon">
          <BellOutlined style={{ fontSize: 100 }} />
        </div>
        <div className="notify-list">
          {notifications.map((note, index) => (
            <div className="notify-item" key={index}>
              <span className="dot" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
