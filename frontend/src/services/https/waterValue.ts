import axios, { AxiosError } from "axios";
import { authHeader } from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

interface MeterParams {
    startDate?: string;
    endDate?: string;
}

export async function GetAllWaterUsageLogs() {
    return await axios
        .get(`${apiUrl}/waterusages`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function GetWaterValueById(id: string) {
    return await axios
        .get(`${apiUrl}/watervalue/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function GetWaterValueReqByCameraId(id: string) {
    return await axios
        .get(`${apiUrl}/watervalue/req/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function GetWaterValueStatus() {
    return await axios
        .get(`${apiUrl}/watervalue/status`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function GetAllWaterDaily() {
    return await axios
        .get(`${apiUrl}/waterdetail`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function GetMeterLocationDetail(
    id: string,
    startDate?: string,
    endDate?: string
) {
    const params: MeterParams = {};
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

export async function CreateWaterMeterValue(formData: FormData) {
    try {
        const res = await axios.post(`${apiUrl}/watervalue`, formData, {
            headers: {
                ...authHeader().headers, // เอา header เดิมที่คุณมี เช่น Authorization
                "Content-Type": "multipart/form-data", // ให้ axios จัดการ boundary เอง
            },
        });
        return res;
    } catch (e) {
        const error = e as AxiosError;
        return error.response;
    }
}

export async function UpdateWaterMeterValue(id: string, formData: FormData) {
    try {
        return await axios.patch(`${apiUrl}/watervalue/${id}`, formData, {
            headers: {
                ...authHeader().headers,
                "Content-Type": "multipart/form-data",
            },
        });
    } catch (e) {
        const error = e as AxiosError;
        return error.response;
    }
}

export async function DeleteWaterDataByCameraID(cameraID: string) {
    return await axios
        .delete(`${apiUrl}/watervalue/clear/${cameraID}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}


export async function UpdateWaterValueStatusById(id: string, meterValue?: number) {
    return await axios
        .patch(`${apiUrl}/watervalue/status/${id}`, { meterValue: meterValue }, authHeader()) // null สำหรับ body
        .then(res => res)
        .catch(e => e.response);
}

export async function UpdateWaterValueStatusToReJect(id: string, meterValue?: number) {
    return await axios
        .patch(`${apiUrl}/watervalue/status/reject/${id}`, { meterValue: meterValue }, authHeader()) // null สำหรับ body
        .then(res => res)
        .catch(e => e.response);
}

export async function DeleteWaterValueById(id: string) {
    return await axios
        .delete(`${apiUrl}/watervalue/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}
