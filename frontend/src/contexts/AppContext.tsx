import React, { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { UsersInterface } from "../interfaces/IUser";
import { GetUsersById } from "../services/https/user";
import { GetAllNotifications } from "../services/https/message";
import { GetMerters } from "../services/https/meter";
import { GetAllWaterDaily, GetAllWaterUsageLogs} from "../services/https/waterValue";
import {
  MeterLocationInterface,
  WaterMeterValueInterface,
  NotificationInterface,
  CameraDeviceInterface,
} from "../interfaces/InterfaceAll";
import { AppContext } from "./AppContextDef";

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
  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [loading, setLoading] = useState(true);
  
  const getUserById = useCallback(async () => {
    if (!id || !token) return;
    try {
      const res = await GetUsersById(id);
      if (res && res.status === 200) {
        setUser({ ...res.data });
      } else {
        setUser(null);
        messageApi.error(res?.data?.error || "ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
      messageApi.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  }, [id, token, messageApi]);

  const getMeters = useCallback(async () => {
    if (!token) return;
    try {
      const res = await GetMerters();
      if (res && res.status === 200) {
        setMeters(res.data);
      } else {
        setMeters([]);
        messageApi.error(res?.data?.error || "ไม่สามารถโหลดข้อมูลมิเตอร์ได้");
      }
    } catch (error) {
      console.error("Error fetching meter data:", error);
      setMeters([]);
      messageApi.error("เกิดข้อผิดพลาดในการโหลดมิเตอร์");
    }
  }, [token, messageApi]);

  const getNotification = useCallback(async () => {
    if (!token) return;
    try {
      const res = await GetAllNotifications();
      if (res && res.status === 200) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
        messageApi.error(res?.data?.error || "ไม่สามารถโหลดการแจ้งเตือนได้");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      messageApi.error("เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน");
    }
  }, [token, messageApi]);

  const getWaterLog = useCallback(async () => {
    if (!token) return;
    try {
      const res = await GetAllWaterUsageLogs();
      if (res && res.status === 200) {
        setWaterUsage(res.data);
      } else {
        setWaterUsage([]);
        messageApi.error(res?.data?.error || "ไม่สามารถโหลดข้อมูลการใช้น้ำได้");
      }
    } catch (error) {
      console.error("Error fetching water usage logs:", error);
      setWaterUsage([]);
      messageApi.error("เกิดข้อผิดพลาดในการโหลดข้อมูลการใช้น้ำ");
    }
  }, [token, messageApi]);

  const getAllWaterDaily = useCallback(async () => {
    try {
      const res = await GetAllWaterDaily();
      if (res.status === 200) {
        setWaterDaily(res.data);
      } else {
        setWaterDaily([]);
        messageApi.error(res.data.error);
      }
    } catch (error) {
      console.error("Error fetching daily water data:", error);
      setWaterDaily([]);
    }
  }, [messageApi]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        getUserById(),
        getMeters(),
        getWaterLog(),
        getNotification(),
        getAllWaterDaily()
      ]);
      setLoading(false);
    };

    fetchData();
  }, [getUserById, getMeters, getWaterLog, getNotification, getAllWaterDaily]); // ใส่ dependencies ให้ครบ

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        meters,
        getMeters,
        getNotification,
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