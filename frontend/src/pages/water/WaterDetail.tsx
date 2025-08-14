import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Gauge , MapPin, Wifi, ArrowUpCircle, ArrowDownCircle, Battery, Network, ArrowLeft, Clock, Bell, Droplet, Building2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { GetMeterLocationDetail, GetNotificationsByMeterLocation } from "../../services/https"
import { MeterLocationInterface, NotificationInterface } from '../../interfaces/InterfaceAll';
import { message } from 'antd';


const WaterMonitoringDashboard: React.FC = () => {
  const { id } = useParams<{ id: any }>();
  const [waterDetail, setWaterDetail] = useState<MeterLocationInterface | null>(null);
  const [notification, setNotification] = useState<NotificationInterface[]>([]);

  console.log("notofication: ",notification)
  const [messageApi] = message.useMessage();
  const navigate = useNavigate();

  interface DailyData {
  date: string;
  values: number[];       
  updatedBy: string[];     
}

  const dailyData: DailyData[] = [];

  waterDetail?.CameraDevice?.[0]?.WaterMeterValue?.forEach(wmv => {
    if (!wmv.Timestamp || wmv.MeterValue === undefined) return;

    const date = wmv.Timestamp.slice(0, 10); 
    let day = dailyData.find(d => d.date === date);

    // รวมข้อมูลคนแก้ไขจาก WaterUsageLog
    const users = wmv.WaterUsageLog?.map(log => 
      log.User ? `${log.User.first_name} ${log.User.last_name}` : `UserID:${log.ID}`
    ) || [];

    if (day) {
      day.values.push(wmv.MeterValue);
      day.updatedBy.push(...users);
    } else {
      dailyData.push({
        date,
        values: [wmv.MeterValue],
        updatedBy: users
      });
    }
  });

  // เอาเฉพาะคนแก้ไขไม่ซ้ำ
  dailyData.forEach(day => {
    day.updatedBy = Array.from(new Set(day.updatedBy));
  });

  console.log("waterdetail: ",waterDetail )
  const getMeterLocationDetailById = async () => {
      let res = await GetMeterLocationDetail(id);
      if (res.status == 200) {
        setWaterDetail(res.data);
      } else {
        setWaterDetail(null);
        messageApi.open({
          type: "error",
          content: res.data.error,
        });
      }
    };

    const getNotificationById = async () => {
      try {
        let res = await GetNotificationsByMeterLocation(id);
        console.log("API response: ", res.data); 
        if (res.status == 200) {
          setNotification(res.data);
        } else {
          setNotification([]);
          messageApi.open({
            type: "error",
            content: res.data.error,
          });
        }
      } catch (error) {
        console.error("Error fetching notification:", error);
      }
    };


  useEffect(() => {
    
    getMeterLocationDetailById();
    getNotificationById();
  }, []);

  const dailyMeterData = waterDetail?.CameraDevice?.[0]?.WaterMeterValue
  ?.filter(item => item.Timestamp !== undefined && item.MeterValue !== undefined)
  .reduce((acc: any[], item) => {
    const date = item.Timestamp!.slice(0, 10); // ! บอก TS ว่ามีค่าแน่นอน
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.value += item.MeterValue!;
    } else {
      acc.push({ date, value: item.MeterValue! });
    }
    return acc;
  }, []) || [];

  useEffect(() => {
  console.log("notification updated: ", notification);
}, [notification]);

  // ฟังก์ชันสำหรับแสดงชื่อผู้แก้ไข
  const getUpdatedByNames = (waterUsageLog?: any[]) => {
    console.log("waterUsageLog:", waterUsageLog); 
    
    if (!waterUsageLog || waterUsageLog.length === 0) {
      return "ESP-32 Cam";
    }
    
    const names = waterUsageLog.map(log => {
      console.log("log:", log); // ดูโครงสร้างของแต่ละ log
      console.log("log.Users:", log.Users);
      
      // ใช้ Users แทน User
      if (log.Users && log.Users.first_name && log.Users.last_name) {
        return `${log.Users.first_name} ${log.Users.last_name}`;
      } else if (log.Users && log.Users.first_name) {
        return log.Users.first_name;
      } else if (log.Users && log.Users.last_name) {
        return log.Users.last_name;
      } else if (log.UserID) {
        return `UserID: ${log.UserID}`;
      } else {
        return `ID: ${log.ID || log.id}`;
      }
    });
    
    // เอาชื่อที่ไม่ซ้ำ
    const uniqueNames = Array.from(new Set(names));
    return uniqueNames.join(", ");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-30 pb-20 overflow-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <button
        onClick={() => navigate(-1)} // กลับหน้าก่อนหน้า
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg shadow-sm hover:bg-gray-200 hover:shadow transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับ</span>
      </button>
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-all">
    <Building2 className="w-5 h-5" />
    <span className="font-semibold">{waterDetail?.Name ?? "ไม่ทราบชื่ออาคาร"}</span>
  </div>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 text-gray-600">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">ที่มิเตอร์อยู่: {waterDetail?.Name}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <Wifi className="w-4 h-4" />
        <span className="text-sm">
          สถานะ Wi-Fi: ({waterDetail?.CameraDevice?.[0]?.Wifi ? "เชื่อมต่อ" : "ไม่ได้เชื่อมต่อ"})
        </span>
      </div>
    </div>
  </div>
</div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Flow Meter Device */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-500">ค่าที่อ่านได้มากที่สุด</div>
                <div className="text-xs text-gray-400">อัปเดตล่าสุดเมื่อ 3 วันที่แล้ว</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold">{waterDetail?.CameraDevice?.[0]?.WaterMeterValue?.[0]?.MeterValue
                                                      ? `${waterDetail.CameraDevice[0].WaterMeterValue[0].MeterValue} ลูกบาศก์เมตร`
                                                      : "ไม่มีข้อมูล"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ArrowDownCircle   className="w-5 h-5 text-teal-500" />
              <div>
                <div className="text-sm text-gray-500">ค่าที่อ่านได้น้อยที่สุด</div>
                <div className="text-xs text-gray-400">อัปเดตล่าสุดเมื่อ 5 วันที่แล้ว</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold">{waterDetail?.CameraDevice?.[0]?.WaterMeterValue?.[0]?.MeterValue
                                                      ? `${1296} ลูกบาศก์เมตร`
                                                      : "ไม่มีข้อมูล"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Gauge  className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-500">ค่าเฉลี่ยนที่อ่านได้</div>
                <div className="text-xs text-gray-400">อัปเดตล่าสุดเมื่อ 3 วันที่แล้ว</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold">{waterDetail?.CameraDevice?.[0]?.WaterMeterValue?.[0]?.MeterValue
                                                      ? `${waterDetail.CameraDevice[0].WaterMeterValue[0].MeterValue} ลูกบาศก์เมตร`
                                                      : "ไม่มีข้อมูล"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cumulative Data */}
        <div className="bg-white rounded-xl shadow-lg p-6">
  {/* หัวข้อ */}
  {/* <h3 className="text-xl font-semibold text-gray-800 mb-4">รายละเอียด</h3> */}

  {/* Content */}
  <div className="flex flex-col md:flex-row justify-around gap-6">
    {/* Water Data */}
    <div className="flex flex-col items-center bg-blue-50 rounded-lg p-4 w-40 hover:shadow-md transition-shadow duration-200">
      <div className="bg-blue-100 p-3 rounded-full mb-2">
        <Droplet className="w-6 h-6 text-blue-600" />
      </div>
      <div className="text-3xl font-bold text-blue-600">
        {waterDetail?.CameraDevice && waterDetail.CameraDevice.length > 0
          ? waterDetail.CameraDevice.reduce(
              (total, cam) => total + (cam.WaterMeterValue?.length || 0),
              0
            )
          : "ไม่มี"}
      </div>
      <div className="text-sm text-gray-500 mt-1">จำนวนข้อมูล</div>
    </div>

    {/* Notifications */}
    <div className="flex flex-col items-center bg-red-50 rounded-lg p-4 w-40 hover:shadow-md transition-shadow duration-200">
      <div className="bg-red-100 p-3 rounded-full mb-2">
        <Bell className="w-6 h-6 text-red-600" />
      </div>
      <div className="text-3xl font-bold text-red-600">
        {notification && notification.length > 0 ? notification.length : "ไม่มี"}
      </div>
      <div className="text-sm text-gray-500 mt-1">การแจ้งเตือน</div>
    </div>
  </div>
</div>



        {/* Daily Consumption Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">ข้อมูลมิเตอร์</h3>
          
          </div>
          <div className="flex items-center gap-3">
              <Network  className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-xl text-gray-500">MacAdress:</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold">{waterDetail?.CameraDevice?.[0]?.MacAddress
                                                      ? `${waterDetail?.CameraDevice?.[0]?.MacAddress}`
                                                      : "ไม่มีข้อมูล"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Battery className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-xl text-gray-500">แบตเตอรี่:</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold">{waterDetail?.CameraDevice?.[0]?.Battery
                                                      ? `${waterDetail?.CameraDevice?.[0]?.Battery} %`
                                                      : "ไม่มีข้อมูล"}
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Velocity Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">ค่ามิเตอร์น้ำ</h3>
            <div className="text-sm text-gray-500"></div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyMeterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#666" />
              <YAxis tick={{ fontSize: 12 }} stroke="#666" />
              
              <Tooltip 
                formatter={(value: any) => `${value} ลูกบาศก์เมตร`} 
                labelFormatter={(label: string) => `วันที่: ${label}`} 
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="#3B82F6"
                fillOpacity={0.1}
                dot={{ r: 4 }} // ขนาดจุด
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
        {/* แจ้งเตือน */}
        <div className="bg-white rounded-lg shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">การแจ้งเตือน</h3>
    <div className="text-sm text-gray-500"></div>
  </div>

  <div className="h-64 overflow-auto">
    {notification?.length === 0 ? (
      <div className="text-gray-500 text-center mt-6">ไม่มีการแจ้งเตือน</div>
    ) : (
       notification.map((n, idx) => (
      <div
  key={idx}
  className="p-4 mb-4 rounded-lg border transition-all duration-200 cursor-pointer group hover:bg-gray-50"
>
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 mt-1"></div>
    <div className="flex-1 min-w-0">
      <p className="text-gray-800 font-medium leading-relaxed mb-2">
        {n.Message}
      </p>
      {n.CreatedAt && (
        <div className="flex items-center text-xs text-gray-500 space-x-2">
          <Clock className="w-3 h-3" />
          <span>{new Date(n.CreatedAt).toLocaleString("th-TH")}</span>
        </div>
      )}
    </div>
  </div>
</div>

    ))
    )}
  </div>
</div>



      </div>

      {/* Data Table */}
    {/* Data Table */}
<div className="bg-white rounded-lg shadow-sm p-6">
  <div className="flex items-center justify-between mb-4 overflow-auto">
    <h3 className="text-lg font-semibold">ข้อมูลค่ามิเตอร์ที่อ่านได้</h3>
    <button
      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
      onClick={() => console.log("เพิ่มข้อมูลใหม่")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      เพิ่มข้อมูล
    </button>
  </div>

  {waterDetail?.CameraDevice?.[0]?.WaterMeterValue &&
  waterDetail.CameraDevice[0].WaterMeterValue.length > 0 ? (
    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 font-medium text-gray-600">วัน/เดือน/ปี</th>
            <th className="text-left p-3 font-medium text-gray-600">ค่าที่อ่านได้</th>
            <th className="text-left p-3 font-medium text-gray-600">แก้ไขโดย</th>
            <th className="text-left p-3 font-medium text-gray-600">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {waterDetail.CameraDevice[0].WaterMeterValue.map((wmv, index) => (
            <tr key={index} className="border-t hover:bg-gray-50">
              <td className="p-3 text-gray-800">
                {wmv.Timestamp
                  ? new Date(wmv.Timestamp).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                    })
                  : "-"}
              </td>
              <td className="p-3 text-gray-800">{wmv.MeterValue} ลูกบาศก์เมตร</td>
              <td className="p-3 text-gray-800">
                {getUpdatedByNames(wmv.WaterUsageLog)}
              </td>
              <td className="p-3 text-gray-800 flex gap-2">
                <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">แก้ไข</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="text-gray-500 text-center mt-6">ไม่มีข้อมูลมิเตอร์ล่าสุด</div>
  )}
</div>

    </div>
  );
};

export default WaterMonitoringDashboard;