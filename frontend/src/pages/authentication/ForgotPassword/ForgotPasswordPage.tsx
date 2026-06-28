import { message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ForgotPasswordAPI } from "../../../services/https/sign";
import logo from "../../../assets/suth-noname.png";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import type { AxiosResponse } from "axios";

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

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    old_password?: string;
    new_password?: string;
    confirm_new?: string;
  }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email) next.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!oldPassword) next.old_password = "กรุณากรอกรหัสผ่านเดิม";
    if (!newPassword) next.new_password = "กรุณากรอกรหัสผ่านใหม่";
    else if (newPassword.length < 8) next.new_password = "ต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
    else if (newPassword === oldPassword) next.new_password = "รหัสผ่านใหม่ต้องไม่เหมือนรหัสเดิม";
    if (!confirmNew) next.confirm_new = "กรุณายืนยันรหัสผ่านใหม่";
    else if (confirmNew !== newPassword) next.confirm_new = "รหัสผ่านไม่ตรงกัน";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const res = await ForgotPasswordAPI({
      email: email.toLowerCase(),
      old_password: oldPassword,
      new_password: newPassword,
    }) as AxiosResponse<{ error?: { message?: string } }> | undefined;

    if (res && res.status === 200) {
      messageApi.success("เปลี่ยนรหัสผ่านสำเร็จ");
      setTimeout(() => navigate("/login"), 1200);
    } else {
      setLoading(false);
      const errMsg = res?.data?.error?.message;
      if (errMsg?.includes("incorrect")) {
        messageApi.error("รหัสผ่านเดิมไม่ถูกต้อง");
      } else if (errMsg?.includes("not found")) {
        messageApi.error("ไม่พบอีเมลนี้ในระบบ");
      } else {
        messageApi.error(errMsg ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่");
      }
    }
  };

  return (
    <>
      {contextHolder}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ backgroundColor: "#f4f4f5" }}
      >
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-transparent border-0 cursor-pointer p-0 mb-5"
          >
            <ArrowLeft size={15} />
            ย้อนกลับ
          </button>

          {/* Heading */}
          <div className="text-center mb-6">
            <img src={logo} alt="logo" className="w-16 h-16 object-contain mx-auto" />
            <h1 className="text-xl font-bold text-gray-900 mt-2">ลืมรหัสผ่าน</h1>
            <p className="text-sm text-gray-400 mt-1">ยืนยันตัวตนด้วยอีเมลและรหัสผ่านเดิม</p>
          </div>

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

            {/* Old password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่านเดิม</label>
              <PasswordInput
                placeholder="รหัสผ่านเดิม"
                value={oldPassword}
                onChange={(v) => { setOldPassword(v); setErrors((p) => ({ ...p, old_password: undefined })); }}
              />
              {errors.old_password && <p className="mt-1 text-xs text-red-500">{errors.old_password}</p>}
            </div>

            <div className="h-px bg-gray-100 my-4" />

            {/* New password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่านใหม่</label>
              <PasswordInput
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                value={newPassword}
                onChange={(v) => { setNewPassword(v); setErrors((p) => ({ ...p, new_password: undefined })); }}
              />
              {errors.new_password && <p className="mt-1 text-xs text-red-500">{errors.new_password}</p>}
            </div>

            {/* Confirm new password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
              <PasswordInput
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmNew}
                onChange={(v) => { setConfirmNew(v); setErrors((p) => ({ ...p, confirm_new: undefined })); }}
              />
              {errors.confirm_new && <p className="mt-1 text-xs text-red-500">{errors.confirm_new}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 max-w-xs leading-relaxed">
          กรุณาเช็คภาษาเครื่องของคุณก่อนทำการกดยืนยัน
        </p>
      </div>
    </>
  );
}

export default ForgotPasswordPage;
