import axios from "axios";

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export function authHeader() {
  const token = localStorage.getItem("token");
  const type = localStorage.getItem("token_type");
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `${type} ${token}`,
    },
  };
}

export async function GetGender() {
  return await axios
    .get(`${apiUrl}/genders`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetRoles() {
  return await axios
    .get(`${apiUrl}/roles`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}

export async function GetPositions() {
  return await axios
    .get(`${apiUrl}/positions`, authHeader())
    .then((res) => res)
    .catch((e) => e.response);
}