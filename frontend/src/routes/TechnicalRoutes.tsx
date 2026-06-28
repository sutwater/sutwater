import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";

import Water from "../pages/water/Water";
import NotFound from "../pages/404/404Page";
import WaterMeterMap from "../pages/water/MeterMap";
import MaintainLog from "../pages/maintain/MaintainLogPage";
import Profile from "../pages/profile/ProfilePage";

const TechnicalRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <SidebarLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/maintain-log", element: <MaintainLog   /> },
            { path: "/water-map", element: <WaterMeterMap /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default TechnicalRoutes;
