import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";

import Water from "../pages/water/Water";
import Profile from "../pages/profile/ProfilePage";
import NotFound from "../pages/404/404Page";
import WaterMeterMap from "../pages/water/MeterMap";
import NotiMaintainLog from "../pages/maintain/NotiMaintainPage";


const UserRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <SidebarLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/maintain-noti", element: <NotiMaintainLog /> },
            { path: "/water-map", element: <WaterMeterMap /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default UserRoutes;
