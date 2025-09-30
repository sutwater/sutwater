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

export interface WaterValueStatus {
  ID: number;
  Name: string;
  Description: string;
  WaterMeterValue?: WaterMeterValueInterface[];
}

export interface GenderInterface {
  ID?: number;

  gender?: string;
}

export interface MeterLocationInterface {
  ID?: number;
  Name: string;
  Latitude: number;
  Longitude: number;
  CameraDevice?: CameraDeviceInterface[]; 
  DailyWaterUsage?: DailyWaterUsageInterface[];
}

export interface CameraDeviceInterface {
  ID?: number;
  MacAddress?: string;
  Battery?: number;
  Wifi?: boolean;
  Status?: boolean;
  MeterLocation?: MeterLocationInterface;
  WaterMeterValue?: WaterMeterValueInterface[]; 
  DailyWaterUsage?: DailyWaterUsageInterface[]; 
  User?: UsersInterface[]; 
}

export interface CameraDeviceSaveInterface {
  ID?: number;
  MacAddress?: string;
  Password?: string;
  MeterLocationID?: number;
}

export interface WaterLogInterface {
  ID?: number;
  AverageValue?: number;
  MinValue?: number;
  MaxValue?: number;
  BrokenAmount?: number;
  User?: UsersInterface;
  WaterMeterValue?: WaterMeterValueInterface;
}

export interface WaterMeterValueInterface {
  ID?: number;
  MeterValue?: number;
  StatusID?: number;
  Timestamp?: string;
  Time?: string;
  Date?: string;
  Note?: string;
  ImagePath?: string;
  ModelConfidence?: number;
  CameraDevice?: CameraDeviceInterface;
  WaterUsageLog?: WaterLogInterface[];
  User: UsersInterface; // ✅ เพิ่ม relation กับ Users
}

export interface WaterMeterValueSaveInterface {
  ID?: number;
  Date?: string;
  Time?: string;
  MeterValue?: number;
  Note?: string;
  ImagePath?: string;
  ModelConfidence: number;
  CameraDeviceID?: number;
  UserID: number; // ✅ เพิ่ม relation กับ Users
}

export interface WaterDetailInterface {
  ID?: number;
  MacAddress?: string;
  Battery?: number;
  BrokenAmount?: number;
  CreatedAt?: string;
  Note?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;
  MeterLocation?: MeterLocationInterface;   // ✅ มี MeterLocation ซ้อนอยู่
  CameraDevice?: CameraDeviceInterface | null;
  DailyWaterUsage?: DailyWaterUsageInterface[];
}


export interface DailyWaterUsageInterface {
  ID?: number;
  Usage?: number;
  Timestamp?: string;
  CameraDevice?: CameraDeviceInterface;
}


export interface WaterMeterImageInterface {
  ID?: number;
  ImagePath?: string;
}

export interface NotificationInterface {
  ID: number;
  Message?: string;
  IsRead?: boolean;
  CameraDeviceID?: number;
  CameraDevice?: CameraDeviceInterface; // relation กับ CameraDevice
  CreatedAt?: string;   
  UpdatedAt?: string;
}

export interface DashboardStats {
  totalReadings: number;
  pendingVerification: number;
  verifiedToday: number;
  averageConfidence: number;
  activeDevices: number;
}

export type StatusType = 'รอการอนุมัติ' | 'อนุมัติ' ;


