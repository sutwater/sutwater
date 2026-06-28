import { message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Register } from "../../../services/https/sign";
import logo from "../../../assets/suth-noname.png";
import { Eye, EyeOff } from "lucide-react";

const INPUT_CLASS =
  "w-full h-10 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20";

function PasswordInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASS} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function RegisterPages() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    full_name?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
  }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.full_name = "กรุณากรอกชื่อ-นามสกุล";
    if (!email) next.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) next.password = "กรุณากรอกรหัสผ่าน";
    else if (password.length < 8) next.password = "ต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
    if (!confirmPassword) next.confirm_password = "กรุณายืนยันรหัสผ่าน";
    else if (confirmPassword !== password) next.confirm_password = "รหัสผ่านไม่ตรงกัน";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const parts = fullName.trim().split(/\s+/);
    const first_name = parts[0] ?? "";
    const last_name = parts.slice(1).join(" ") || "-";

    const res = await Register({
      first_name,
      last_name,
      Email: email.toLowerCase(),
      Password: password,
    }) as { status?: number; data?: { error?: { message?: string } | string } } | undefined;

    if (res && res.status === 201) {
      messageApi.success("สร้างบัญชีสำเร็จ กรุณาเข้าสู่ระบบ");
      setTimeout(() => navigate("/signin"), 1500);
    } else {
      setLoading(false);
      const errData = res?.data;
      const errMsg = typeof errData?.error === "string"
        ? errData.error
        : errData?.error?.message;
      messageApi.error(errMsg ?? "สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  return (
    <>
      {contextHolder}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ backgroundColor: "#f4f4f5" }}
      >
        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8">
          {/* Heading */}
          <div className="text-center mb-6">
            <button onClick={() => navigate("/")} className="border-0 bg-transparent cursor-pointer p-0 mx-auto block">
              <img src={logo} alt="logo" className="w-20 h-20 object-contain hover:opacity-80 transition-opacity" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">สร้างบัญชีของคุณ</h1>
            <p className="text-sm text-gray-400 mt-1">กรอกอีเมลของคุณด้านล่างเพื่อสร้างบัญชี</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} noValidate>
            {/* Full name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
              <input
                type="text"
                placeholder="ชื่อ นามสกุล"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, full_name: undefined })); }}
                className={INPUT_CLASS}
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
            </div>

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

            {/* Password row */}
            <div className="grid grid-cols-2 gap-3 mb-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
                <PasswordInput
                  placeholder="********"
                  value={password}
                  onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })); }}
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ยืนยันรหัสผ่าน</label>
                <PasswordInput
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(v) => { setConfirmPassword(v); setErrors((p) => ({ ...p, confirm_password: undefined })); }}
                />
                {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>}
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-5">ต้องมีความยาวอย่างน้อย 8 ตัวอักษร</p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-4"
            >
              {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            มีบัญชีอยู่แล้ว?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400 max-w-xs leading-relaxed">
          การสมัครสมาชิกถือว่าคุณยอมรับ{" "}
          <button type="button" onClick={() => navigate("/terms")} className="underline underline-offset-2 cursor-pointer bg-transparent border-0 text-gray-400 text-xs p-0 hover:text-gray-600">เงื่อนไขการใช้งาน</button>
          {" "}และ{" "}
          <button type="button" onClick={() => navigate("/privacy")} className="underline underline-offset-2 cursor-pointer bg-transparent border-0 text-gray-400 text-xs p-0 hover:text-gray-600">นโยบายความเป็นส่วนตัว</button>
        </p>
      </div>
    </>
  );
}

export default RegisterPages;
