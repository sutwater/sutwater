import { RouteObject } from "react-router-dom";
import OutletLayout from "../layout/OutletLayout";
import ForgotPassword from "../pages/authentication/ForgotPassword/ForgotPasswordPage";
import Register from "../pages/authentication/Register/RegisterPage";
import LogIn from "../pages/authentication/LogIn/LogInPage"
import TermsPage from "../pages/legal/TermsPage";
import PrivacyPage from "../pages/legal/PrivacyPage";
import Landing from "../pages/home/Landing";

const LogInRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <OutletLayout />,
        children: [
            { path: "/", element: <Landing /> },
            { path: "/login", element: <LogIn /> },
            { path: "/forgot-password", element: <ForgotPassword /> },
            { path: "/register", element: <Register /> },
            { path: "/terms", element: <TermsPage /> },
            { path: "/privacy", element: <PrivacyPage /> },
            { path: "*", element: <LogIn /> },
        ],
    };
};

export default LogInRoutes;