import axios from "axios";
import { authHeader } from "./api";
import { UsersInterface } from "../../interfaces/IUser";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function GetUsers() {
    return await axios
        .get(`${apiUrl}/user`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function GetUsersById(id: string) {
    return await axios
        .get(`${apiUrl}/user/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function UpdateUsersById(id: string, data: UsersInterface) {
    return await axios
        .put(`${apiUrl}/user/${id}`, data, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function DeleteUsersById(id: string) {
    return await axios
        .delete(`${apiUrl}/user/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}
