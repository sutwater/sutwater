import { RouteObject } from "react-router-dom";
import OutletLayout from "@/layout/OutletLayout";

import Water from "../pages/water/Water";
import NotFound from "../pages/404/404";

import MaintainLog from "../pages/maintain/MaintainLog";
import Profile from "../pages/profile/Profile";

const TechnicalRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <OutletLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/maintain-log", element: <MaintainLog   /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default TechnicalRoutes;
