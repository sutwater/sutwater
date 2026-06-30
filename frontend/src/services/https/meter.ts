
import axios from "axios";
import { MeterLocationInterface } from "../../interfaces/InterfaceAll";
import { authHeader } from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function GetMerters() {
  return await axios
    .get(`${apiUrl}/meters`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetMeterById(id: number) {
  return await axios
    .get(`${apiUrl}/meters/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function CreateMeter(data: Omit<MeterLocationInterface, "id" | "created_at" | "updated_at" | "device">) {
  return await axios
    .post(`${apiUrl}/meters`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function UpdateMeter(id: number, data: Omit<MeterLocationInterface, "id" | "created_at" | "updated_at" | "device">) {
  return await axios
    .put(`${apiUrl}/meters/${id}`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function DeleteMeter(id: number) {
  return await axios
    .delete(`${apiUrl}/meters/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}
