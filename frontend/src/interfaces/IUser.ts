import { GenderInterface } from "./Gender";

export interface UsersInterface {
  ID?: number;
  first_name?: string;
  last_name?: string;
  Email?: string;
  Phone?: string;
  Age?: number;
  BirthDay?: string;
  GenderID?: number;
  Password?: string;

  // เพิ่มเพื่อให้แสดงเพศได้จาก relation ที่ preload จาก backend
  Gender?: GenderInterface;
}