import React, { createContext, useContext, useEffect, useState } from "react";
import { message  } from "antd";
import { UsersInterface } from "../interfaces/IUser"
import { GetUsersById, GetMerters, GetAllWaterUsageLogs,GetAllNotifications } from "../services/https";
import { MeterLocationInterface, WaterMeterValueInterface, NotificationInterface } from "../interfaces/InterfaceAll";

type AppContextType = {
  user: UsersInterface | null;
  setUser: (user: UsersInterface | null) => void;
  meters: MeterLocationInterface[]
  loading: boolean;
  waterusage: WaterMeterValueInterface[]
  notifications: NotificationInterface[]

};


const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  meters: [],
  loading: true,
  waterusage: [],
  notifications: [],
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const id = String(localStorage.getItem("id") ?? "");
    const [messageApi] = message.useMessage();
    const [user, setUser] = useState<UsersInterface | null>(null);
    const [meters, setMeters] = useState<MeterLocationInterface[]>([]);
    const [waterusage, setWaterUsage] = useState<WaterMeterValueInterface[]>([]);
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

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 500);
        getUserById();
        getMeters();
        getWaterLog();
        getNotification();
    }, []);

    return (
        <AppContext.Provider value={{ user, setUser, meters, loading, waterusage, notifications }}>
        {children}
        </AppContext.Provider>
    );
};