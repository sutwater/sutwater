import { GenderInterface } from "./Gender";

export interface UsersInterface {
  ID?: number;
  id?: number;
  first_name?: string;
  FirstName?: string;
  last_name?: string;
  LastName?: string;
  Email?: string;
  email?: string;
  Phone?: string;
  Age?: number;
  BirthDay?: string;
  GenderID?: number;
  gender_id?: number;
  role_id?: number;
  RoleID?: number;
  PositionID?: number;
  position_id?: number;
  Password?: string;
  LineUserID?: string;
  line_user_id?: string;
  Gender?: GenderInterface;
}