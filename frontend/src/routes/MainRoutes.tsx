import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import MinimalLayout from "../layout/MinimalLayout";
import Loadable from "../components/third-party/Loadable";

const MainPages     = Loadable(lazy(() => import("../pages/authentication/Login/LogInPage")));
const ForgotPassword = Loadable(lazy(() => import("../pages/authentication/ForgotPassword/ForgotPasswordPage")));
const Registerages  = Loadable(lazy(() => import("../pages/authentication/Register/RegisterPage")));
const TermsPage     = Loadable(lazy(() => import("../pages/legal/TermsPage")));
const PrivacyPage   = Loadable(lazy(() => import("../pages/legal/PrivacyPage")));

const MainRoutes = (): RouteObject => {
  return {
    path: "/",
    element: <MinimalLayout />,
    children: [
      { path: "/login",            element: <MainPages /> },
      { path: "/register",         element: <Registerages /> },
      { path: "/forgot-password",  element: <ForgotPassword /> },
      { path: "/terms",            element: <TermsPage /> },
      { path: "/privacy",          element: <PrivacyPage /> },
      { path: "*",                 element: <MainPages /> },
    ],
  };
};

export default MainRoutes;
