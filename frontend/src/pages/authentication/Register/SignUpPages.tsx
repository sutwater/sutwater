import {
  Button,
  Card,
  Form,
  Input,
  message,
  Flex,
  Row,
  Col,
  DatePicker,
  Select,
  InputNumber,
} from "antd";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateUser, GetGender } from "../../../services/https";
import { UsersInterface } from "../../../interfaces/IUser";
import { GenderInterface } from "../../../interfaces/Gender";
import logo from "../../../assets/logo.png";
import dayjs from "dayjs";

import "./SignUpPages.css";

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
      messageApi.open({
        type: "success",
        content: res.data.message,
      });

      setTimeout(function () {
        navigate("/");
      }, 2000);
    } else {
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };

  useEffect(() => {
    fetchGenders();
  }, []);

  return (
    <>
      {contextHolder}

      <Flex justify="center" align="center" className="signup-container">
        <Card className="signup-card">
          <Row align="middle" justify="center">
            <Col xs={24} sm={24} md={24} lg={8} xl={6} style={{ textAlign: "center" }}>
              <img alt="logo" src={logo} className="signup-logo" />
            </Col>

            <Col xs={24}>
              <h2 className="signup-header">Sign Up</h2>

              <Form
                name="signup-form"
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Row gutter={[16, 0]} align="middle">
                  <Col xs={24}>
                    <Form.Item
                      label="ชื่อจริง"
                      name="first_name"
                      rules={[{ required: true, message: "กรุณากรอกชื่อ!" }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label="นามสกุล"
                      name="last_name"
                      rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label="อีเมล"
                      name="Email"
                      rules={[
                        { required: true, message: "กรุณากรอกอีเมล!" },
                        { type: "email", message: "อีเมลไม่ถูกต้อง!" },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="รหัสผ่าน"
                      name="Password"
                      rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน!" }]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item label="อายุ">
                      <InputNumber
                        value={calculatedAge ?? 0}
                        disabled
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="วันเกิด"
                      name="BirthDay"
                      rules={[{ required: true, message: "กรุณาเลือกวันเกิด!" }]}
                    >
                      <DatePicker
                        style={{ width: "100%" }}
                        onChange={handleBirthDayChange}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="เพศ"
                      name="gender_id"
                      rules={[{ required: true, message: "กรุณาเลือกเพศ!" }]}
                    >
                      <Select placeholder="เลือกเพศ">
                        {genderList.map((g) => (
                          <Select.Option key={g.ID} value={g.ID}>
                            {g.gender}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="signup-button"
                      >
                        Sign up
                      </Button>
                      <p style={{ marginTop: "10px" }}>
                        Or <a onClick={() => navigate("/login")}>Sign in</a>
                      </p>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Card>
      </Flex>
    </>
  );
}

export default SignUpPages;
