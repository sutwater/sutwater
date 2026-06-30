import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";
import Water from "../pages/water/Water";
import Profile from "../pages/profile/ProfilePage";
import WaterMeterMap from "../pages/meter/MeterMap";
import NotiMaintainLog from "../pages/maintain/NotiMaintainPage";
import NotificationPage from "../pages/notification/NotificationPage";
import NotFound from "../pages/404/404Page";

const UserRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <SidebarLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/maintain-noti", element: <NotiMaintainLog /> },
            { path: "/notification", element: <NotificationPage /> },
            { path: "/water-map", element: <WaterMeterMap /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default UserRoutes;
