import React, { useEffect, useState } from "react";
import {
  Table,
  message,
  Input,
  Button,
  Modal,
  Form,
  Select,
  Space,
} from "antd";
import {
  GetUsers,
  DeleteUsersById,
  UpdateUsersById,
} from "../../services/https";
import "./AdminDashboard.css";
import { saveAs } from "file-saver";

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
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,ชื่อ,นามสกุล,Email,เพศ"]
        .concat(
          users.map(
            (u) =>
              `${u.ID},${u.first_name},${u.last_name},${u.email},${u.gender?.gender || "ไม่ระบุ"}`
          )
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "users.csv");
  };

  const genders = Array.from(
    new Set(users.map((u) => u.gender?.gender || "ไม่ระบุ"))
  );

  const handleGenderFilter = (gender: string) => {
    if (gender === "all") {
      setFiltered(users);
    } else {
      setFiltered(users.filter((u) => (u.gender?.gender || "ไม่ระบุ") === gender));
    }
  };

  const columns = [
    { title: "ID", dataIndex: "ID", key: "ID" },
    {
      title: "ชื่อ-นามสกุล",
      key: "name",
      render: (_: any, record: User) =>
        `${record.first_name || "-"} ${record.last_name || "-"}`,
    },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "เพศ",
      key: "gender",
      render: (_: any, record: User) => record.gender?.gender || "ไม่ระบุ",
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
    },
  ];

  return (
    <div className="admin-container">
      <h1 className="admin-title">จัดการสมาชิก</h1>
      <div className="admin-controls">
        <Search
          placeholder="ค้นหาชื่อหรืออีเมล"
          onSearch={onSearch}
          value={searchText}
          onChange={(e) => onSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <Select
          defaultValue="all"
          onChange={handleGenderFilter}
          style={{ width: 180 }}
        >
          <Option value="all">ทุกเพศ</Option>
          {genders.map((g) => (
            <Option key={g} value={g}>
              {g}
            </Option>
          ))}
        </Select>
        <Button onClick={handleExportCSV}>Export CSV</Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="ID"
        loading={loading}
        pagination={{ pageSize: 5 }}
        className="admin-table"
      />

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
    </div>
  );
};

export default AdminDashboard;
