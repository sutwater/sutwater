import React, { useEffect, useState } from "react";
import { useParams , useNavigate} from "react-router-dom";
import "./WaterDetailPage.css";

type WaterDataKeys =
  | "อาคารอุบัติเหตุและฉุกเฉิน"
  | "อาคารผู้ป่วยใน"
  | "อาคารศูนย์การแพทย์"
  | "อาคารรัตนเวชพัฒน์"
  | "อาคารศูนย์วิจัย";

interface WaterData {
  waterUsage: string;
  pressure: string;
  status: string;
  lastUpdated: string;
}

const waterData: Record<WaterDataKeys, WaterData> = {
  อาคารอุบัติเหตุและฉุกเฉิน: {
    waterUsage: "1500 ลิตร",
    pressure: "1.2 bar",
    status: "ปกติ",
    lastUpdated: "09/05/2025, 14:30",
  },
  อาคารผู้ป่วยใน: {
    waterUsage: "2300 ลิตร",
    pressure: "1.1 bar",
    status: "ปกติ",
    lastUpdated: "09/05/2025, 14:20",
  },
  อาคารศูนย์การแพทย์: {
    waterUsage: "2000 ลิตร",
    pressure: "1.3 bar",
    status: "แจ้งเตือน: แรงดันต่ำ",
    lastUpdated: "09/05/2025, 14:25",
  },
  อาคารรัตนเวชพัฒน์: {
    waterUsage: "1800 ลิตร",
    pressure: "1.0 bar",
    status: "ปกติ",
    lastUpdated: "09/05/2025, 14:10",
  },
  อาคารศูนย์วิจัย: {
    waterUsage: "1250 ลิตร",
    pressure: "1.2 bar",
    status: "ปกติ",
    lastUpdated: "09/05/2025, 14:15",
  },
};

const WaterDetailPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [data, setData] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const decodedName = decodeURIComponent(name ?? "");

    // 🔍 ตรวจสอบว่า Key นั้นมีอยู่ใน waterData หรือไม่
    if (decodedName in waterData) {
      setData(waterData[decodedName as WaterDataKeys]);
    }
  }, [name]);

  if (!data) {
    return (
      <p style={{ textAlign: "center", marginTop: "20px" }}>
        ไม่พบข้อมูลสำหรับจุดที่เลือก
      </p>
    );
  }

  return (
    <div className="detail-container">
      <h1>รายละเอียดการใช้น้ำของ {decodeURIComponent(name ?? "")}</h1>
      <ul>
        <li>
          <strong>ปริมาณการใช้น้ำ:</strong> {data.waterUsage}
        </li>
        <li>
          <strong>แรงดันน้ำ:</strong> {data.pressure}
        </li>
        <li>
          <strong>สถานะ:</strong> {data.status}
        </li>
        <li>
          <strong>อัพเดทล่าสุด:</strong> {data.lastUpdated}
        </li>
      </ul>
    </div>
  );
};

export default WaterDetailPage;
