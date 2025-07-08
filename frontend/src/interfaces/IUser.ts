import { GenderInterface } from "./Gender";

export interface UsersInterface {
  ID?: number;
  FirstName?: string;
  LastName?: string;
  Email?: string;
  Phone?: string;
  Age?: number;
  BirthDay?: string;
  GenderID?: number;
  Password?: string;

  // เพิ่มเพื่อให้แสดงเพศได้จาก relation ที่ preload จาก backend
  Gender?: GenderInterface;
}