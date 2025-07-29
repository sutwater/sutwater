import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import Loadable from "../components/third-party/Loadable";

import FullLayout from "../layout/FullLayout";

const MainPages = Loadable(lazy(() => import("../pages/authentication/Login/SignInPages")));

// ✅ เพิ่มหน้าใหม่
const WaterPage = Loadable(lazy(() => import("../pages/water/HospitalMapImage")));
const NotificationPage = Loadable(lazy(() => import("../pages/notification")));
const ContactPage = Loadable(lazy(() => import("../pages/contact")));
const Water = Loadable(lazy(() => import("../pages/water/Water")));
const WaterDetailPage = Loadable(lazy(() => import("../pages/water/WaterDetail")));
const SignInPages = Loadable(lazy(() => import("../pages/authentication/Login/SignInPages")));
const AdminDashboard = Loadable(lazy(() => import("../pages/admin/AdminDashboard")));
const ProfilePage = Loadable(lazy(() => import("../pages/profile/ProfilePage")));

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
        path: "/water/:name",
        element: <WaterDetailPage />,
      },
      {
        path: "/waterdetail",
        element: <Water />,
      },
      {
        path: "/notification",
        element: <NotificationPage />,
      },
      {
        path: "/contact",
        element: <ContactPage />,
      },
      {
        path: "/login",
        element: <SignInPages />,
      },
      {
        path: "/admin",
        element: <AdminDashboard />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
    ],
  };
};

export default AdminRoutes;
