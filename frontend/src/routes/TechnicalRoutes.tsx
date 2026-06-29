import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";
import Water from "../pages/water/Water";
import WaterMeterMap from "../pages/water/MeterMap";
import MaintainLog from "../pages/maintain/MaintainLogPage";
import NotificationPage from "../pages/notification/NotificationPage";
import Profile from "../pages/profile/ProfilePage";
import NotFound from "../pages/404/404Page";

const TechnicalRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <SidebarLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/maintain-log", element: <MaintainLog   /> },
            { path: "/notification", element: <NotificationPage /> },
            { path: "/water-map", element: <WaterMeterMap /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default TechnicalRoutes;
