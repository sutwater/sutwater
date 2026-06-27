import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import {
  Droplets,
  MapPin,
  Activity,
  Camera,
  BarChart3,
  Bell,
  ChevronRight,
} from "lucide-react";
import logo from "../../assets/suth-noname.png";
import meterImg from "../../assets/meter.jpg";

const ROLE_ROUTES: Record<string, string> = {
  "1": "/role/admin",
  "2": "/role/engineer",
  "3": "/role/technician",
  "4": "/role/user",
};

const features = [
  {
    icon: <Camera size={28} className="text-blue-500" />,
    title: "อ่านค่าอัตโนมัติ",
    desc: "กล้อง IoT อ่านค่ามิเตอร์น้ำแบบ real-time และส่งข้อมูลเข้าระบบโดยอัตโนมัติ",
  },
  {
    icon: <MapPin size={28} className="text-green-500" />,
    title: "แผนที่มิเตอร์",
    desc: "ดูตำแหน่งมิเตอร์ทุกจุดทั่วโรงพยาบาลบนแผนที่แบบ interactive",
  },
  {
    icon: <BarChart3 size={28} className="text-purple-500" />,
    title: "วิเคราะห์การใช้น้ำ",
    desc: "กราฟและสถิติการใช้น้ำรายวัน รายเดือน พร้อมตรวจจับความผิดปกติ",
  },
  {
    icon: <Bell size={28} className="text-orange-500" />,
    title: "แจ้งเตือนทันที",
    desc: "รับการแจ้งเตือนเมื่อค่าการใช้น้ำผิดปกติหรืออุปกรณ์ขัดข้อง",
  },
  {
    icon: <Activity size={28} className="text-red-500" />,
    title: "ติดตามสถานะ",
    desc: "ตรวจสอบสถานะอุปกรณ์และบันทึกการซ่อมบำรุงได้ครบในที่เดียว",
  },
  {
    icon: <Droplets size={28} className="text-cyan-500" />,
    title: "รายงานการใช้น้ำ",
    desc: "สรุปรายงานการใช้น้ำแต่ละจุดเพื่อวางแผนควบคุมต้นทุน",
  },
];

const steps = [
  { num: "01", title: "กล้องอ่านมิเตอร์", desc: "กล้อง IoT ถ่ายภาพและประมวลผลค่ามิเตอร์น้ำทุกจุด" },
  { num: "02", title: "ส่งข้อมูลเข้าระบบ", desc: "ข้อมูลถูกส่งเข้าเซิร์ฟเวอร์แบบ real-time พร้อม timestamp" },
  { num: "03", title: "วิเคราะห์และแจ้งเตือน", desc: "ระบบวิเคราะห์แนวโน้มและแจ้งเตือนเมื่อค่าผิดปกติ" },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLogin") === "true";
  const roleId = localStorage.getItem("role_id") ?? "";

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate(ROLE_ROUTES[roleId] ?? "/");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-6">
              <img src={logo} alt="logo" className="w-14 h-14 object-contain bg-white rounded-full p-1" />
              <span className="text-sm font-medium tracking-widest uppercase opacity-80">
                โรงพยาบาลสุทธาทิพย์
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              ระบบตรวจสอบ<br />
              <span className="text-cyan-200">การใช้น้ำ</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-lg leading-relaxed">
              บริหารและติดตามการใช้น้ำทั่วโรงพยาบาลด้วย IoT อัจฉริยะ
              ลดต้นทุน ตรวจจับความผิดปกติ และวิเคราะห์ข้อมูลแบบ real-time
            </p>
            <div className="flex gap-3 justify-center md:justify-start flex-wrap">
              <Button
                type="primary"
                size="large"
                onClick={handleCTA}
                className="!bg-white !text-blue-700 !border-white hover:!bg-blue-50 font-semibold"
                icon={<ChevronRight size={16} />}
                iconPosition="end"
              >
                {isLoggedIn ? "ไปยังแดชบอร์ด" : "เข้าสู่ระบบ"}
              </Button>
              <Button
                size="large"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="!bg-transparent !text-white !border-white hover:!bg-white/10"
              >
                ดูฟีเจอร์
              </Button>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm">
              <img
                src={meterImg}
                alt="water meter"
                className="rounded-2xl shadow-2xl object-cover w-full h-64 md:h-80"
              />
              <div className="absolute -bottom-4 -left-4 bg-white text-gray-800 rounded-xl shadow-lg px-4 py-3 flex items-center gap-2">
                <Activity size={18} className="text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">สถานะระบบ</p>
                  <p className="text-sm font-semibold">ออนไลน์ทุกจุด</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-xl shadow-lg px-4 py-3 flex items-center gap-2">
                <Droplets size={18} className="text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">ติดตามอัตโนมัติ</p>
                  <p className="text-sm font-semibold">24 / 7</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 -mt-2 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "24/7", label: "ติดตามตลอดเวลา" },
            { value: "IoT", label: "กล้องอัจฉริยะ" },
            { value: "Real-time", label: "ข้อมูลสดทันที" },
            { value: "AI", label: "ประมวลผลอัตโนมัติ" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 text-center">
              <p className="text-2xl font-bold text-blue-600">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">ฟีเจอร์หลักของระบบ</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              ครอบคลุมทุกความต้องการในการบริหารการใช้น้ำของโรงพยาบาล
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">ระบบทำงานอย่างไร</h2>
          <p className="text-gray-500">กระบวนการตรวจสอบการใช้น้ำอัตโนมัติ 3 ขั้นตอน</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-blue-200 z-0" />
              )}
              <div className="relative z-10 w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                {s.num}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">พร้อมเริ่มใช้งานแล้วหรือยัง?</h2>
          <p className="text-blue-100 mb-8">
            เข้าสู่ระบบเพื่อดูข้อมูลการใช้น้ำแบบ real-time และรายงานสรุป
          </p>
          <Button
            type="primary"
            size="large"
            onClick={handleCTA}
            className="!bg-white !text-blue-700 !border-white hover:!bg-blue-50 font-semibold !h-12 !px-8"
          >
            {isLoggedIn ? "ไปยังแดชบอร์ด" : "เข้าสู่ระบบ"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="logo" className="w-8 h-8 object-contain bg-white rounded-full p-0.5" />
            <div>
              <p className="text-white text-sm font-medium">โรงพยาบาลสุทธาทิพย์</p>
              <p className="text-xs">ระบบตรวจสอบการใช้น้ำ</p>
            </div>
          </div>
          <p className="text-xs text-center">
            © 2025 โรงพยาบาลสุทธาทิพย์ · Water Monitoring System · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
