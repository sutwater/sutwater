export interface LogInInterface {
  email: string;
  password: string;
}

export interface ForgotPasswordInterface {
  email: string;
  old_password: string;
  new_password: string;
}

export interface ChangePasswordInterface {
  old_password: string;
  new_password: string;
}

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
