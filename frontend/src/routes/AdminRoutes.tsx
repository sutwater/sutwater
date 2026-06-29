import { RouteObject } from "react-router-dom";
import SidebarLayout from "@/layout/SidebarLayout";
import WaterMeterMap from "../pages/water/MeterMap";
import DevicePage from "../pages/device/DevicePage";
import MeterPage from "../pages/water/Meter";
import EditWaterValuePage from "../pages/water/EditWaterValue";
import WaterPage from "../pages/water/Water";
import WaterDetailPage from "../pages/water/WaterDetail";
import MaintainLogPage from "../pages/maintain/MaintainLogPage";
import UserPage from "../pages/user/UserPage";
import ProfilePage from "../pages/profile/ProfilePage";
import NotificationPage from "../pages/notification/NotificationPage";
import NotFoundPage from "../pages/404/404Page";

const AdminRoutes = (): RouteObject => {
  return {
    path: "/",
    element: <SidebarLayout />,
    children: [
      { path: "/", element: <WaterPage /> },
      { path: "/water-map", element: <WaterMeterMap /> },
      { path: "/notification", element: <NotificationPage /> },
      { path: "/device", element: <DevicePage /> },
      { path: "/meter", element: <MeterPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/meter-edit", element: <EditWaterValuePage /> },
      { path: "/water-detail", element: <WaterDetailPage /> },
      { path: "/maintain-log", element: <MaintainLogPage /> },
      { path: "/user", element: <UserPage /> },
      { path: "*", element: <NotFoundPage/> },
    ],
  };
};

export default AdminRoutes;
