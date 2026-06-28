import { message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosResponse } from "axios";
import type { AuthLoginResponse } from "../../../interfaces/IAuth";
import { LogIn } from "../../../services/https/sign";
import logo from "../../../assets/suth-noname.png";
import { Eye, EyeOff } from "lucide-react";


const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
  </svg>
);

const INPUT_CLASS =
  "w-full h-10 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20";

function LogInPages() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email) next.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) next.password = "กรุณากรอกรหัสผ่าน";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const lowerEmail = email.toLowerCase();
    const res = await LogIn({ email: lowerEmail, password }) as AxiosResponse<AuthLoginResponse> | undefined;

    if (res && res.status === 200) {
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("token_type", "Bearer");
      localStorage.setItem("id", String(user.id));
      localStorage.setItem("email", lowerEmail);
      localStorage.setItem("role_id", String(user.role_id ?? 4));
      localStorage.setItem("first_name", String(user.first_name ?? "no"));
      localStorage.setItem("last_name", String(user.last_name ?? "name"));
      localStorage.setItem("isLogin", "true");
      messageApi.success("เข้าสู่ระบบสำเร็จ");
      setTimeout(() => { window.location.href = "/"; }, 1000);
    } else {
      setLoading(false);
      messageApi.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  return (
    <>
      {contextHolder}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ backgroundColor: "#f4f4f5" }}>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8">

          {/* Heading */}
          <div className="text-center mb-6">
            <img src={logo} alt="logo" className="w-20 h-20 object-contain mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">ยินดีต้อนรับ</h1>
            <p className="text-sm text-gray-400 mt-1">เข้าสู่ระบบด้วยบัญชี Google หรืออีเมล</p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={() => messageApi.info("ฟีเจอร์นี้ยังไม่เปิดใช้งาน")}
            className="w-full flex items-center justify-center gap-2.5 h-10 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-3 cursor-pointer"
          >
            <GoogleIcon />
            เข้าสู่ระบบด้วย Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">หรือดำเนินการต่อด้วย</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
              <input
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                className={INPUT_CLASS}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline bg-transparent border-0 cursor-pointer p-0"
                  onClick={() => navigate("/forgot-password")}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`${INPUT_CLASS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-4"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            ยังไม่มีบัญชี?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0"
            >
              สมัครสมาชิก
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400 max-w-xs leading-relaxed">
          การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
          <button type="button" onClick={() => navigate("/terms")} className="underline underline-offset-2 cursor-pointer bg-transparent border-0 text-gray-400 text-xs p-0 hover:text-gray-600">เงื่อนไขการใช้งาน</button>
          {" "}และ{" "}
          <button type="button" onClick={() => navigate("/privacy")} className="underline underline-offset-2 cursor-pointer bg-transparent border-0 text-gray-400 text-xs p-0 hover:text-gray-600">นโยบายความเป็นส่วนตัว</button>
        </p>

      </div>
    </>
  );
}

export default LogInPages;
