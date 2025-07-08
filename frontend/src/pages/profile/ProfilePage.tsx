import React, { useEffect, useState } from "react";
import { Descriptions, Card, Spin, Typography, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { UsersInterface } from "../../interfaces/IUser";
import { GetUsersById } from "../../services/https";
import "./ProfilePage.css";

const { Title } = Typography;

function ProfilePage() {
  const [user, setUser] = useState<UsersInterface>();
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    const userId = localStorage.getItem("id");
    if (!userId) return;

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
      };

      setUser(mappedUser);
    }

    setLoading(false);
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
