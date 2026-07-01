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

export async function CreateMaintainLogReport(data: {
  title: string;
  location_text: string;
  location_id?: number | null;
  image?: File;
}) {
  const form = new FormData();
  form.append("title", data.title);
  form.append("location_text", data.location_text);
  if (data.location_id != null) form.append("location_id", String(data.location_id));
  if (data.image) form.append("image", data.image);
  return await axios
    .post(`${apiUrl}/maintain-logs/report`, form, {
      headers: { ...authHeader().headers, "Content-Type": "multipart/form-data" },
    })
    .then((res) => res)
    .catch((e) => e.response);
}
