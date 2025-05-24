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

const markers: Marker[] = [
  {
    name: "อาคารอุบัติเหตุและฉุกเฉิน",
    xPercent: 42.36,
    yPercent: 78.95,
    waterUsage: null,
  },
  {
    name: "อาคารผู้ป่วยใน",
    xPercent: 42.36,
    yPercent: 71.95,
    waterUsage: null,
  },
  {
    name: "อาคารศูนย์การแพทย์",
    xPercent: 53.18,
    yPercent: 75.2,
    waterUsage: null,
  },
  {
    name: "อาคารรัตนเวชพัฒน์",
    xPercent: 57.32,
    yPercent: 81.01,
    waterUsage: null,
  },
  {
    name: "อาคารศูนย์วิจัย",
    xPercent: 57.64,
    yPercent: 59.68,
    waterUsage: null,
  },
];

const HospitalMapImage: React.FC = () => {
  const [zoomed, setZoomed] = useState(false);
  const [focus, setFocus] = useState<Marker | null>(null);
  const [zoomedOutMarker, setZoomedOutMarker] = useState<string | null>(null);
  const [, setTransformOrigin] = useState<string>("50% 50%");
  const [isTransitioningSlow, setIsTransitioningSlow] = useState(false);

  const handleMarkerClick = (marker: Marker) => {
    if (!zoomed) {
      setZoomed(true);
    }

    if (focus?.name !== marker.name) {
      setIsTransitioningSlow(true);
      setFocus(marker);
      setTransformOrigin(`${marker.xPercent}% ${marker.yPercent}%`);

      setTimeout(() => {
        setIsTransitioningSlow(false);
      }, 1200);
    }
  };

  const handleBackgroundClick = () => {
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
              pointerEvents: "auto", // ✅ คลิกที่ Marker ได้เสมอ
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerClick(marker);
            }}
          >
            <div className="tooltip">{marker.name}</div>
            <div
              className={`marker-details ${
                zoomed && focus?.name === marker.name ? "visible" : ""
              }`}
              style={{
                pointerEvents:
                  zoomed && focus?.name === marker.name ? "auto" : "none", // ✅ กดได้เฉพาะเมื่อ Zoomed
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
                onClick={(e) => {
                  e.stopPropagation();
                }}
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
