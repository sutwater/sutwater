import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import Loadable from "../components/third-party/Loadable";

import FullLayout from "../layout/FullLayout";

const MainPages = Loadable(lazy(() => import("../pages/authentication/Login")));

// ✅ เพิ่มหน้าใหม่
const WaterPage = Loadable(lazy(() => import("../pages/water")));
const NotificationPage = Loadable(lazy(() => import("../pages/notification")));
const ContactPage = Loadable(lazy(() => import("../pages/contact")));

const AdminRoutes = (isLoggedIn: boolean): RouteObject => {
  return {
    path: "/",
    element: isLoggedIn ? <FullLayout /> : <MainPages />,
    children: [
      {
        path: "/water",
        element: <WaterPage />,
      },
      {
        path: "/notification",
        element: <NotificationPage />,
      },
      {
        path: "/contact",
        element: <ContactPage />,
      },
    ],
  };
};

export default AdminRoutes;
