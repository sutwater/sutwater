import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";

import Water from "../pages/water/Water";
import Profile from "../pages/profile/Profile";
import NotFound from "../pages/404/404";


const UserRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <SidebarLayout />,
        children: [
            { path: "/", element: <Water /> },
            { path: "/profile", element: <Profile /> },
            { path: "*", element: <NotFound /> },
        ],
    };
};

export default UserRoutes;
