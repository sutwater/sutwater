import axios from "axios";
import { authHeader } from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function GetMaintainLogs() {
  return await axios
    .get(`${apiUrl}/maintain-logs`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetMaintainLogStatuses() {
  return await axios
    .get(`${apiUrl}/maintain-logs/statuses`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetMaintainLogById(id: number) {
  return await axios
    .get(`${apiUrl}/maintain-logs/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreateMaintainLog(data: {
  title: string;
  location_text: string;
  close_at?: string | null;
  location_id?: number | null;
  status_id?: number | null;
}) {
  return await axios
    .post(`${apiUrl}/maintain-logs`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateMaintainLog(
  id: number,
  data: {
    title?: string;
    location_text?: string;
    close_at?: string | null;
    location_id?: number | null;
    status_id?: number | null;
  }
) {
  return await axios
    .put(`${apiUrl}/maintain-logs/${id}`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteMaintainLog(id: number) {
  return await axios
    .delete(`${apiUrl}/maintain-logs/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}
