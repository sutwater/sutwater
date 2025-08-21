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
  Timestamp?: string;
  OCRConfidence?: number;
  CameraDevice?: CameraDeviceInterface;
  WaterMeterImage?: WaterMeterImageInterface;
  WaterUsageLog?: WaterLogInterface[];
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


