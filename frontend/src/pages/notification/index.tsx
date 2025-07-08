import React from "react";
import { BellOutlined } from "@ant-design/icons";
import "./index.css";

const statusMap: Record<string, string> = {
  "หอพักสุรนิเวศ 17": "ปกติ",
  "หอพักสุรนิเวศ 18": "ปกติ",
  "อาคารศูนย์รังสีวินิจฉัย": "ปกติ",
  "อาคารรัตนเวชพัฒน์": "ปกติ",
  "อาคารศูนย์วิจัย": "ปกติ",
  "ที่จอดรถยนต์": "ไม่พบการไหล",
  "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 1": "การไหลมากผิดปกติ",
  "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 2": "ปกติ",
  "อาคารศูนย์การแพทย์เฉพาะทาง 1": "ปกติ",
  "อาคารศูนย์การแพทย์เฉพาะทาง 2": "การไหลมากผิดปกติ",
  "โรงอาหาร": "การไหลมากผิดปกติ",
};

const NotificationPage: React.FC = () => {
  const notifications = Object.entries(statusMap)
    .filter(([_, status]) => status !== "ปกติ")
    .map(
      ([name, status]) => `พบ${status}ที่จุด ${name} กรุณาตรวจสอบด้วย`
    );

  return (
    <>
      <div className="orange-underline" />
      <div className="notify-container">
        <div className="notify-box">
          <div className="notify-left">
            <div className="notify-heading">
              <BellOutlined style={{ fontSize: 48 }} />
              <h2>รายการแจ้งเตือนล่าสุด</h2>
              <p className="notify-subtitle">
                อัปเดตเมื่อ 04/06/2025 17:00 น.
              </p>
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
          <div className="notify-right">
            <h3>คำแนะนำการตรวจสอบ</h3>
            <ul>
              <li>ตรวจสอบท่อน้ำบริเวณที่แจ้งเตือน</li>
              <li>หากพบการรั่วซึม ให้แจ้งเจ้าหน้าที่ทันที</li>
              <li>บันทึกภาพประกอบและส่งรายงาน</li>
              <li>หากไม่พบความผิดปกติ ให้รีเซ็ตการแจ้งเตือน</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPage;
