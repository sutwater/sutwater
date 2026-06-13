import axios from "axios";
import { authHeader } from "./api";
import { UsersInterface } from "../../interfaces/IUser";
import { SignInInterface } from "../../interfaces/SignIn";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export async function SignIn(data: SignInInterface) {
  return await axios
    .post(`${apiUrl}/signin`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function SignUp(data: UsersInterface) {
  return await axios
    .post(`${apiUrl}/signup`, data, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}