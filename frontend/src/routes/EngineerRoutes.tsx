import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";

import Water from "../pages/water/Water";
import WaterMap from "../pages/water/MeterMap";
import Maintain from "../pages/maintain/MaintainLog";
import Profile from "../pages/profile/Profile";
import NotFound from "../pages/404/404";


const EngineerRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <SidebarLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/water", element: <Water /> },
            { path: "/water-map", element: <WaterMap /> },
            { path: "/maintain-log", element: <Maintain /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default EngineerRoutes;
