import { GenderInterface } from "./Gender";

export interface UsersInterface {
  ID?: number;
  first_name?: string;
  FirstName?: string;
  last_name?: string;
  LastName?: string;
  Email?: string;
  Phone?: string;
  Age?: number;
  BirthDay?: string;
  GenderID?: number;
  Password?: string;
  LineUserID?: string;
  line_user_id?: string;
  isAdmin?: boolean;

  // เพิ่มเพื่อให้แสดงเพศได้จาก relation ที่ preload จาก backend
  Gender?: GenderInterface;
}