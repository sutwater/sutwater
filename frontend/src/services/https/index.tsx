import { UsersInterface } from "../../interfaces/IUser";
import { SignInInterface } from "../../interfaces/SignIn";
import { MeterLocationInterface } from "../../interfaces/InterfaceAll";
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const apiUrl = "http://localhost:8000";

// ✅ ดึง token & type แบบ dynamic
function authHeader() {
  const token = localStorage.getItem("token");
  const type = localStorage.getItem("token_type");
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${type} ${token}`,
    },
  };
}

async function SignIn(data: SignInInterface) {
  return await axios
    .post(`${apiUrl}/signin`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetGender() {
  return await axios
    .get(`${apiUrl}/genders`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetUsers() {
  return await axios
    .get(`${apiUrl}/users`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetUsersById(id: string) {
  try {
    const res = await axios.get(`${apiUrl}/user/${id}`, authHeader());
    return res;
  } catch (e: any) {
    return e?.response ?? { status: 500, data: { error: "Unknown error" } };
  }
}

async function UpdateUsersById(id: string, data: UsersInterface) {
  return await axios
    .put(`${apiUrl}/user/${id}`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function DeleteUsersById(id: string) {
  return await axios
    .delete(`${apiUrl}/user/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateUser(data: UsersInterface) {
  return await axios
    .post(`${apiUrl}/signup`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// METER
async function GetMerters() {
  return await axios
    .get(`${apiUrl}/meters`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateMeter(data: MeterLocationInterface) {
  return await axios
    .post(`${apiUrl}/meters`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// WaterValue
async function GetAllWaterUsageLogs() {
  return await axios
    .get(`${apiUrl}/waterusages`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetAllWaterDaily() {
  return await axios
    .get(`${apiUrl}/waterdetail`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetMeterLocationDetail(
  id: string,
  startDate?: string,
  endDate?: string
) {
  let params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  return await axios
    .get(`${apiUrl}/waterdetail/${id}`, {
      ...authHeader(),
      params,
    })
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateWaterMeterValue(formData: FormData) {
  try {
    const res = await axios.post(`${apiUrl}/watervalue`, formData, {
      headers: {
        ...authHeader().headers, // เอา header เดิมที่คุณมี เช่น Authorization
        "Content-Type": "multipart/form-data", // ให้ axios จัดการ boundary เอง
      },
    });
    return res;
  } catch (e: any) {
    return e.response;
  }
}

async function UpdateWaterMeterValue(id: string, formData: FormData) {
  try {
    return await axios.patch(`${apiUrl}/watervalue/${id}`, formData, {
      headers: {
        ...authHeader().headers,
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (e: any) {
    throw e.response;
  }
}


async function fetchWaterValueById(id: string) {
  return await axios
    .get(`${apiUrl}/watervalue/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// notification
async function GetNotificationsByMeterLocation(id: string) {
  return await axios
    .get(`${apiUrl}/notifications/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function GetAllNotifications() {
  return await axios
    .get(`${apiUrl}/notifications`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

//status
async function fetchWaterValueStatus() {
  return await axios
    .get(`${apiUrl}/watervalue/status`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

//device
async function fetchCameraDevice() {
  return await axios
    .get(`${apiUrl}/cameradevices`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function fetchCameraDeviceWithoutMac() {
  return await axios
    .get(`${apiUrl}/cameradevices/without-mac`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function fetchCameraDeviceByID(id: string) {
  return await axios
    .get(`${apiUrl}/cameradevice/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export {
  SignIn,
  GetGender,
  GetUsers,
  GetUsersById,
  UpdateUsersById,
  DeleteUsersById,
  CreateUser,
  GetMerters,
  CreateMeter,
  GetAllWaterUsageLogs,
  GetMeterLocationDetail,
  CreateWaterMeterValue,
  UpdateWaterMeterValue,
  GetAllWaterDaily,
  fetchWaterValueById,
  GetNotificationsByMeterLocation,
  GetAllNotifications,
  fetchWaterValueStatus,
  fetchCameraDevice,
  fetchCameraDeviceWithoutMac,
  fetchCameraDeviceByID,
};
