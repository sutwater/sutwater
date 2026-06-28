import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";

import Water from "../pages/water/Water";
import NotFound from "../pages/404/404";

import MaintainLog from "../pages/maintain/MaintainLog";
import Profile from "../pages/profile/Profile";

const TechnicalRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <SidebarLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/maintain-log", element: <MaintainLog   /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default TechnicalRoutes;
