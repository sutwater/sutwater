import { RouteObject } from "react-router-dom";
import OutletLayout from "@/layout/OutletLayout";

import WaterMeterMap from "../pages/water/MeterMap";
import DevicePage from "../pages/device/device";
import MeterPage from "../pages/water/Meter";
import EditWaterValuePage from "../pages/water/EditWaterValue";
import Water from "../pages/water/Water";
import WaterDetailPage from "../pages/water/WaterDetail";
import NotFound from "../pages/404/404";

const AdminRoutes = (): RouteObject => {
  return {
    path: "/",
    element: <OutletLayout />,
    children: [
      { path: "/", element: <Water /> },
      { path: "/water-map", element: <WaterMeterMap /> },
      { path: "/device", element: <DevicePage /> },
      { path: "/meter", element: <MeterPage /> },
      { path: "/meter-edit", element: <EditWaterValuePage /> },
      { path: "/water-detail", element: <WaterDetailPage /> },
      { path: "*", element: <NotFound/> },
    ],
  };
};

export default AdminRoutes;
