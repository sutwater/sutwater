import React, { createContext, useContext, useEffect, useState } from "react";
import { message  } from "antd";
import { UsersInterface } from "../interfaces/IUser"
import { GetUsersById, GetMerters, GetAllWaterDaily, GetAllNotifications, GetAllWaterUsageLogs } from "../services/https";
import { MeterLocationInterface, WaterMeterValueInterface, NotificationInterface,CameraDeviceInterface } from "../interfaces/InterfaceAll";

type AppContextType = {
  user: UsersInterface | null;
  setUser: (user: UsersInterface | null) => void;
  meters: MeterLocationInterface[]
  getMeters: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  waterusage: WaterMeterValueInterface[]
  waterDaily: CameraDeviceInterface[]
  notifications: NotificationInterface[]
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const id = String(localStorage.getItem("id") ?? "");
    const [messageApi] = message.useMessage();
    const [user, setUser] = useState<UsersInterface | null>(null);
    const [meters, setMeters] = useState<MeterLocationInterface[]>([]);
    const [waterusage, setWaterUsage] = useState<WaterMeterValueInterface[]>([]);
    const [waterDaily, setWaterDaily] = useState<CameraDeviceInterface[]>([]);
    const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
    const [loading, setLoading] = useState(true);

    
    const getUserById = async () => {
      let res = await GetUsersById(id);
      if (res.status == 200) {
        setUser(res.data);
      } else {
        setUser(null);
        messageApi.open({
          type: "error",
          content: res.data.error,
        });
      }
    };

    const getMeters = async () => {
      let res = await GetMerters();
      if (res.status == 200) {
        setMeters(res.data);
        messageApi.success("ดึงข้อมูลมิเตอร์เรียบร้อย")
      } else {
        setMeters([]);
        messageApi.open({
          type: "error",
          content: res.data.error,
        });
      }
    };
    
    const getNotification = async () => {
      let res = await GetAllNotifications();
      if (res.status == 200) {
        setNotifications(res.data);
        messageApi.success("ดึงข้อมูลมิเตอร์เรียบร้อย")
      } else {
        setNotifications([]);
        messageApi.open({
          type: "error",
          content: res.data.error,
        });
      }
    };

    const getWaterLog = async () => {
      let res = await GetAllWaterUsageLogs();
      if (res.status == 200) {
        setWaterUsage(res.data);
        messageApi.success("ดึงข้อมูลการใช้น้ำเรียบร้อย")
      } else {
        setWaterUsage([]);
        messageApi.open({
          type: "error",
          content: res.data.error,
        });
      }
    };

    const getAllWaterDaily = async () => {
      let res = await GetAllWaterDaily();
      if (res.status == 200) {
        setWaterDaily(res.data);
        messageApi.success("ดึงข้อมูลการใช้น้ำเรียบร้อย")
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
        getWaterLog();
        getAllWaterDaily();
        getNotification();
    }, []);

    return (
        <AppContext.Provider value={{ user, setUser, meters, getMeters, loading, setLoading, waterusage, waterDaily, notifications }}>
        {children}
        </AppContext.Provider>
    );
};