import { UsersInterface } from "../../interfaces/IUser";
import { SignInInterface } from "../../interfaces/SignIn";
import { MeterLocationInterface } from "../../interfaces/InterfaceAll";

import axios from "axios";

export const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

export async function fetchMeterLocations () {
  return await axios
    .get(`${apiUrl}/meters/manage`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function updateMeterLocation(id: string, data: MeterLocationInterface) {
  return await axios
    .put(`${apiUrl}/meters/${id}`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function CreateMeter(data: MeterLocationInterface) {
  return await axios
    .post(`${apiUrl}/meters`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function deleteMeterLocation(id: string) {
  return await axios
    .delete(`${apiUrl}/meters/${id}`, authHeader())
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

export async function fetchMeterLocationById(id: string) {
  return await axios
    .get(`${apiUrl}/meter/name/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function fetchWaterValueById(id: string) {
  return await axios
    .get(`${apiUrl}/watervalue/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function fetchWaterValueReqByCameraId(id: string) {
  return await axios
    .get(`${apiUrl}/watervalue/req/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function deleteWaterDataByCameraID(cameraID: string) {
  return await axios
    .delete(`${apiUrl}/watervalue/clear/${cameraID}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function fetchAllWaterValueReq() {
  return await axios
    .get(`${apiUrl}/watervalue/req`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

async function updateWaterValueStatusById(id: string, meterValue?: number) {
  return await axios
    .patch(`${apiUrl}/watervalue/status/${id}`, { meterValue: meterValue }  , authHeader()) // null สำหรับ body
    .then(res => res)
    .catch(e => e.response);
}

export async function updateWaterValueStatusToReJect(id: string, meterValue?: number) {
  return await axios
    .patch(`${apiUrl}/watervalue/status/reject/${id}`, { meterValue: meterValue }  , authHeader()) // null สำหรับ body
    .then(res => res)
    .catch(e => e.response);
}

async function deleteWaterValueById(id: string) {
  return await axios
    .delete(`${apiUrl}/watervalue/${id}`, authHeader())
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

export const readAllNotifications = async () => {
  try {
    const res = await axios.patch(`${apiUrl}/notifications`, {}, authHeader());
    return res;
  } catch (err: any) {
    return err.response;
  }
};

// อ่าน Notification ตาม ID
export const readNotificationByID = async (id: string) => {
  try {
    const res = await axios.patch(`${apiUrl}/notifications/${id}`, {}, authHeader());
    return res;
  } catch (err: any) {
    return err.response;
  }
};

// ลบ Notification ตาม ID
export const deleteNotificationByID = async (id: string) => {
  try {
    const res = await axios.delete(`${apiUrl}/notifications/${id}`, authHeader());
    return res;
  } catch (err: any) {
    return err.response;
  }
};

// ดึงสถิติการแจ้งเตือน
export const getNotificationStats = async () => {
  try {
    const res = await axios.get(`${apiUrl}/notifications/stats`, authHeader());
    return res;
  } catch (err: any) {
    return err.response;
  }
};

// ดึงสถิติการใช้น้ำ
export const getWaterUsageStats = async () => {
  try {
    const res = await axios.get(`${apiUrl}/api/water-usage/stats`, authHeader());
    return res;
  } catch (err: any) {
    return err.response;
  }
};

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

async function CreateCameraDevice(formData: FormData) {
  try {
    const res = await axios.post(`${apiUrl}/cameradevice`, formData, {
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

async function UpdateCameraDevice(id: string, formData: FormData) {
  try {
    return await axios.patch(`${apiUrl}/cameradevice/${id}`, formData, {
      headers: {
        ...authHeader().headers,
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (e: any) {
    throw e.response;
  }
}

async function deleteCameraDeviceByMeterLocationId(id: string) {
  return await axios
    .delete(`${apiUrl}/cameradevice/${id}`, authHeader())
    
    .then((res) => res)
    .catch((e) => e.response);
}


async function updateCameraDeviceMacAddress(id: string, macAddress: string) {
  try {
    return await axios.put(
      `${apiUrl}/cameradevice/macaddress/${id}`,
      { MacAddress: macAddress },
      authHeader()
    );
  } catch (err: any) {
    throw err.response;
  }
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
  updateWaterValueStatusById,
  deleteWaterValueById,
  fetchWaterValueById,
  GetNotificationsByMeterLocation,
  GetAllNotifications,
  fetchWaterValueStatus,
  CreateCameraDevice,
  UpdateCameraDevice,
  deleteCameraDeviceByMeterLocationId,
  fetchCameraDevice,
  fetchCameraDeviceWithoutMac,
  fetchCameraDeviceByID,
  fetchWaterValueReqByCameraId,
  fetchAllWaterValueReq,
  updateCameraDeviceMacAddress,
  
};