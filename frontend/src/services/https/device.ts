import axios from "axios";
import { authHeader } from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function GetDevices() {
  return await axios
    .get(`${apiUrl}/devices`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetDeviceById(id: number) {
  return await axios
    .get(`${apiUrl}/devices/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetAvailableLocations() {
  return await axios
    .get(`${apiUrl}/devices/available-locations`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreateDevice(data: {
  mac_address: string;
  password: string;
  location_id: number;
}) {
  return await axios
    .post(`${apiUrl}/devices`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateDevice(
  id: number,
  data: { mac_address?: string; location_id?: number | null }
) {
  return await axios
    .put(`${apiUrl}/devices/${id}`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteDevice(id: number) {
  return await axios
    .delete(`${apiUrl}/devices/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}
