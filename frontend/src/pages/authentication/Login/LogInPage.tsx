import { Button, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { SignIn, AuthLoginResponse } from "../../../services/https/sign";
import { SignInInterface } from "../../../interfaces/SignIn";
import logo from "../../../assets/suth-noname.png";
import type { AxiosResponse } from "axios";

const ROLE_ROUTES: Record<number, string> = {
  1: "/role/admin",
  2: "/role/engineer",
  3: "/role/technician",
  4: "/role/user",
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
  </svg>
);

function SignInPages() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: SignInInterface) => {
    setLoading(true);
    const lowerEmail = values.email.toLowerCase();
    const res = await SignIn({ ...values, email: lowerEmail }) as AxiosResponse<AuthLoginResponse>;

    if (res && res.status === 200) {
      const { token, user } = res.data.data;
      const roleId = user.role_id || 4;
      localStorage.setItem("token", token);
      localStorage.setItem("token_type", "Bearer");
      localStorage.setItem("id", String(user.id));
      localStorage.setItem("email", lowerEmail);
      localStorage.setItem("role_id", String(roleId));
      localStorage.setItem("isLogin", "true");
      messageApi.success("เข้าสู่ระบบสำเร็จ");
      setTimeout(() => { location.href = ROLE_ROUTES[roleId] ?? "/"; }, 1000);
    } else {
      setLoading(false);
      const errData = (res as AxiosResponse<{ error?: { message?: string } }> | undefined)?.data;
      messageApi.error(errData?.error?.message ?? "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
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

        {/* Logo + hospital name */}

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
          <Form name="signin" onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item
              name="email"
              label={<span className="text-sm font-medium text-gray-700">อีเมล</span>}
              className="mb-4"
              rules={[
                { required: true, message: "กรุณากรอกอีเมล" },
                { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
              ]}
            >
              <Input
                placeholder="m@example.com"
                size="large"
                className="!rounded-lg !text-sm"
              />
            </Form.Item>

            <div className="relative">
              <button
                type="button"
                className="absolute top-0 right-0 text-sm text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline bg-transparent border-0 cursor-pointer p-0"
                onClick={() => messageApi.info("ฟีเจอร์นี้ยังไม่เปิดใช้งาน")}
              >
                ลืมรหัสผ่าน?
              </button>
              <Form.Item
                name="password"
                className="mb-5"
                label={<span className="text-sm font-medium text-gray-700">รหัสผ่าน</span>}
                rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
              >
                <Input.Password placeholder="********" size="large" className="!rounded-lg !text-sm" />
              </Form.Item>
            </div>

            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="w-full !rounded-lg !h-10 !text-sm font-semibold !bg-gray-900 hover:!bg-gray-700 !border-0"
              >
                เข้าสู่ระบบ
              </Button>
            </Form.Item>
          </Form>

          <p className="text-center text-sm text-gray-500">
            ยังไม่มีบัญชี?{" "}
            <button
              type="button"
              onClick={() => messageApi.info("ติดต่อผู้ดูแลระบบเพื่อสมัครสมาชิก")}
              className="text-gray-900 font-medium underline underline-offset-2 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0"
            >
              สมัครสมาชิก
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400 max-w-xs leading-relaxed">
          การเข้าสู่ระบบถือว่าคุณยอมรับ{" "}
          <span className="underline underline-offset-2 cursor-pointer">เงื่อนไขการใช้งาน</span>
          {" "}และ{" "}
          <span className="underline underline-offset-2 cursor-pointer">นโยบายความเป็นส่วนตัว</span>
        </p>

      </div>
    </>
  );
}

export default SignInPages;
