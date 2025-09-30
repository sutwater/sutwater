import { Button, Form, Input, message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn } from "../../../services/https";
import { SignInInterface } from "../../../interfaces/SignIn";
import logo from "../../../assets/suth.png";

function SignInPages() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: SignInInterface) => {
    const lowerEmail = values.email.toLowerCase();

    let res = await SignIn({
      ...values,
      email: lowerEmail,
    });

    if (res.status == 200) {
      messageApi.success("Sign-in successful");

      localStorage.setItem("isLogin", "true");
      localStorage.setItem("page", "dashboard");
      localStorage.setItem("token_type", res.data.token_type);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("id", res.data.id);
      localStorage.setItem("email", lowerEmail);

      if (lowerEmail === "suthadmin@gmail.com") {
        localStorage.setItem("isAdmin", "true");
      } else {
        localStorage.setItem("isAdmin", "false");
      }

      setTimeout(() => {
        location.href = "/";
      }, 2000);
    } else {
      messageApi.error(res.data.error);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <>
      {contextHolder}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <img alt="logo" src={logo} className="w-24 h-24 object-contain mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">ยินดีต้อนรับเข้าสู่ระบบ</h1>
            <p className="text-gray-500 mt-1 text-center text-sm">
              กรุณาเข้าสู่ระบบเพื่อใช้งานระบบตรวจสอบการใช้น้ำ
            </p>
          </div>

          <Form
            name="basic"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label={<span className="font-medium text-gray-700">อีเมล</span>}
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}
            >
              <Input className="rounded-lg py-2" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium text-gray-700">รหัสผ่าน</span>}
              name="password"
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password className="rounded-lg py-2" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                เข้าสู่ระบบ
              </Button>
              <p className="text-center text-gray-600 mt-4">
                หรือ{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-blue-600 font-medium hover:underline"
                >
                  สมัครตอนนี้!
                </button>
              </p>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
}

export default SignInPages;