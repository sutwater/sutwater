import React, { useCallback, useEffect, useState } from "react";
import { UsersInterface } from "../interfaces/IUser";
import { GetUsersById } from "../services/https/user";
import { GetAllNotifications } from "../services/https/message";
import { GetMerters } from "../services/https/meter";
import { GetAllWaterUsageLogs } from "../services/https/waterValue";
import {
  MeterLocationInterface,
  NotificationInterface,
  WaterValueResponse,
} from "../interfaces/InterfaceAll";
import { AppContext } from "./AppContextDef";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const id = String(localStorage.getItem("id") ?? "");
  const token = localStorage.getItem("token");
  const [user, setUser] = useState<UsersInterface | null>(null);
  const [meters, setMeters] = useState<MeterLocationInterface[]>([]);
  const [waterusage, setWaterUsage] = useState<WaterValueResponse[]>([]);
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
      }
    } catch {
      setUser(null);
    }
  }, [id, token]);

  const getMeters = useCallback(async () => {
    if (!token) return;
    try {
      const res = await GetMerters();
      if (res && res.status === 200) {
        const data = res.data?.data ?? res.data;
        setMeters(Array.isArray(data) ? data : []);
      } else {
        setMeters([]);
      }
    } catch {
      setMeters([]);
    }
  }, [token]);

  const getNotification = useCallback(async () => {
    if (!token) return;
    try {
      const res = await GetAllNotifications();
      if (res && res.status === 200) {
        const data = res.data?.data ?? res.data;
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }
  }, [token]);

  const getWaterLog = useCallback(async () => {
    if (!token) return;
    try {
      const res = await GetAllWaterUsageLogs();
      if (res && res.status === 200) {
        const data = res.data?.data ?? res.data;
        setWaterUsage(Array.isArray(data) ? data : []);
      } else {
        setWaterUsage([]);
      }
    } catch {
      setWaterUsage([]);
    }
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([getUserById(), getMeters(), getWaterLog(), getNotification()]);
      setLoading(false);
    };
    fetchData();
  }, [getUserById, getMeters, getWaterLog, getNotification]);

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
        notifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
