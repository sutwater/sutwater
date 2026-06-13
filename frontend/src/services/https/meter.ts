
import axios from "axios";
import { MeterLocationInterface } from "../../interfaces/InterfaceAll";
import { authHeader }  from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

// ฟังก์ชันดึงข้อมูลจุด Meter ทั้งหมด
export async function GetMerters() {
  return await axios
    .get(`${apiUrl}/meter`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetMeterLocationById(id: string) {
  return await axios
    .get(`${apiUrl}/meter/name/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันดึงข้อมูลจุด Meter ทั้งหมด
export async function GetMeterLocations () {
  return await axios
    .get(`${apiUrl}/meter/manage`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันสร้างจุด Meter ใหม่
export async function CreateMeter(data: MeterLocationInterface) {
  return await axios
    .post(`${apiUrl}/meter`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

// ฟังก์ชันลบจุด Meter โดยใช้ id
export async function DeleteMeterLocation(id: string) {
  return await axios
    .delete(`${apiUrl}/meter/${id}`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}
