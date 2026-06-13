import axios, { AxiosError } from "axios";
import { authHeader } from "./api";

const apiUrl = import.meta.env.VITE_API_BASE_URL;


export async function fetchCameraDevice() {
    return await axios
        .get(`${apiUrl}/cameradevices`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function fetchCameraDeviceWithoutMac() {
    return await axios
        .get(`${apiUrl}/cameradevices/without-mac`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function fetchCameraDeviceByID(id: string) {
    return await axios
        .get(`${apiUrl}/cameradevice/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function CreateCameraDevice(formData: FormData) {
    try {
        const res = await axios.post(`${apiUrl}/cameradevice`, formData, {
            headers: {
                ...authHeader().headers,
                "Content-Type": "multipart/form-data",
            },
        });
        return res;
    } catch (e) {
        const error = e as AxiosError;
        return error.response;
    }
}

export async function UpdateCameraDevice(id: string, formData: FormData) {
    try {
        return await axios.patch(`${apiUrl}/cameradevice/${id}`, formData, {
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

export async function updateCameraDeviceMacAddress(id: string, macAddress: string) {
    try {
        return await axios.put(
            `${apiUrl}/cameradevice/macaddress/${id}`,
            { MacAddress: macAddress },
            authHeader()
        );
    } catch (e) {
        const error = e as AxiosError;
        return error.response;
    }
}

export async function deleteCameraDeviceByMeterLocationId(id: string) {
    return await axios
        .delete(`${apiUrl}/cameradevice/${id}`, authHeader())

        .then((res) => res)
        .catch((e) => e.response);
}

