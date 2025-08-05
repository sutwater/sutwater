import React, { createContext, useContext, useEffect, useState } from "react";
import { message  } from "antd";
import { UsersInterface } from "../interfaces/IUser"
import { GetUsersById, GetMerters } from "../services/https";
import { MeterInterface } from "../interfaces/Meter";

type AppContextType = {
  user: UsersInterface | null;
  setUser: (user: UsersInterface | null) => void;
  meters: MeterInterface[]
  loading: boolean;
};


const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  meters: [],
  loading: true,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const id = String(localStorage.getItem("id") ?? "");
    const [messageApi] = message.useMessage();
    const [user, setUser] = useState<UsersInterface | null>(null);
    const [meters, setMeters] = useState<MeterInterface[]>([]);
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
      } else {
        setMeters([]);
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
    }, []);

    return (
        <AppContext.Provider value={{ user, setUser, meters, loading }}>
        {children}
        </AppContext.Provider>
    );
};