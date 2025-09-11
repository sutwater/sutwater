import React, { useEffect, useState } from "react";
import { Descriptions, Card, Spin, Typography, Avatar, Button, message } from "antd";
import { UserOutlined, QrcodeOutlined } from "@ant-design/icons";
import { UsersInterface } from "../../interfaces/IUser";
import { GetUsersById } from "../../services/https";
import "./ProfilePage.css";

const { Title } = Typography;

function ProfilePage() {
  const [user, setUser] = useState<UsersInterface>();
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    const userId = localStorage.getItem("id");
    if (!userId) {
      message.error("ไม่พบข้อมูลผู้ใช้งานในระบบ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      const res = await GetUsersById(userId);
      if (res.status === 200) {
        const u = res.data;
        const mappedUser: UsersInterface = {
          ID: u.ID,
          FirstName: u.first_name,
          LastName: u.last_name,
          Email: u.email,
          Age: u.age,
          BirthDay: u.birthday,
          GenderID: u.gender_id,
          Gender: u.gender,
          LineUserID: u.line_user_id,
        };
        setUser(mappedUser);
      } else {
        message.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithLine = () => {
    const liffId = import.meta.env.VITE_LIFF_ID;

    if (!liffId) {
      alert("LIFF ID ไม่ได้ถูกตั้งค่า กรุณาติดต่อผู้ดูแลระบบ");
      return;
    }

    const liffUrl = `https://liff.line.me/${liffId}`;
    window.location.href = liffUrl; // เปลี่ยน URL ของหน้าเว็บปัจจุบันไปยัง LIFF URL
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="profile-container">
      <Card className="profile-card">
        {loading ? (
          <div className="loading-wrapper">
            <Spin size="large" />
          </div>
        ) : user ? (
          <>
            <div className="profile-header">
              <Avatar
                size={80}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#4a90e2", marginBottom: 16 }}
              />
              <Title level={3}>ข้อมูลส่วนตัว</Title>
            </div>
            <Descriptions
              bordered
              column={1}
              labelStyle={{ fontWeight: 600, width: 150 }}
            >
              <Descriptions.Item label="ชื่อ">{user.FirstName}</Descriptions.Item>
              <Descriptions.Item label="นามสกุล">{user.LastName}</Descriptions.Item>
              <Descriptions.Item label="อีเมล">{user.Email}</Descriptions.Item>
              <Descriptions.Item label="อายุ">{user.Age}</Descriptions.Item>
              <Descriptions.Item label="วันเกิด">
                {user.BirthDay
                  ? new Date(user.BirthDay).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="เพศ">
                {user.Gender?.gender || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Line User ID">
                {user.LineUserID ? (
                  user.LineUserID // แสดง Line User ID หากไม่เป็น NULL
                ) : (
                  <Button
                    type="primary"
                    icon={<QrcodeOutlined />}
                    onClick={handleLoginWithLine}
                  >
                    เชื่อม LINE
                  </Button>
                )}
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <p className="no-data">ไม่พบข้อมูลผู้ใช้งาน</p>
        )}
      </Card>
    </div>
  );
}

export default ProfilePage;