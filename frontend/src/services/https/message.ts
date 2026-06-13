import axios, { AxiosError } from "axios";
import { authHeader } from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function GetNotificationsByMeterLocation(id: string) {
  return await axios
    .get(`${apiUrl}/notification/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAllNotifications() {
  return await axios
    .get(`${apiUrl}/notification`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export const ReadAllNotifications = async () => {
  try {
    const res = await axios.patch(`${apiUrl}/notification`, {}, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};

// อ่าน Notification ตาม ID
export const ReadNotificationByID = async (id: string) => {
  try {
    const res = await axios.patch(`${apiUrl}/notification/${id}`, {}, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};

// ลบ Notification ตาม ID
export const DeleteNotificationByID = async (id: string) => {
  try {
    const res = await axios.delete(`${apiUrl}/notification/${id}`, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};