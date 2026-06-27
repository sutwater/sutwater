import axios from "axios";
import { authHeader } from "./api";
import { UsersInterface } from "../../interfaces/IUser";
import { SignInInterface } from "../../interfaces/SignIn";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export interface AuthUserPayload {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  gender_id: number;
  position_id: number;
  profile_image: string;
  birthday: string;
}

export interface AuthLoginResponse {
  success: boolean;
  data: {
    token: string;
    user: AuthUserPayload;
  };
}

export async function SignIn(data: SignInInterface) {
  return await axios
    .post<AuthLoginResponse>(`${apiUrl}/auth/login`, data)
    .then((res) => res)
    .catch((e: { response: unknown }) => e.response);
}

export async function SignUp(data: UsersInterface) {
  return await axios
    .post(`${apiUrl}/auth/register`, data, authHeader())
    .then((res) => res)
    .catch((e: { response: unknown }) => e.response);
}
