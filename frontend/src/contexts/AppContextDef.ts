import { createContext, useContext } from "react";
import type { UsersInterface } from "../interfaces/IUser";
import type {
  MeterLocationInterface,
  WaterMeterValueInterface,
  NotificationInterface,
  CameraDeviceInterface,
} from "../interfaces/InterfaceAll";

export type AppContextType = {
  user: UsersInterface | null;
  setUser: (user: UsersInterface | null) => void;
  meters: MeterLocationInterface[];
  getMeters: () => Promise<void>;
  getNotification: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  waterusage: WaterMeterValueInterface[];
  waterDaily: CameraDeviceInterface[];
  notifications: NotificationInterface[];
};

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  meters: [],
  getMeters: async () => {},
  getNotification: async () => {},
  loading: true,
  setLoading: () => {},
  waterusage: [],
  waterDaily: [],
  notifications: [],
});

export const useAppContext = () => useContext(AppContext);
