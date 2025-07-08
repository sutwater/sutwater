import React, { useState } from "react";
import { Link } from "react-router-dom";
import hospitalMap from "../../assets/hospital.png";
import "./HospitalMapImage.css";

interface Marker {
  name: string;
  xPercent: number;
  yPercent: number;
  waterUsage: number | null;
}

const statusMap: Record<string, string> = {
  "หอพักสุรนิเวศ 17": "ปกติ",
  "หอพักสุรนิเวศ 18": "ปกติ",
  อาคารศูนย์รังสีวินิจฉัย: "ปกติ",
  อาคารรัตนเวชพัฒน์: "ปกติ",
  อาคารศูนย์วิจัย: "ปกติ",
  ที่จอดรถยนต์: "ไม่พบการไหล",
  "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 1": "การไหลมากผิดปกติ",
  "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 2": "ปกติ",
  "อาคารศูนย์การแพทย์เฉพาะทาง 1": "ปกติ",
  "อาคารศูนย์การแพทย์เฉพาะทาง 2": "การไหลมากผิดปกติ",
  โรงอาหาร: "การไหลมากผิดปกติ",
};

const markers: Marker[] = [
  {
    name: "หอพักสุรนิเวศ 17",
    xPercent: 44.29,
    yPercent: 80.68,
    waterUsage: null,
  },
  {
    name: "หอพักสุรนิเวศ 18",
    xPercent: 44.34,
    yPercent: 74.1,
    waterUsage: null,
  },
  {
    name: "อาคารศูนย์รังสีวินิจฉัย",
    xPercent: 53.18,
    yPercent: 75.2,
    waterUsage: null,
  },
  {
    name: "อาคารรัตนเวชพัฒน์",
    xPercent: 57.39,
    yPercent: 74.81,
    waterUsage: null,
  },
  {
    name: "อาคารศูนย์วิจัย",
    xPercent: 57.64,
    yPercent: 59.68,
    waterUsage: null,
  },
  { name: "ที่จอดรถยนต์", xPercent: 64.86, yPercent: 25.9, waterUsage: null },
  {
    name: "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 1",
    xPercent: 63.41,
    yPercent: 36.33,
    waterUsage: null,
  },
  {
    name: "อาคารศูนย์ความเป็นเลิศทางการแพทย์ 2",
    xPercent: 63.46,
    yPercent: 41.7,
    waterUsage: null,
  },
  {
    name: "อาคารศูนย์การแพทย์เฉพาะทาง 1",
    xPercent: 46.61,
    yPercent: 48.58,
    waterUsage: null,
  },
  {
    name: "อาคารศูนย์การแพทย์เฉพาะทาง 2",
    xPercent: 46.22,
    yPercent: 57.49,
    waterUsage: null,
  },
  { name: "โรงอาหาร", xPercent: 61.15, yPercent: 71.57, waterUsage: null },
];

const HospitalMapImage: React.FC = () => {
  const [zoomed, setZoomed] = useState(false);
  const [focus, setFocus] = useState<Marker | null>(null);
  const [zoomedOutMarker, setZoomedOutMarker] = useState<string | null>(null);
  const [, setTransformOrigin] = useState<string>("50% 50%");
  const [isTransitioningSlow, setIsTransitioningSlow] = useState(false);

  const handleMarkerClick = (marker: Marker) => {
    if (!zoomed) setZoomed(true);
    if (focus?.name !== marker.name) {
      setIsTransitioningSlow(true);
      setFocus(marker);
      setTransformOrigin(`${marker.xPercent}% ${marker.yPercent}%`);
      setTimeout(() => setIsTransitioningSlow(false), 1200);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget.querySelector(
      ".map-image"
    ) as HTMLImageElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      console.log(`xPercent: ${x.toFixed(2)}, yPercent: ${y.toFixed(2)},`);
    }
    if (focus) {
      setZoomedOutMarker(focus.name);
      setZoomed(false);
      setTimeout(() => {
        setZoomedOutMarker(null);
        setFocus(null);
      }, 800);
    }
  };

  const getTransformStyle = () => {
    if (focus) {
      const maxTranslate = 25;
      let offsetX = 50 - focus.xPercent;
      let offsetY = 50 - focus.yPercent;
      offsetX = Math.max(Math.min(offsetX, maxTranslate), -maxTranslate);
      offsetY = Math.max(Math.min(offsetY, maxTranslate), -maxTranslate);
      const extraYOffset = -12;
      return {
        transform: zoomed
          ? `scale(2) translate(${offsetX / 2}%, ${
              (offsetY + extraYOffset) / 2
            }%)`
          : `scale(1) translate(0, ${extraYOffset}%)`,
        transformOrigin: `${focus.xPercent}% ${focus.yPercent}%`,
      };
    }
    return { transform: `translateY(-12%)` };
  };

  return (
    <div className="map-container" onClick={handleBackgroundClick}>
      <div
        className={`map-content ${
          isTransitioningSlow ? "transition-slow" : ""
        }`}
        style={getTransformStyle()}
      >
        <img src={hospitalMap} alt="Hospital" className="map-image" />
        {markers.map((marker, index) => (
          <div
            key={index}
            className={`map-marker ${zoomed ? "zoomed" : ""} ${
              zoomedOutMarker === marker.name ? "zoomed-out" : ""
            } ${focus?.name === marker.name ? "active" : ""}`}
            style={{
              left: `${marker.xPercent}%`,
              top: `${marker.yPercent}%`,
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerClick(marker);
            }}
          >
            {/* 🔴 จุดแดงถ้าสถานะไม่ปกติ */}
            {statusMap[marker.name] !== "ปกติ" && <div className="alert-dot" />}

            <div className="tooltip">{marker.name}</div>
            <div
              className={`marker-details ${
                zoomed && focus?.name === marker.name ? "visible" : ""
              }`}
              style={{
                pointerEvents:
                  zoomed && focus?.name === marker.name ? "auto" : "none",
              }}
            >
              <strong>{marker.name}</strong>
              <p style={{ margin: 0 }}>
                ปริมาณการใช้น้ำ:{" "}
                {marker.waterUsage !== null
                  ? `${marker.waterUsage.toFixed(2)} ลิตร`
                  : "กำลังเชื่อมต่อ..."}
              </p>
              <Link
                to={`/water/${encodeURIComponent(marker.name)}`}
                className="detail-button"
                onClick={(e) => e.stopPropagation()}
              >
                รายละเอียดเพิ่มเติม
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HospitalMapImage;
