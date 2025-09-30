import React, { useEffect, useState } from "react";
import {
  Table,
  message,
  Input,
  Button,
  Modal,
  Form,
  Space,
  Select,
} from "antd";
import * as XLSX from "xlsx";
import {
  GetUsers,
  DeleteUsersById,
  UpdateUsersById,
} from "../../services/https";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";

const { Search } = Input;
const { Option } = Select;

interface Gender {
  gender: string;
}

interface User {
  ID: number;
  first_name: string;
  last_name: string;
  email: string;
  gender: Gender | null;
  line_user_id: string | null;
  is_selected_for_line: boolean; // เพิ่มสถานะการเลือก
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [hasSelectedUsers, setHasSelectedUsers] = useState<boolean>(false); // เพิ่ม state สำหรับตรวจสอบว่ามีผู้ใช้งานที่เลือกหรือไม่
  const navigate = useNavigate();

  const BASE_URL = "https://hj211v7t-8000.asse.devtunnels.ms";

  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    const res = await GetUsers();
    if (res.status === 200) {
      setUsers(res.data);
      setFiltered(res.data);
    } else {
      message.error("โหลดข้อมูลไม่สำเร็จ");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ตรวจสอบว่ามีผู้ใช้งานที่เลือก "ส่ง" หรือไม่
  useEffect(() => {
    const hasSelected = users.some((user) => user.is_selected_for_line);
    setHasSelectedUsers(hasSelected);
  }, [users]);

  const onSearch = (value: string) => {
    const keyword = value.toLowerCase();
    const result = users.filter((u) =>
      `${u.first_name} ${u.last_name} ${u.email}`
        .toLowerCase()
        .includes(keyword)
    );
    setFiltered(result);
    setSearchText(value);
  };

  const handleDelete = async (id: number) => {
    const res = await DeleteUsersById(id.toString());
    if (res.status === 200) {
      message.success("ลบสมาชิกสำเร็จ");
      fetchUsers();
    } else {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const showEditModal = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const handleUpdate = async () => {
    const values = await form.validateFields();
    if (editingUser) {
      const updated = { ...editingUser, ...values };
      const res = await UpdateUsersById(editingUser.ID.toString(), updated);
      if (res.status === 200) {
        message.success("อัปเดตข้อมูลแล้ว");
        setIsModalVisible(false);
        fetchUsers();
      } else {
        message.error("อัปเดตไม่สำเร็จ");
      }
    }
  };

  const handleSendNotification = async () => {
    const selectedUsers = users
      .filter((user) => user.is_selected_for_line)
      .map((user) => user.ID);

    if (selectedUsers.length === 0) {
      message.warning("กรุณาเลือกผู้ใช้งานที่ต้องการส่งการแจ้งเตือน");
      return;
    }

    if (!notificationMessage.trim()) {
      message.warning("กรุณากรอกข้อความแจ้งเตือน");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/line/send-notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_ids: selectedUsers,
          message: notificationMessage,
        }),
      });

      if (res.ok) {
        message.success("ส่งการแจ้งเตือนสำเร็จ");
        setNotificationMessage("");
        setIsNotificationModalVisible(false);
      } else {
        message.error("ส่งการแจ้งเตือนไม่สำเร็จ");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการส่งการแจ้งเตือน");
    }
  };

  const updateUserStatus = async (userId: number, isSelected: boolean) => {
    try {
      const res = await fetch(`${BASE_URL}/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          is_selected_for_line: isSelected,
        }),
      });

      if (res.ok) {
        message.success("อัปเดตสถานะสำเร็จ");
        fetchUsers();
      } else {
        message.error("อัปเดตสถานะไม่สำเร็จ");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const handleSelectUser = (userId: number, value: string) => {
    const isSelected = value === "send";
    updateUserStatus(userId, isSelected);

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.ID === userId
          ? { ...user, is_selected_for_line: isSelected }
          : user
      )
    );
  };

  const columns = [
    {
      title: "ลำดับ",
      key: "index",
      render: (_: any, __: any, index: number) => index + 1, // แสดงลำดับ
      className: "column-index", // เพิ่ม className สำหรับจัดการ CSS
      width: 50,
    },
    {
      title: "ชื่อ-นามสกุล",
      key: "name",
      render: (_: any, record: User) =>
        `${record.first_name || "-"} ${record.last_name || "-"}`,
      className: "column-name", // เพิ่ม className สำหรับจัดการ CSS
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      className: "column-email", // เพิ่ม className สำหรับจัดการ CSS
      width: 200,
    },
    {
      title: "เพศ",
      key: "gender",
      render: (_: any, record: User) => record.gender?.gender || "ไม่ระบุ",
      className: "column-gender", // เพิ่ม className สำหรับจัดการ CSS
      width: 100,
    },
    {
      title: "ส่งการแจ้งเตือน",
      key: "notify",
      render: (_: any, record: User) =>
        record.line_user_id ? (
          <Select
            value={record.is_selected_for_line ? "send" : "no-send"}
            onChange={(value) => handleSelectUser(record.ID, value)}
            style={{ width: 100 }}
          >
            <Option value="send">ส่ง</Option>
            <Option value="no-send">ไม่ส่ง</Option>
          </Select>
        ) : (
          <span style={{ color: "gray" }}>ไม่สามารถส่งได้</span>
        ),
      className: "column-notify", // เพิ่ม className สำหรับจัดการ CSS
      width: 100,
    },
    {
      title: "จัดการ",
      key: "actions",
      render: (_: any, record: User) => (
        <Space>
          <Button onClick={() => showEditModal(record)}>แก้ไข</Button>
          <Button danger onClick={() => handleDelete(record.ID)}>
            ลบ
          </Button>
        </Space>
      ),
      className: "column-actions", // เพิ่ม className สำหรับจัดการ CSS
      width: 150,
    },
  ];

  // ฟังก์ชัน Export ข้อมูลผู้ใช้งานเป็น Excel
  const handleExportUsers = () => {
    if (filtered.length === 0) {
      message.warning("ไม่มีข้อมูลผู้ใช้งานให้ export");
      return;
    }
    // เตรียมข้อมูลสำหรับ export
    const exportData = filtered.map((u, idx) => ({
      "ลำดับ": idx + 1,
      "ชื่อ": u.first_name,
      "นามสกุล": u.last_name,
      "Email": u.email,
      "เพศ": u.gender?.gender || "ไม่ระบุ",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "users_export.xlsx");
    message.success("Export ข้อมูลผู้ใช้งานสำเร็จ!");
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">จัดการสมาชิก</h1>
      <div className="admin-controls" style={{ display: "flex", gap: 8 }}>
        <Search
          placeholder="ค้นหาชื่อหรืออีเมล"
          onSearch={onSearch}
          value={searchText}
          onChange={(e) => onSearch(e.target.value)}
          style={{ width: 240, marginBottom: 16 }}
        />
        <Button
          onClick={handleExportUsers}
          type="default"
          style={{ marginBottom: 16 }}
        >
          Export
        </Button>
        <Button
          onClick={() => setIsNotificationModalVisible(true)}
          type="primary"
          disabled={!hasSelectedUsers}
          style={{ marginBottom: 16 }}
        >
          ส่งการแจ้งเตือน
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="ID"
        loading={loading}
        pagination={{ pageSize: 8 }}
        className="admin-table"
      />

      <div className="back-button-container">
        <Button type="default" onClick={() => navigate("/")}>
          ย้อนกลับ
        </Button>
      </div>

      <Modal
        title="แก้ไขสมาชิก"
        open={isModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsModalVisible(false)}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="ชื่อ" name="first_name">
            <Input />
          </Form.Item>
          <Form.Item label="นามสกุล" name="last_name">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="ส่งการแจ้งเตือน"
        open={isNotificationModalVisible}
        onOk={handleSendNotification}
        onCancel={() => {
          setIsNotificationModalVisible(false);
          setNotificationMessage("");
        }}
        okText="ส่ง"
        cancelText="ยกเลิก"
      >
        <Input.TextArea
          rows={4}
          placeholder="กรอกข้อความแจ้งเตือน"
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
