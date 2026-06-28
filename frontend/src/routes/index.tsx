import { useRoutes } from "react-router-dom";

import AdminRoutes from "./AdminRoutes";

import MainRoutes from "./MainRoutes";

function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem("isLogin") === "true";
  return useRoutes([AdminRoutes(isLoggedIn), MainRoutes()]);
}

export default ConfigRoutes;
