import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Gauge, MapPin, Wifi, ArrowUpCircle, ArrowDownCircle, Battery, Network, ArrowLeft, Bell, Droplet, Building2, Calendar, WifiOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { GetMeterLocationDetail, GetNotificationsByMeterLocation, CreateWaterMeterValue } from "../../services/https"
import { CameraDeviceInterface, NotificationInterface } from '../../interfaces/InterfaceAll';
import { message } from 'antd';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useAppContext } from '../../contexts/AppContext';

const WaterMonitoringDashboard: React.FC = () => {
  const { id } = useParams<{ id: string  }>();
  const [waterDetail, setWaterDetail] = useState<CameraDeviceInterface | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [notification, setNotification] = useState<NotificationInterface[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
const [addForm, setAddForm] = useState({
  date: "",
  time: "",
  meterValue: "",
  note: "",
  image: null as File | null,
});
const [addLoading, setAddLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  console.log("waterDetail: ", waterDetail)
  const [messageApi] = message.useMessage();
  const navigate = useNavigate();
  const { loading, setLoading, user } = useAppContext();
  
  

  const exportToExcel = () => {
  if (!waterDetail || !waterDetail.DailyWaterUsage || waterDetail.DailyWaterUsage.length === 0) {
    messageApi.open({ type: "warning", content: "ไม่มีข้อมูลให้ export" });
    return;
  }

  // เรียงจากวันที่น้อย → มาก
  const sortedUsage = [...waterDetail.DailyWaterUsage].sort((a, b) => {
    const dateA = a.Timestamp ? new Date(a.Timestamp).getTime() : 0;
    const dateB = b.Timestamp ? new Date(b.Timestamp).getTime() : 0;
    return dateA - dateB;
  });

  const data = sortedUsage.map((item) => {
    const itemDate = item.Timestamp ? new Date(item.Timestamp) : null;

    const meter = waterDetail.WaterMeterValue?.find(
      (wmv) =>
        wmv.Timestamp &&
        itemDate &&
        new Date(wmv.Timestamp).toLocaleDateString("th-TH") ===
          itemDate.toLocaleDateString("th-TH")
    );

    return {
      วันที่: itemDate ? itemDate.toLocaleDateString("th-TH") : "-",
      ปริมาณน้ำที่ใช้: item.Usage ?? "-", // fallback ถ้า Usage เป็น undefined
      ค่ามิเตอร์น้ำ: meter?.MeterValue ?? "-",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DailyWaterUsage");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `ข้อมูลปริมาณการใช้น้ำ_${waterDetail.MeterLocation?.Name || "Unknown"}.xlsx`);
};



  const mergedData: { [date: string]: any } = {};
  waterDetail?.DailyWaterUsage?.forEach((usage: any) => {
    if (!usage.Timestamp) return;

    const date = new Date(usage.Timestamp).toLocaleDateString("th-TH");

    if (!mergedData[date]) mergedData[date] = { date };

    // ใช้ key เป็น deviceID หรือ waterDetail.ID ก็ได้
    mergedData[date][`device_${waterDetail.ID}`] = usage.Usage;
  });

  // ดึงค่าจาก DailyWaterUsage แทน
const dailyUsages = waterDetail?.DailyWaterUsage
  ?.map(d => d.Usage) // เปลี่ยนเป็น field จริงที่เก็บปริมาณน้ำ
  .filter((v): v is number => v !== undefined) || [];

// ถ้ามีค่า
// กรองค่าที่เป็นตัวเลขจริง ๆ
const validUsages = dailyUsages.filter(u => typeof u === "number" && !isNaN(u));

const maxValue = validUsages.length > 0 ? Math.max(...validUsages) : null;
const minValue = validUsages.length > 0 ? Math.min(...validUsages) : null;
const avgValue = validUsages.length > 0
  ? validUsages.reduce((a, b) => a + b, 0) / validUsages.length
  : null;


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-2 shadow-md text-sm">
          <p className="font-semibold text-gray-700">
            วันที่: {new Date(label).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "2-digit",
            })}
          </p>

          {payload.map((p: any, index: number) => {
            let color = "#000";
            if (p.dataKey === "usage") color = "#3B82F6";
            if (p.dataKey === "avg") color = "#22c55e";
            if (p.dataKey === "max") color = "#ef4444";
            if (p.dataKey === "min") color = "#0ea5e9";

            return (
              <p key={index} className="flex items-center gap-2" style={{ color }}>
                <span>
                  {p.name === "ใช้น้ำ" && `ใช้น้ำ: ${p.value} ลบ.ม.`}
                  {p.dataKey === "avg" && `ค่าเฉลี่ย: ${p.value.toFixed(2)} ลบ.ม.`}
                  {p.dataKey === "max" && `ค่าสูงสุด: ${p.value} ลบ.ม.`}
                  {p.dataKey === "min" && `ค่าต่ำสุด: ${p.value} ลบ.ม.`}
                </span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };


  


  // เอาเฉพาะคนแก้ไขไม่ซ้ำ

  // const getMeterLocationDetailById = async () => {
  //   let res = await GetMeterLocationDetail(id);
  //   if (res.status == 200) {
  //     setWaterDetail(res.data);
  //   } else {
  //     setWaterDetail(null);
  //     messageApi.open({
  //       type: "error",
  //       content: res.data.error,
  //     });
  //   }
  // };

  const getNotificationById = async () => {
    try {
      if (!id) return;
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

  const getMeterLocationDetailById = async (startDate?: string, endDate?: string) => {
  try {
    const res = await GetMeterLocationDetail(id!, startDate, endDate);
    if (res.status === 200) {
      setWaterDetail(res.data);
    } else {
      setWaterDetail(null);
      messageApi.open({ type: "error", content: res.data.error });
    }
  } catch (error) {
    setWaterDetail(null);
    messageApi.open({ type: "error", content: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
  }
};

const onFinish = async (values: any) => {
  try {
    const payload = {
  Timestamp: values.Timestamp,
  MeterValue: values.MeterValue,
  Note: values.Note || "",
  CameraDeviceID: values.CameraDeviceID,
  UserID: values.UserID,
};



    const res = await CreateWaterMeterValue(payload);

    if (res.status === 200 || res.status === 201) {
      messageApi.open({ type: "success", content: "Create water meter value successfully" });
      return res.data;
    } else {
      messageApi.open({ type: "error", content: "Create water meter value error" });
      return null;
    }
  } catch (error: any) {
    console.error(error);
    messageApi.open({ type: "error", content: error.response?.data?.error || "เกิดข้อผิดพลาด" });
    return null;
  }
};



  const handleDateRangeChange = (
  dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
) => {
  if (!dates) {
    setDateRange([null, null]);
    setLoading(true);
    getMeterLocationDetailById().finally(() => setTimeout(() => setLoading(false), 1000)); // โหลดข้อมูลทั้งหมดเมื่อ clear
    return;
  }

  setDateRange(dates);

  if (dates[0] && dates[1]) {
    setLoading(true);
    getMeterLocationDetailById(
      dates[0].format("YYYY-MM-DD"),
      dates[1].format("YYYY-MM-DD")
    ).finally(() => setTimeout(() => {
  setLoading(false);
}, 1000));
  }
};



  useEffect(() => {
  const today = dayjs();
  const sevenDaysAgo = today.subtract(6, "day");

  setStartDate(sevenDaysAgo.format("YYYY-MM-DD"));
  setEndDate(today.format("YYYY-MM-DD"));
  setDateRange([sevenDaysAgo, today]);

  setLoading(true); // เริ่มแสดง spinner

  Promise.all([
    getMeterLocationDetailById(sevenDaysAgo.format("YYYY-MM-DD"), today.format("YYYY-MM-DD")),
    getNotificationById()
  ])
    .finally(() => {
      // เพิ่ม delay ให้ spinner หมุนอีก 0.5 วินาที
      setTimeout(() => setLoading(false), 1000);
    });
}, []);


  // Mapping dailyMeterData ให้ date และ value ถูกต้อง
  const dailyMeterData =
    waterDetail?.DailyWaterUsage
      ?.filter(item => item?.Timestamp && item?.Usage !== undefined)
      .map(item => ({
        date: new Date(item.Timestamp ?? Date.now()).toISOString().slice(0, 10), // YYYY-MM-DD
        usage: item.Usage,
        avg: avgValue ?? null,
        max: maxValue ?? null,
        min: minValue ?? null,
      })) || [];


  useEffect(() => {
    console.log("notification updated: ", notification);
  }, [notification]);

  // ฟังก์ชันสำหรับแสดงชื่อผู้แก้ไข
  const getUpdatedByNames = (waterUsageLog?: any[]) => {
  if (!waterUsageLog || waterUsageLog.length === 0) {
    return "ESP-32 Cam";
  }

  const names = waterUsageLog.map(log => {
    const user = log.User;
    if (user && user.ID && user.ID !== 0) {
      // ถ้ามีชื่อ
      if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
      if (user.first_name) return user.first_name;
      if (user.last_name) return user.last_name;
      return `UserID: ${user.ID}`;
    }
    // ถ้า ID = 0 หรือไม่มี user
    return "ESP-32 Cam";
  });

  // ลบชื่อซ้ำ
  const uniqueNames = Array.from(new Set(names));
  return uniqueNames.join(", ");
};


  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 lg:px-30 pb-20 overflow-auto">
      {loading && (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    )}
    {showAddModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
        onClick={() => setShowAddModal(false)}
      >
        ×
      </button>
      <h2 className="text-lg font-semibold mb-4">เพิ่มข้อมูลค่ามิเตอร์น้ำ</h2>
      <form
  onSubmit={async (e) => {
    e.preventDefault();
    setAddLoading(true);

    // รวม date + time เป็น Timestamp แบบ ISO 8601
    const timestamp = `${addForm.date}T${addForm.time}`;

    const payload = {
      Timestamp: timestamp,          // "YYYY-MM-DDTHH:mm"
      MeterValue: Number(addForm.meterValue), // แปลงเป็นตัวเลข
      Note: addForm.note || "",
      CameraDeviceID: Number(id),   // id ของ MeterLocation / CameraDevice
      UserID: user?.ID || 0,
    };

    const res = await onFinish(payload); // ส่งไปฟังก์ชัน Create API
    if (res) {
      setShowAddModal(false); // ปิด modal หลังสร้างเสร็จ
      // รีโหลดข้อมูลล่าสุด
      getMeterLocationDetailById(startDate, endDate);
    }

    setAddLoading(false);
  }}
>


        {/* ฟิลด์ต่าง ๆ เหมือนเดิม */}
        <div className="mb-3">
          <label className="block text-sm mb-1">วันที่</label>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={addForm.date}
            onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">เวลา</label>
          <input
            type="time"
            required
            className="w-full border rounded px-3 py-2"
            value={addForm.time}
            onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">ค่าที่อ่านได้ (ลบ.ม.)</label>
          <input
            type="number"
            required
            className="w-full border rounded px-3 py-2"
            value={addForm.meterValue}
            onChange={e => setAddForm(f => ({ ...f, meterValue: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">หมายเหตุ</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={addForm.note}
            onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={addLoading}
          className="w-full py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          {addLoading ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  </div>
)}

      {/* Header - Responsive */}
      
      <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 p-3 sm:p-4">
        
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Section */}
          <div className="flex flex-row items-center xs:flex-row xs:items-center gap-2 xs:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm text-gray-700 rounded-xl shadow-lg hover:bg-white/80 transition-all duration-300 border border-black/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">ย้อนกลับ</span>
            </button>
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-2xl shadow-xl">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-xl">{waterDetail?.MeterLocation?.Name ?? "ไม่ทราบชื่ออาคาร"}</span>
            </div>
          </div>

          {/* Right Section - Stack on mobile */}
          <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl shadow-md">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="hidden md:inline text-gray-700">{waterDetail?.MeterLocation?.Name ?? "ไม่ทราบชื่ออาคาร"}</span>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md backdrop-blur-sm ${
                waterDetail?.Wifi ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'
              }`}>
                {waterDetail?.Wifi ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="hidden md:inline">{waterDetail?.Wifi ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}</span>
              </div>
            </div>
        </div>
      </div>

      {/* Main Metrics - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Flow Meter Device */}
        <div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 tracking-tight">
  สรุปการใช้น้ำ
</h3>


  <div className="space-y-4">
    {/* ปริมาณน้ำมากที่สุด */}
    <div className="flex items-center gap-4">
      <ArrowUpCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm sm:text-base font-medium text-gray-600 uppercase tracking-wide">
          ปริมาณการใช้น้ำมากที่สุด
        </div>
        {/* <div className="text-xs text-gray-400 mt-1">อัปเดตล่าสุดเมื่อ 3 วันที่แล้ว</div> */}
      </div>
      <div className="text-right">
  {maxValue !== null ? (
    <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
      <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
        {maxValue.toFixed(2)}
      </span>
      <span className="text-base sm:text-lg font-semibold text-gray-500 ml-1">ลบ.ม.</span>
    </div>
  ) : (
    <div className="text-gray-400 italic text-lg sm:text-2xl">ไม่มีข้อมูล</div>
  )}
</div>
    </div>

    {/* ปริมาณน้ำต่ำที่สุด */}
    <div className="flex items-center gap-4">
      <ArrowDownCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm sm:text-base font-medium text-gray-600 uppercase tracking-wide">
          ปริมาณการใช้น้ำน้อยที่สุด
        </div>
      </div>
      <div className="text-right">
  {minValue !== null ? (
    <div className="text-2xl sm:text-3xl font-extrabold text-teal-600">
      <span className="bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
        {minValue.toFixed(2)}
      </span>
      <span className="text-base sm:text-lg font-semibold text-gray-500 ml-1">ลบ.ม.</span>
    </div>
  ) : (
    <div className="text-gray-400 italic text-lg sm:text-2xl">ไม่มีข้อมูล</div>
  )}
</div>
    </div>

    {/* ปริมาณน้ำเฉลี่ย */}
    <div className="flex items-center gap-4">
      <Gauge className="w-6 h-6 text-indigo-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm sm:text-base font-medium text-gray-600 uppercase tracking-wide">
          ปริมาณการใช้น้ำโดยเฉลี่ย
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
  {avgValue !== null ? (
    <div>
      <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
      {avgValue.toFixed(2)}
    </span>
    <span className="text-base sm:text-lg font-semibold text-gray-500 ml-1">ลบ.ม.</span>
    </div>
    
  ) : (
    <span className="text-gray-400 italic">ไม่มีข้อมูล</span>
  )}
  
</div>


    </div>
  </div>
</div>


        {/* Cumulative Data */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-row sm:flex-col md:flex-row justify-around gap-4 sm:gap-6">
            {/* Water Data */}
            <div className="flex flex-col items-center bg-blue-50 rounded-lg p-3 sm:p-4 flex-1 sm:w-40 hover:shadow-md transition-shadow duration-200">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full mb-2">
                <Droplet className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="text-xl sm:text-3xl font-bold text-blue-600">
                {waterDetail?.WaterMeterValue && waterDetail.WaterMeterValue.length > 0
                  ? waterDetail.WaterMeterValue.length
                  : "ไม่มี"}

              </div>
              <div className="text-xs sm:text-base text-gray-500 mt-1 text-center">จำนวนข้อมูล</div>
            </div>

            {/* Notifications */}
            <div className="flex flex-col items-center bg-red-50 rounded-lg p-3 sm:p-4 flex-1 sm:w-40 hover:shadow-md transition-shadow duration-200">
              <div className="bg-red-100 p-2 sm:p-3 rounded-full mb-2">
                <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="text-xl sm:text-3xl font-bold text-red-600">
                {notification && notification.length > 0 ? notification.length : "ไม่มี"}
              </div>
              <div className="text-xs sm:text-base text-gray-500 mt-1 text-center">การแจ้งเตือน</div>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-2xl font-semibold text-gray-800">ข้อมูลมิเตอร์</h3>
          </div>

          <div className="space-y-4">
            {/* Mac Address */}
            <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-500" />
                <span className="text-sm sm:text-base text-gray-600">Mac Address</span>
              </div>
              <div className="text-sm sm:text-base font-semibold text-gray-800 break-all text-right">
                {waterDetail?.MacAddress || "ไม่มีข้อมูล"}
              </div>
            </div>

            {/* Battery */}
            <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-yellow-500" />
                <span className="text-sm sm:text-base text-gray-600">แบตเตอรี่</span>
              </div>
              <div className="text-sm sm:text-base font-semibold text-gray-800 text-right">
                {waterDetail?.Battery ? `${waterDetail.Battery}%` : "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Chart Section - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h3 className="text-base sm:text-2xl font-semibold">ปริมาณการใช้น้ำ</h3>
          {/* Date Range Picker - Mobile Responsive */}
          {/* <div className="w-full sm:w-auto">
            <input 
              type="date" 
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" 
              defaultValue="2024-01-01"
            />
          </div> */}

          <div className="flex items-center w-full sm:w-auto ">
            {/* Start Date */}
            <div className="relative w-full sm:w-auto bg-white ">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ">
                <Calendar className="w-4 h-4 text-gray-500 " />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStart = dayjs(e.target.value);
                  setStartDate(e.target.value);
                  if (newStart && endDate) {
                    handleDateRangeChange([newStart, dayjs(endDate)]);
                  }
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
             focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 "
              />
            </div>

            <span className="mx-4 text-gray-500">ถึง</span>

            {/* End Date */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Calendar className="w-4 h-4 text-gray-500 " />
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const newEnd = dayjs(e.target.value);
                  setEndDate(e.target.value);
                  if (startDate && newEnd) {
                    handleDateRangeChange([dayjs(startDate), newEnd]);
                  }
                }}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
             focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              />
            </div>
          </div>
        </div>

        {dailyMeterData.length === 0 ? (
          <div className="text-gray-500 text-center h-64 flex items-center justify-center">
            ไม่พบข้อมูลการใช้น้ำในช่วงเวลาที่เลือก กรุณาเลือกช่วงเวลาใหม่
          </div>
        ) : (
          /* Chart Container - Scrollable on mobile */
          <div className="h-64 sm:h-72 w-full overflow-x-auto">
            <div
              className="h-full"
              style={{ width: `${dailyMeterData.length * 60}px`, minWidth: "100%" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyMeterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    name="ใช้น้ำ"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  {avgValue !== null && (
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#FF0000"
                      strokeWidth={2}
                      dot={false}
                      name="ค่าเฉลี่ย"
                    />
                  )}
                  {maxValue !== null && (
                    <Line
                      type="monotone"
                      dataKey="max"
                      name="ค่าสูงสุด"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {minValue !== null && (
                    <Line
                      type="monotone"
                      dataKey="min"
                      name="ค่าต่ำสุด"
                      stroke="#0ea5e9"
                      strokeDasharray="4 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart Legend - Mobile friendly */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>การใช้น้ำ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>ค่าเฉลี่ย</span>
          </div>
        </div>
      </div>

      {/* Data Table - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
  {/* Header */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
    <h3 className="text-lg sm:text-2xl font-semibold text-gray-800">
      ข้อมูลค่ามิเตอร์
    </h3>
     <div className="flex gap-2">
    <button
      onClick={exportToExcel}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm sm:text-base cursor-pointer"
    >
      นำข้อมูลออกเป็น Excel
    </button>
    <button
      onClick={() => setShowAddModal(true)}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm sm:text-base cursor-pointer"
    >
      เพิ่มข้อมูล
    </button>
  </div>
  </div>
  

  {/* Image Zoom Overlay */}
  {selectedImage && (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={() => setSelectedImage(null)}
    >
      <img
        src={selectedImage}
        alt="zoomed"
        className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
      />
    </div>
  )}

  {/* Mobile Card Layout */}
  <div className="block sm:hidden space-y-3">
    {waterDetail?.WaterMeterValue?.map((wmv, index) => (
      <div
        key={index}
        className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-medium text-gray-900">
            {wmv.Timestamp
              ? new Date(wmv.Timestamp).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "2-digit",
                })
              : "-"}
          </div>
          <div className="text-sm text-blue-600 font-semibold">{wmv.MeterValue} ลบ.ม.</div>
        </div>
        <div className="text-xs text-gray-500 mb-3">
          แก้ไขโดย: {getUpdatedByNames(wmv.WaterUsageLog)}
        </div>
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs sm:text-sm transition-colors">
            แก้ไข
          </button>
        </div>
      </div>
    ))}
  </div>

  {/* Desktop Table */}
  {waterDetail?.WaterMeterValue && waterDetail.WaterMeterValue.length > 0 ? (
    <div className="hidden sm:block overflow-x-auto max-h-[800px] overflow-y-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="text-left p-3 font-medium text-gray-600">วัน/เดือน/ปี</th>
            <th className="text-left p-3 font-medium text-gray-600">เวลา</th>
            <th className="text-left p-3 font-medium text-gray-600">รูปภาพ</th>
            <th className="text-left p-3 font-medium text-gray-600">ค่าที่อ่านได้</th>
            <th className="text-left p-3 font-medium text-gray-600">หมายเหตุ</th>
            <th className="text-left p-3 font-medium text-gray-600">การจัดการ</th>
            {/* <th className="text-left p-3 font-medium text-gray-600">แก้ไขโดย</th> */}
          </tr>
        </thead>
        <tbody>
          {waterDetail.WaterMeterValue.map((wmv, index) => (
            <tr
              key={index}
              className="border-t last:border-b hover:bg-gray-50 transition-colors"
            >
              <td className="p-3 text-gray-800">
                {wmv.Timestamp
                  ? new Date(wmv.Timestamp).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                    })
                  : "-"}
              </td>
              <td className="p-3 text-gray-800">
                {wmv.Timestamp
                  ? new Date(wmv.Timestamp).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-"}
              </td>
              <td className="p-3">
                {wmv.WaterMeterImage?.ImagePath ? (
                  <img
                    src={`http://localhost:8000/${wmv.WaterMeterImage.ImagePath}`}
                    alt="water meter"
                    className="w-28 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() =>
                      setSelectedImage(`http://localhost:8000/${wmv.WaterMeterImage?.ImagePath}`)
                    }
                  />
                ) : (
                  <span className="text-gray-400 italic">ไม่มีรูป</span>
                )}
              </td>
              <td className="p-3 text-gray-800 font-medium">{wmv.MeterValue} ลบ.ม.</td>
              <td className="p-3 text-gray-800">{wmv.Note || "-"}</td>
              <td className="p-3">
                <button className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  แก้ไข
                </button>
              </td>
              {/* <td className="p-3 text-gray-800">{getUpdatedByNames(wmv.WaterUsageLog)}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="text-gray-500 text-center mt-6 italic">ไม่พบข้อมูลมิเตอร์ในช่วงเวลาที่เลือก กรุณาเลือกช่วงเวลาใหม่</div>
      )}
    </div>

    </div>
  );
};

export default WaterMonitoringDashboard;