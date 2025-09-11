import React, { useMemo } from "react";
import QRCode from "react-qr-code";

const LIFF_ID = import.meta.env.VITE_LIFF_ID || process.env.REACT_APP_LIFF_ID;
const FRONTEND_BASE = import.meta.env.VITE_FRONTEND_BASE || window.location.origin;
// ถ้ามี endpoint สร้างลายเซ็น (sig) ฝั่ง backend ให้ fetch มาก่อนแล้วประกอบ URL ตรงนี้ได้

type Props = {
  userId: number;           // user id ภายในระบบของคุณ
  useSigned?: boolean;      // ถ้าเปิดใช้ลายเซ็น (HMAC) ให้ไปขอจาก backend ก่อน (ทางเลือก)
  signedSig?: string;       // ลายเซ็นที่ backend สร้างมาให้ (ถ้าใช้)
};

export default function AdminLineLink({ userId, useSigned = false, signedSig = "" }: Props) {
  const linkUrl = useMemo(() => {
    if (!LIFF_ID) return "";
    const base = `https://liff.line.me/${LIFF_ID}`;
    const params = new URLSearchParams({ state: String(userId) });
    if (useSigned && signedSig) params.set("sig", signedSig);
    return `${base}?${params.toString()}`;
  }, [userId, useSigned, signedSig]);

  if (!LIFF_ID) {
    return <div style={{color:"crimson"}}>ยังไม่ได้ตั้งค่า LIFF_ID</div>;
  }

  return (
    <div style={{display:"grid", gap:12, justifyItems:"center"}}>
      <div style={{display:"grid", gap:6}}>
        <b>ลิงก์เชื่อมบัญชี (User #{userId})</b>
        <a href={linkUrl} target="_blank" rel="noreferrer">{linkUrl}</a>
        <button onClick={() => navigator.clipboard.writeText(linkUrl)}>คัดลอกลิงก์</button>
      </div>
      <div style={{background:"#fff", padding:12}}>
        <QRCode value={linkUrl || "about:blank"} size={180}/>
      </div>
      <small>ให้ผู้ใช้สแกน QR นี้ “ในแอป LINE” เพื่อเชื่อมบัญชี</small>
    </div>
  );
}
