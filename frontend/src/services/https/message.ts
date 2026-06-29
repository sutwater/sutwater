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
    .get(`${apiUrl}/notifications`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export const ReadAllNotifications = async () => {
  try {
    const res = await axios.put(`${apiUrl}/notifications/read-all`, {}, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};

// อ่าน Notification ตาม ID
export const ReadNotificationByID = async (id: string) => {
  try {
    const res = await axios.put(`${apiUrl}/notifications/${id}/read`, {}, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};

// ลบ Notification ตาม ID
export const DeleteNotificationByID = async (id: string) => {
  try {
    const res = await axios.delete(`${apiUrl}/notifications/${id}`, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};