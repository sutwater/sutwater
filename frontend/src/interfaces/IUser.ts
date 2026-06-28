import { GenderInterface } from "./Gender";

export interface UsersInterface {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  Age?: number;
  gender_id?: number;
  role_id?: number;
  position_id?: number;
  Password?: string;
  Gender?: GenderInterface;
}