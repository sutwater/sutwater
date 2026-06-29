import axios from "axios";
import { authHeader } from "./api";
import { UsersInterface } from "../../interfaces/IUser";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function GetUsers() {
    return await axios
        .get(`${apiUrl}/users`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function GetUsersById(id: string) {
    return await axios
        .get(`${apiUrl}/users/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function UpdateUsersById(id: string, data: UsersInterface) {
    return await axios
        .put(`${apiUrl}/users/${id}`, data, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function DeleteUsersByAdmin() {
    return await axios
        .delete(`${apiUrl}/users/me`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function DeleteUsersById(id: string) {
    return await axios
        .delete(`${apiUrl}/users/${id}`, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}

export async function UpdateUserAssignment(id: string, data: { role_id: number; position_id?: number | null }) {
    return await axios
        .put(`${apiUrl}/users/${id}/assignment`, data, authHeader())
        .then((res) => res)
        .catch((e) => e.response);
}
