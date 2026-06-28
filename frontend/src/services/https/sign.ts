import axios from "axios";
import { authHeader } from "./api";
import { UsersInterface } from "../../interfaces/IUser";
import { LogInInterface } from "../../interfaces/IAuth";
import { ForgotPasswordInterface } from "../../interfaces/IAuth";
import { ChangePasswordInterface } from "../../interfaces/IAuth";
import { AuthLoginResponse } from "../../interfaces/IAuth";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function LogIn(data: LogInInterface) {
  return await axios
    .post<AuthLoginResponse>(`${apiUrl}/auth/login`, data)
    .then((res) => res)
    .catch((e: { response: unknown }) => e.response);
}

export async function Register(data: UsersInterface) {
  return await axios
    .post(`${apiUrl}/auth/register`, data, authHeader())
    .then((res) => res)
    .catch((e: { response: unknown }) => e.response);
}

export async function ForgotPasswordAPI(data: ForgotPasswordInterface) {
  return await axios
    .post(`${apiUrl}/auth/forgot-password`, data)
    .then((res) => res)
    .catch((e: { response: unknown }) => e.response);
}

export async function ChangePassword(userId: string | number, data: ChangePasswordInterface
) {
  return await axios
    .put(`${apiUrl}/users/${userId}/change-password`, data, authHeader())
    .then((res) => res)
    .catch((e: { response: unknown }) => e.response);
}
