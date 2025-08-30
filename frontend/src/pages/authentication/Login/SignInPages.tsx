import { Button, Card, Form, Input, message, Flex, Row, Col } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn } from "../../../services/https";
import { SignInInterface } from "../../../interfaces/SignIn";
import logo from "../../../assets/suth.png";
import "./SignInPages.css";

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
    // ✅ ปิด scroll ตอนแสดงหน้า Login
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <>
      {contextHolder}

      <Flex justify="center" align="center" className="login-container">
        <Card className="login-card">
          <Row align="middle" justify="center">
            <Col span={24}>
              <img alt="logo" src={logo} className="login-logo" />
            </Col>

            <Col span={24}>
              <Form
                name="basic"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: "Please input your email!" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: "Please input your password!" }]}
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" className="login-button">
                    Log in
                  </Button>
                  <p style={{ marginTop: "10px" }}>
                    Or <a onClick={() => navigate("/signup")}>signup now!</a>
                  </p>
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </Card>
      </Flex>
    </>
  );
}

export default SignInPages;
