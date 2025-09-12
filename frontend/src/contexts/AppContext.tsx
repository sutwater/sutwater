import React, { createContext, useContext, useEffect, useState } from "react";
import { message } from "antd";
import { UsersInterface } from "../interfaces/IUser";
import {
  GetUsersById,
  GetMerters,
  GetAllWaterDaily,
  GetAllNotifications,
  GetAllWaterUsageLogs,
} from "../services/https";
import {
  MeterLocationInterface,
  WaterMeterValueInterface,
  NotificationInterface,
  CameraDeviceInterface,
} from "../interfaces/InterfaceAll";

type AppContextType = {
  user: UsersInterface | null;
  setUser: (user: UsersInterface | null) => void;
  meters: MeterLocationInterface[];
  getMeters: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  waterusage: WaterMeterValueInterface[];
  waterDaily: CameraDeviceInterface[];
  notifications: NotificationInterface[];
};

const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  meters: [],
  getMeters: async () => {},
  loading: true,
  setLoading: () => {},
  waterusage: [],
  waterDaily: [],
  notifications: [],
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const id = String(localStorage.getItem("id") ?? "");
  const token = localStorage.getItem("token");
  const [messageApi] = message.useMessage();
  const [user, setUser] = useState<UsersInterface | null>(null);
  const [meters, setMeters] = useState<MeterLocationInterface[]>([]);
  const [waterusage, setWaterUsage] = useState<WaterMeterValueInterface[]>([]);
  const [waterDaily, setWaterDaily] = useState<CameraDeviceInterface[]>([]);
  const [notifications, setNotifications] = useState<NotificationInterface[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const getUserById = async () => {
    if (!id || !token) return;
    try {
      const res = await GetUsersById(id);
      if (res && res.status === 200) {
        setUser(res.data);
      } else {
        setUser(null);
        messageApi.open({
          type: "error",
          content: res?.data?.error || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      messageApi.open({
        type: "error",
        content: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์",
      });
    }
  };

  const getMeters = async () => {
    if (!token) return;
    try {
      const res = await GetMerters();
      if (res && res.status === 200) {
        setMeters(res.data);
        messageApi.success("ดึงข้อมูลมิเตอร์เรียบร้อย");
      } else {
        setMeters([]);
        messageApi.open({
          type: "error",
          content: res?.data?.error || "ไม่สามารถโหลดข้อมูลมิเตอร์ได้",
        });
      }
    } catch (error) {
      console.error("Error fetching meters:", error);
      setMeters([]);
      messageApi.open({
        type: "error",
        content: "เกิดข้อผิดพลาดในการโหลดมิเตอร์",
      });
    }
  };

  const getNotification = async () => {
    if (!token) return;
    try {
      const res = await GetAllNotifications();
      if (res && res.status === 200) {
        setNotifications(res.data);
        messageApi.success("ดึงข้อมูลการแจ้งเตือนเรียบร้อย");
      } else {
        setNotifications([]);
        messageApi.open({
          type: "error",
          content: res?.data?.error || "ไม่สามารถโหลดการแจ้งเตือนได้",
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      messageApi.open({
        type: "error",
        content: "เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน",
      });
    }
  };

  const getWaterLog = async () => {
    if (!token) return;
    try {
      const res = await GetAllWaterUsageLogs();
      if (res && res.status === 200) {
        setWaterUsage(res.data);
        messageApi.success("ดึงข้อมูลการใช้น้ำเรียบร้อย");
      } else {
        setWaterUsage([]);
        messageApi.open({
          type: "error",
          content: res?.data?.error || "ไม่สามารถโหลดข้อมูลการใช้น้ำได้",
        });
      }
    } catch (error) {
      console.error("Error fetching water usage:", error);
      setWaterUsage([]);
      messageApi.open({
        type: "error",
        content: "เกิดข้อผิดพลาดในการโหลดข้อมูลการใช้น้ำ",
      });
    }
  };

  const getAllWaterDaily = async () => {
    let res = await GetAllWaterDaily();
    if (res.status == 200) {
      setWaterDaily(res.data);
      messageApi.success("ดึงข้อมูลการใช้น้ำเรียบร้อย");
    } else {
      setWaterDaily([]);
      messageApi.open({
        type: "error",
        content: res.data.error,
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);

    getUserById();
    getMeters();
    getWaterLog();
    getNotification();
    getAllWaterDaily();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        meters,
        getMeters,
        loading,
        setLoading,
        waterusage,
        waterDaily,
        notifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
