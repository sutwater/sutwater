import { useRoutes, type RouteObject } from "react-router-dom";
import LogInRoutes from "./LogInRoutes";
import TechnicalRoutes from "./TechnicalRoutes";
import AdminRoutes from "./AdminRoutes";
import EngineerRoutes from "./EngineerRoutes";
import UserRoutes from "./UserRoutes";

function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem("isLogin") === "true"; 
  const role = localStorage.getItem("role_id"); 

  let routes: RouteObject[] = []; // กำหนดค่าเริ่มต้นให้กับ routes

  // ตรวจสอบว่าเข้าสู่ระบบหรือยัง
  if (isLoggedIn) {
    switch (role) {
      case "1": //Admin
        routes = [AdminRoutes()];
        break;
      case "2": //Engineer
        routes = [EngineerRoutes()]; 
        break;
      case "3":  //Technical
        routes = [TechnicalRoutes()]; 
        break;
      case "4": //User
        routes = [UserRoutes()]; 
        break;
      default:
        routes = [LogInRoutes()];
    }
  } else {
    routes = [LogInRoutes()];
  }

  return useRoutes(routes); // ใช้ useRoutes กับ routes ที่ได้จากเงื่อนไขข้างต้น
}

export default ConfigRoutes;