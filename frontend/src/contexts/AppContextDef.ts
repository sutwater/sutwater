import { createContext, useContext } from "react";
import type { UsersInterface } from "../interfaces/IUser";
import type {
  MeterLocationInterface,
  NotificationInterface,
  WaterValueResponse,
} from "../interfaces/InterfaceAll";

export type AppContextType = {
  user: UsersInterface | null;
  setUser: (user: UsersInterface | null) => void;
  meters: MeterLocationInterface[];
  getMeters: () => Promise<void>;
  getNotification: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  waterusage: WaterValueResponse[];
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
  notifications: [],
});

export const useAppContext = () => useContext(AppContext);
