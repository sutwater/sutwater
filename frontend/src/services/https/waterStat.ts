import axios, { AxiosError } from "axios";
import { authHeader } from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export const GetWaterUsageStats = async () => {
  try {
    const res = await axios.get(`${apiUrl}/api/water-usage/stats`, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};

export const GetNotificationStats = async () => {
  try {
    const res = await axios.get(`${apiUrl}/notifications/stats`, authHeader());
    return res;
  } catch (e) {
    const error = e as AxiosError;
    return error.response;
  }
};