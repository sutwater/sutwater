import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/suth-noname.png";

const HOSPITAL = "โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี";

const sections = [
  {
    title: "1. การยอมรับเงื่อนไข",
    body: `การเข้าใช้งานระบบตรวจสอบมาตรวัดน้ำของ${HOSPITAL}ถือว่าคุณได้อ่าน ทำความเข้าใจ และยอมรับเงื่อนไขการใช้งานทั้งหมดที่ระบุไว้ในเอกสารฉบับนี้`,
  },
  {
    title: "2. วัตถุประสงค์ของระบบ",
    body: `ระบบนี้จัดทำขึ้นเพื่อติดตามและบันทึกข้อมูลการใช้น้ำภายใน${HOSPITAL} โดยใช้อุปกรณ์กล้อง IoT ในการอ่านค่ามาตรวัดน้ำอัตโนมัติ การใช้งานนอกเหนือจากวัตถุประสงค์ดังกล่าวถือว่าผิดเงื่อนไข`,
  },
  {
    title: "3. บัญชีผู้ใช้และความรับผิดชอบ",
    body: "ผู้ใช้แต่ละคนต้องรับผิดชอบต่อการกระทำทั้งหมดที่เกิดขึ้นภายใต้บัญชีของตน ห้ามเปิดเผยรหัสผ่านหรืออนุญาตให้ผู้อื่นใช้บัญชีของคุณ หากพบการใช้งานที่ไม่ได้รับอนุญาตให้แจ้งผู้ดูแลระบบทันที",
  },
  {
    title: "4. การเข้าถึงและสิทธิ์การใช้งาน",
    body: "สิทธิ์การเข้าถึงข้อมูลและฟีเจอร์ต่าง ๆ ขึ้นอยู่กับบทบาท (Role) ที่ผู้ดูแลระบบกำหนด การพยายามเข้าถึงข้อมูลหรือระบบเกินกว่าสิทธิ์ที่ได้รับถือว่าเป็นการละเมิดเงื่อนไขการใช้งาน",
  },
  {
    title: "5. ข้อมูลและความถูกต้อง",
    body: `ข้อมูลการใช้น้ำที่แสดงในระบบได้รับมาจากอุปกรณ์ IoT ซึ่งอาจมีความคลาดเคลื่อนได้ในบางกรณี ${HOSPITAL}ไม่รับผิดชอบต่อความเสียหายอันเกิดจากข้อมูลที่ไม่ถูกต้องซึ่งอยู่นอกเหนือการควบคุม`,
  },
  {
    title: "6. การระงับหรือยกเลิกบัญชี",
    body: `ผู้ดูแลระบบสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีผู้ใช้ที่ละเมิดเงื่อนไขการใช้งาน หรือในกรณีที่ผู้ใช้พ้นสภาพการเป็นบุคลากรของ${HOSPITAL}`,
  },
  {
    title: "7. การเปลี่ยนแปลงเงื่อนไข",
    body: `${HOSPITAL}ขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงเงื่อนไขการใช้งานได้โดยไม่ต้องแจ้งล่วงหน้า การใช้งานต่อเนื่องหลังจากมีการเปลี่ยนแปลงถือว่าคุณยอมรับเงื่อนไขใหม่`,
  },
  {
    title: "8. การติดต่อ",
    body: `หากมีข้อสงสัยเกี่ยวกับเงื่อนไขการใช้งาน กรุณาติดต่อแผนกไอที${HOSPITAL}`,
  },
];

function TermsPage() {
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
            <h1 className="text-xl font-bold text-gray-900">เงื่อนไขการใช้งาน</h1>
            <p className="text-sm text-gray-400 mt-0.5">{HOSPITAL} — ระบบตรวจสอบการใช้น้ำ</p>
            <p className="text-xs text-gray-400 mt-0.5">มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2568</p>
          </div>
        </div>

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
            เอกสารฉบับนี้มีผลผูกพันทางกฎหมาย หากไม่ยอมรับเงื่อนไขดังกล่าว กรุณางดการใช้งานระบบ
          </p>
          <p className="text-xs text-center text-gray-400">
            ดูเพิ่มเติม:{" "}
            <button
              type="button"
              onClick={() => navigate("/privacy")}
              className="text-gray-600 underline underline-offset-2 hover:text-gray-900 bg-transparent border-0 cursor-pointer p-0 text-xs"
            >
              นโยบายความเป็นส่วนตัว
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
