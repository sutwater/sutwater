import React from "react";
import meterImg from "../../assets/meter.jpg";

const WaterPage: React.FC = () => {
  return (
    <div style={{ background: "#f15a29", padding: 20 }}>
      <div
        style={{
          background: "white",
          padding: 30,
          maxWidth: 1000,
          margin: "0 auto",
          borderRadius: 5,
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "32px", marginBottom: 20 }}>ใช้น้ำไปทั้งหมด</h2>
        <img
          src={meterImg}
          alt="water meter"
          style={{ maxWidth: "300px", width: "100%" }}
        />
        {/* จุดนี้คุณสามารถเพิ่มข้อมูลการใช้น้ำได้ */}
        <p style={{ fontSize: 20, marginTop: 20, color: "#333" }}>
          {/* แสดงข้อมูลที่คุณจะเพิ่มในอนาคต เช่น */}
          {/* ปริมาณการใช้น้ำวันนี้: 123.45 ลิตร */}
        </p>
      </div>
    </div>
  );
};

export default WaterPage;
