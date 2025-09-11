import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // นำเข้า useNavigate
import "./LiffLink.css"; // นำเข้าไฟล์ CSS
import Line from "../../assets/line.png"; // นำเข้าโลโก้ LINE

const API_BASE = import.meta.env.VITE_API_BASE;

export default function LiffLink() {
  const [status, setStatus] = useState<string>("กำลังโหลด QR Code...");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [lineUserID, setLineUserID] = useState<string>(""); // ช่องกรอก Line User ID
  const [validationMessage, setValidationMessage] = useState<string>(""); // ข้อความแจ้งเตือน
  const navigate = useNavigate(); // ใช้สำหรับเปลี่ยนหน้า

  // ดึง QR Code ทันทีเมื่อหน้าโหลด
  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const res = await fetch(`${API_BASE}/line/get-qrcode`);
        console.log("Response Status:", res.status); // Debug: พิมพ์สถานะ Response

        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          setStatus("เกิดข้อผิดพลาดในการโหลด QR Code");
          return;
        }

        const data = await res.json();
        console.log("QR Code Data:", data); // Debug: พิมพ์ข้อมูล QR Code
        setQrUrl(data.qrCodeBase64);
        setStatus("กรุณาแสกน QR Code หรือ แอดไลน์");
      } catch (err) {
        console.error("Fetch Error:", err); // Debug: พิมพ์ข้อผิดพลาด
        setStatus(
          "เกิดข้อผิดพลาด: " +
            (err instanceof Error ? err.message : "ไม่ทราบสาเหตุ")
        );
      }
    };

    fetchQRCode();
  }, []);

  // ฟังก์ชันสำหรับเปิด LIFF URL
  const handleLoginWithLine = () => {
    const lineId = "504xabge"; // แทนที่ด้วย LINE ID ของคุณ
    const addFriendUrl = `https://line.me/R/ti/p/@${lineId}`;
    window.location.href = addFriendUrl; // เปลี่ยนเส้นทางไปยังลิงก์เพิ่มเพื่อน
  };

  // ฟังก์ชันตรวจสอบและบันทึก Line User ID
  const handleValidateLineUserID = async () => {
    // ตรวจสอบความยาวของ Line User ID
    if (lineUserID.length >= 10 && lineUserID.length <= 33) {
      try {
        // ดึง userID จาก localStorage
        const userID = localStorage.getItem("id");
        if (!userID) {
          setValidationMessage("❌ ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
          return;
        }

        // ส่งข้อมูลไปยัง Backend เพื่อบันทึก Line User ID
        const res = await fetch(`${API_BASE}/line/save-line-userid`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: Number(userID), // แปลง userID เป็นตัวเลข
            line_user_id: lineUserID,
          }),
        });

        if (res.ok) {
          // แสดงข้อความสำเร็จพร้อมไอคอน
          setValidationMessage("เชื่อมต่อ LINE สำเร็จ");

          // เปลี่ยนเส้นทางไปยังหน้า Profile หลังจาก 2 วินาที
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        } else {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          setValidationMessage("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } catch (err) {
        console.error("Error:", err);
        setValidationMessage("❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ");
      }
    } else {
      setValidationMessage(
        "❌ Line User ID ไม่ถูกต้อง (ต้องมีความยาวระหว่าง 10 ถึง 33 ตัวอักษร)"
      );
    }
  };

  return (
    <main className="liff-link-container">
      <div className="liff-link-content">
        <h1>เชื่อม LINE</h1>
        <p>{status}</p>
        {qrUrl && (
          <div className="qr-code-section">
            <img
              src={`data:image/png;base64,${qrUrl}`}
              alt="QR Code"
              className="qr-code"
            />
            <div className="divider"></div>
            <button onClick={handleLoginWithLine} >
              <img
                src={Line} // ใช้ตัวแปร Line ที่นำเข้ามา
                alt="LINE Logo"
                className="line-logo"
              />
            </button>
          </div>
        )}
        <div className="input-section">
          <input
            type="text"
            value={lineUserID}
            onChange={(e) => setLineUserID(e.target.value)}
            placeholder="กรอก Line User ID"
            className="line-user-input"
          />
          <button
            onClick={handleValidateLineUserID}
            className="validate-button"
          >
            ยืนยัน
          </button>
        </div>
        {validationMessage && (
          <div className="validation-message-container">
            <div
              className={`validation-icon ${
                validationMessage.includes("✅") ? "success" : "error"
              }`}
            >
              {validationMessage.includes("✅") ? (
                <span className="checkmark-icon">✔</span> // ไอคอนติ๊กถูก
              ) : (
                <span className="error-icon">✖</span> // ไอคอนผิดพลาด
              )}
            </div>
            <p
              className={`validation-message ${
                validationMessage.includes("✅") ? "success" : "error"
              }`}
            >
              {validationMessage}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
