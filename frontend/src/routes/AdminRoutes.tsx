import { JSX, lazy } from "react";
import { RouteObject, Navigate } from "react-router-dom";
import Loadable from "../components/third-party/Loadable";

import FullLayout from "../layout/FullLayout";

const HomeBanner       = Loadable(lazy(() => import("../pages/home/HomeBanner.tsx")));

// ✅ เพิ่มหน้าใหม่
const WaterMeterMap = Loadable(
  lazy(() => import("../pages/water/WaterMeterMap"))
);
const NotificationPage = Loadable(lazy(() => import("../pages/notification")));
const DevicePage = Loadable(lazy(() => import("../pages/device/device")));
const EditWaterValuePage = Loadable(lazy(() => import("../pages/water/EditWaterValue")));
const ContactPage = Loadable(lazy(() => import("../pages/contact")));
const Water = Loadable(lazy(() => import("../pages/water/Water")));
const WaterDetailPage = Loadable(
  lazy(() => import("../pages/water/WaterDetail"))
);
const SignInPages = Loadable(
  lazy(() => import("../pages/authentication/Login/SignInPages"))
);
const SignUpPages = Loadable(
  lazy(() => import("../pages/authentication/Register/SignUpPages"))
);
const AdminDashboard = Loadable(
  lazy(() => import("../pages/admin/AdminDashboard"))
);
const ProfilePage = Loadable(
  lazy(() => import("../pages/profile/ProfilePage"))
);
const LiffLink = Loadable(lazy(() => import("../pages/line/LiffLink")));

const RequireAuth = ({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean;
  children: JSX.Element;
}) => (isLoggedIn ? children : <Navigate to="/login" replace />);

const AdminRoutes = (isLoggedIn: boolean): RouteObject => ({
  path: "/",
  element: <FullLayout />, // ต้องมี <Outlet/> ภายใน
  children: [
    // ---------- Public routes ----------
    { path: "login", element: <SignInPages /> },
    { path: "signup", element: <SignUpPages /> },
    // หน้า LIFF ต้องเป็น public และอยู่ top-level เสมอ
    { path: "liff-link", element: <LiffLink /> },

    // ---------- Index (หน้าแรก) ----------
    { index: true, element: <HomeBanner /> },

    // ---------- Protected routes ----------
    {
      path: "water",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <WaterMeterMap />
        </RequireAuth>
      ),
    },
    {
      path: "device",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <DevicePage />
        </RequireAuth>
      ),
    },
    {
      path: "waterdetail/:id",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <WaterDetailPage />
        </RequireAuth>
      ),
    },
    {
      path: "waterdetail/edit/:id",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <EditWaterValuePage />
        </RequireAuth>
      ),
    },
    {
      path: "waterdashboard",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <Water />
        </RequireAuth>
      ),
    },
    {
      path: "notification",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <NotificationPage />
        </RequireAuth>
      ),
    },
    {
      path: "contact",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <ContactPage />
        </RequireAuth>
      ),
    },
    {
      path: "admin",
      element: (
        <RequireAuth isLoggedIn={localStorage.getItem("isAdmin") === "true"}>
          <AdminDashboard />
        </RequireAuth>
      ),
    },
    {
      path: "profile",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <ProfilePage />
        </RequireAuth>
      ),
    },

    // ---------- Fallback ----------
    {
      path: "*",
      element: <Navigate to={isLoggedIn ? "/" : "/login"} replace />,
    },
  ],
});

export default AdminRoutes;
