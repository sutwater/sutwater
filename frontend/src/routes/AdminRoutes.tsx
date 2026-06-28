import { JSX, lazy } from "react";
import { RouteObject, Navigate } from "react-router-dom";
import Loadable from "../components/third-party/Loadable";

import FullLayout from "../layout/FullLayout";

const Landing          = Loadable(lazy(() => import("../pages/home/Landing")));
const WaterMeterMap    = Loadable(lazy(() => import("../pages/water/WaterMeterMap")));
const NotificationPage = Loadable(lazy(() => import("../pages/notification")));
const DevicePage       = Loadable(lazy(() => import("../pages/device/device")));
const MeterPage        = Loadable(lazy(() => import("../pages/water/Meter")));
const EditWaterValuePage = Loadable(lazy(() => import("../pages/water/EditWaterValue")));
const ContactPage      = Loadable(lazy(() => import("../pages/contact")));
const Water            = Loadable(lazy(() => import("../pages/water/Water")));
const WaterDetailPage  = Loadable(lazy(() => import("../pages/water/WaterDetail")));
const SignInPages      = Loadable(lazy(() => import("../pages/authentication/Login/LogInPage")));
const AdminDashboard   = Loadable(lazy(() => import("../pages/admin/AdminDashboard")));
const ProfilePage         = Loadable(lazy(() => import("../pages/profile/ProfilePage")));
const ForgotPasswordPage  = Loadable(lazy(() => import("../pages/authentication/ForgotPassword/ForgotPasswordPage")));

const AdminPage      = Loadable(lazy(() => import("../pages/role/AdminPage")));
const EngineerPage   = Loadable(lazy(() => import("../pages/role/EngineerPage")));
const TechnicianPage = Loadable(lazy(() => import("../pages/role/TechnicianPage")));
const UserPage       = Loadable(lazy(() => import("../pages/role/UserPage")));

const RequireAuth = ({
  isLoggedIn,
  allowedRoles,
  children,
}: {
  isLoggedIn: boolean;
  allowedRoles?: number[];
  children: JSX.Element;
}) => {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const userRole = Number(localStorage.getItem("role_id") ?? "0");
    if (!allowedRoles.includes(userRole)) return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRoutes = (isLoggedIn: boolean): RouteObject => ({
  path: "/",
  element: <FullLayout />,
  children: [
    // ---------- Public routes ----------
    { path: "login", element: <SignInPages /> },

    // ---------- Index (หน้าแรก) ----------
    { index: true, element: <Landing /> },

    // ---------- Role home pages ----------
    {
      path: "role/admin",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn} allowedRoles={[1]}>
          <AdminPage />
        </RequireAuth>
      ),
    },
    {
      path: "role/engineer",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn} allowedRoles={[2]}>
          <EngineerPage />
        </RequireAuth>
      ),
    },
    {
      path: "role/technician",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn} allowedRoles={[3]}>
          <TechnicianPage />
        </RequireAuth>
      ),
    },
    {
      path: "role/user",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn} allowedRoles={[4]}>
          <UserPage />
        </RequireAuth>
      ),
    },

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
      path: "meter",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <MeterPage />
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
        <RequireAuth isLoggedIn={isLoggedIn} allowedRoles={[1]}>
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
    {
      path: "change-password",
      element: (
        <RequireAuth isLoggedIn={isLoggedIn}>
          <ForgotPasswordPage />
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
