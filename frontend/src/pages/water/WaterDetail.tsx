import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./WaterDetailPage.css";

interface WaterData {
  flowLevel: number | null;
  status: string;
  lastUpdated: string;
}

const mockData: Record<string, WaterData> = {
  "หอพักสุรนิเวศ 17": { flowLevel: 25.4, status: "ปกติ", lastUpdated: "04/06/2025, 17:00" },
  "หอพักสุรนิเวศ 18": { flowLevel: 22.1, status: "ปกติ", lastUpdated: "04/06/2025, 16:58" },
  "อาคารศูนย์รังสีวินิจฉัย": { flowLevel: 35.7, status: "ปกติ", lastUpdated: "04/06/2025, 16:55" },
  "อาคารรัตนเวชพัฒน์": { flowLevel: 47.3, status: "ปกติ", lastUpdated: "04/06/2025, 16:53" },
  "อาคารศูนย์วิจัย": { flowLevel: 45.8, status: "ปกติ", lastUpdated: "04/06/2025, 16:50" },
  "ที่จอดรถยนต์": { flowLevel: 5.6, status: "ไม่พบการไหล", lastUpdated: "04/06/2025, 16:48" },
  "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 1": { flowLevel: 60.2, status: "การไหลมากผิดปกติ", lastUpdated: "04/06/2025, 16:45" },
  "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 2": { flowLevel: 58.9, status: "ปกติ", lastUpdated: "04/06/2025, 16:43" },
  "อาคารศูนย์การแพทย์เฉพาะทาง 1": { flowLevel: 29.4, status: "ปกติ", lastUpdated: "04/06/2025, 16:40" },
  "อาคารศูนย์การแพทย์เฉพาะทาง 2": { flowLevel: 66.7, status: "การไหลมากผิดปกติ", lastUpdated: "04/06/2025, 16:38" },
  "โรงอาหาร": { flowLevel: 75.5, status: "การไหลมากผิดปกติ", lastUpdated: "04/06/2025, 16:35" },
};

const WaterDetailPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<WaterData | null>(null);

  useEffect(() => {
    const decodedName = decodeURIComponent(name ?? "");
    if (decodedName in mockData) {
      setData(mockData[decodedName]);
    }
  }, [name]);

  if (!data) {
    return (
      <>
        <div className="orange-underline" />
        <div className="detail-wrapper">
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            ไม่พบข้อมูลสำหรับจุดที่เลือก
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="orange-underline" />
      <div className="detail-wrapper">
        <div className="detail-container">
          <h1>ผลวิเคราะห์น้ำไหลของ {decodeURIComponent(name ?? "")}</h1>
          <ul>
            <li>
              <strong>จำนวนของน้ำที่ใช้:</strong>{" "}
              {data.flowLevel !== null
                ? `${data.flowLevel.toFixed(1)} หน่วย`
                : "ยังไม่มีข้อมูล"}
            </li>
            <li>
              <strong>สถานะ:</strong> {data.status}
            </li>
            <li>
              <strong>วิเคราะห์ล่าสุด:</strong> {data.lastUpdated}
            </li>
          </ul>
          <button className="back-button" onClick={() => navigate("/water")}>
            ⬅ ย้อนกลับ
          </button>
        </div>
      </div>
    </>
  );
};

export default WaterDetailPage;
