import {
  Button,
  Form,
  Input,
  message,
  DatePicker,
  Select,
  InputNumber,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateUser, GetGender } from "../../../services/https";
import { UsersInterface } from "../../../interfaces/IUser";
import { GenderInterface } from "../../../interfaces/Gender";
import logo from "../../../assets/suth.png";
import dayjs from "dayjs";

function SignUpPages() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [genderList, setGenderList] = useState<GenderInterface[]>([]);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);

  const fetchGenders = async () => {
    const res = await GetGender();
    if (res.status === 200) {
      setGenderList(res.data);
    } else {
      messageApi.error("โหลดข้อมูลเพศล้มเหลว");
    }
  };

  const handleBirthDayChange = (date: any) => {
    if (date) {
      const age = dayjs().diff(dayjs(date), "year");
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  };

  const onFinish = async (values: UsersInterface) => {
    const birthDate = dayjs(values.BirthDay);
    const today = dayjs();
    const age = today.diff(birthDate, "year");

    const payload = {
      ...values,
      Age: age,
    };

    let res = await CreateUser(payload);

    if (res.status == 201) {
      messageApi.success(res.data.message);
      setTimeout(() => navigate("/"), 2000);
    } else {
      messageApi.error(res.data.error);
    }
  };

  useEffect(() => {
    fetchGenders();
  }, []);

  return (
    <>
      {contextHolder}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
          {/* Logo + Welcome text */}
          <div className="flex flex-col items-center mb-6">
            <img
              alt="logo"
              src={logo}
              className="w-24 h-24 object-contain mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800">สร้างบัญชีใหม่</h1>
            <p className="text-gray-500 mt-1 text-center text-sm">
              กรอกข้อมูลด้านล่างเพื่อสมัครสมาชิกเข้าสู่ระบบ
            </p>
          </div>

          <Form
            name="signup-form"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                label={
                  <span className="font-medium text-gray-700">ชื่อจริง</span>
                }
                name="first_name"
                rules={[{ required: true, message: "กรุณากรอกชื่อ!" }]}
              >
                <Input className="rounded-lg py-2" />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-medium text-gray-700">นามสกุล</span>
                }
                name="last_name"
                rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}
              >
                <Input className="rounded-lg py-2" />
              </Form.Item>
            </div>

            <Form.Item
              label={<span className="font-medium text-gray-700">อีเมล</span>}
              name="Email"
              rules={[
                { required: true, message: "กรุณากรอกอีเมล!" },
                { type: "email", message: "อีเมลไม่ถูกต้อง!" },
              ]}
            >
              <Input className="rounded-lg py-2" />
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                label={
                  <span className="font-medium text-gray-700">รหัสผ่าน</span>
                }
                name="Password"
                rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน!" }]}
              >
                <Input.Password className="rounded-lg py-2" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                label={
                  <span className="font-medium text-gray-700">วันเกิด</span>
                }
                name="BirthDay"
                rules={[{ required: true, message: "กรุณาเลือกวันเกิด!" }]}
              >
                <DatePicker
                  className="w-full rounded-lg"
                  onChange={handleBirthDayChange}
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-gray-700">เพศ</span>}
                name="gender_id"
                rules={[{ required: true, message: "กรุณาเลือกเพศ!" }]}
              >
                <Select placeholder="เลือกเพศ" className="rounded-lg">
                  {genderList.map((g) => (
                    <Select.Option key={g.ID} value={g.ID}>
                      {g.gender}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-11 rounded-lg bg-pink-600 hover:bg-pink-700 transition-colors"
              >
                สมัครสมาชิก
              </Button>
              <p className="text-center text-gray-600 mt-4">
                หรือ{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-blue-600 font-medium hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
}

export default SignUpPages;
