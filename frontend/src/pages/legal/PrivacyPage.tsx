import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/suth-noname.png";

const HOSPITAL = "โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี";

const sections = [
  {
    title: "1. ข้อมูลที่เราเก็บรวบรวม",
    body: "ระบบเก็บรวบรวมข้อมูลส่วนบุคคล ได้แก่ ชื่อ-นามสกุล อีเมล ตำแหน่งงาน และข้อมูลที่เกี่ยวข้องกับการใช้น้ำภายในโรงพยาบาล นอกจากนี้ยังเก็บข้อมูลการเข้าสู่ระบบ เช่น IP Address และเวลาเข้าใช้งาน เพื่อความปลอดภัยของระบบ",
  },
  {
    title: "2. วัตถุประสงค์ในการใช้ข้อมูล",
    body: "ข้อมูลที่เก็บรวบรวมถูกนำไปใช้เพื่อ (1) การยืนยันตัวตนและจัดการสิทธิ์การเข้าถึง (2) การแสดงผลสถิติการใช้น้ำและรายงานต่าง ๆ ภายในระบบ (3) การแจ้งเตือนและการบำรุงรักษาอุปกรณ์ และ (4) การวิเคราะห์เพื่อปรับปรุงประสิทธิภาพการใช้งาน",
  },
  {
    title: "3. การเปิดเผยข้อมูลแก่บุคคลที่สาม",
    body: `${HOSPITAL}จะไม่เปิดเผยข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอก ยกเว้นในกรณีที่ได้รับความยินยอมจากคุณ หรือกรณีที่กฎหมายกำหนด เช่น คำสั่งศาลหรือหน่วยงานที่มีอำนาจตามกฎหมาย`,
  },
  {
    title: "4. ระยะเวลาการเก็บรักษาข้อมูล",
    body: "ข้อมูลส่วนบุคคลจะถูกเก็บรักษาตลอดระยะเวลาที่คุณยังเป็นบุคลากรของโรงพยาบาล หรือจนกว่าจะมีการขอลบข้อมูล ข้อมูลการใช้น้ำและบันทึกระบบจะถูกเก็บตามนโยบายการเก็บข้อมูลของโรงพยาบาล",
  },
  {
    title: "5. ความปลอดภัยของข้อมูล",
    body: "ระบบใช้มาตรการรักษาความปลอดภัยมาตรฐาน ได้แก่ การเข้ารหัส JWT สำหรับการยืนยันตัวตน การเข้ารหัสรหัสผ่านด้วย bcrypt และการส่งข้อมูลผ่าน HTTPS อย่างไรก็ตามไม่มีระบบใดที่ปลอดภัย 100% จึงขอให้ผู้ใช้ช่วยรักษาความปลอดภัยบัญชีของตนด้วย",
  },
  {
    title: "6. สิทธิ์ของเจ้าของข้อมูล",
    body: "คุณมีสิทธิ์ขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณที่อยู่ในระบบได้ โดยติดต่อผู้ดูแลระบบ ทั้งนี้การลบข้อมูลบางส่วนอาจส่งผลต่อการเข้าถึงระบบของคุณ",
  },
  {
    title: "7. คุกกี้และ Local Storage",
    body: "ระบบใช้ localStorage ของเบราว์เซอร์เพื่อเก็บข้อมูลการเข้าสู่ระบบชั่วคราว เช่น Token และ Role ข้อมูลเหล่านี้จะถูกลบออกเมื่อคุณออกจากระบบ",
  },
  {
    title: "8. การเปลี่ยนแปลงนโยบาย",
    body: `${HOSPITAL}อาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การใช้งานระบบต่อเนื่องหลังมีการเปลี่ยนแปลงถือว่าคุณยอมรับนโยบายฉบับปัจจุบัน`,
  },
  {
    title: "9. การติดต่อ",
    body: `หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว หรือต้องการใช้สิทธิ์ในฐานะเจ้าของข้อมูล กรุณาติดต่อแผนกไอที${HOSPITAL}`,
  },
];

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12" style={{ backgroundColor: "#f4f4f5" }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-transparent border-0 cursor-pointer p-0 mb-6"
        >
          <ArrowLeft size={15} />
          ย้อนกลับ
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <img src={logo} alt="logo" className="w-14 h-14 object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">นโยบายความเป็นส่วนตัว</h1>
            <p className="text-sm text-gray-400 mt-0.5">{HOSPITAL} — ระบบตรวจสอบการใช้น้ำ</p>
            <p className="text-xs text-gray-400 mt-0.5">มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2568</p>
          </div>
        </div>

        {/* Intro */}
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {HOSPITAL}ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งาน นโยบายฉบับนี้อธิบายวิธีการเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณในระบบตรวจสอบมาตรวัดน้ำ
        </p>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-sm font-semibold text-gray-800 mb-1.5">{s.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            นโยบายนี้อยู่ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </p>
          <p className="text-xs text-center text-gray-400">
            ดูเพิ่มเติม:{" "}
            <button
              type="button"
              onClick={() => navigate("/terms")}
              className="text-gray-600 underline underline-offset-2 hover:text-gray-900 bg-transparent border-0 cursor-pointer p-0 text-xs"
            >
              เงื่อนไขการใช้งาน
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
