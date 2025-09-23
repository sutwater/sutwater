import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { MapPin, Wifi, ArrowLeft, Droplet, Building2, Calendar, WifiOff, Plus, Download, Edit, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { GetMeterLocationDetail, GetNotificationsByMeterLocation, CreateWaterMeterValue, fetchWaterValueReqByCameraId } from "../../services/https"
import { CameraDeviceInterface, NotificationInterface, WaterMeterValueSaveInterface, WaterMeterValueInterface } from '../../interfaces/InterfaceAll';
import { message } from 'antd';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useAppContext } from '../../contexts/AppContext';
import { DataTable } from '../../components/waterreq/DataTable';
//import { useMockData } from '../../components/waterreq/useMockData';
import { ImageModal } from '../../components/waterreq/ImageModal';


const WaterMonitoringDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [waterDetail, setWaterDetail] = useState<CameraDeviceInterface | null>(null);
  const [waterReq, setWaterReq] = useState<WaterMeterValueInterface | null>(null);
  //const { data, stats, verifyReading, rejectReading } = useMockData();
  const [selectedImage, setSelectedImage] = useState<string>('');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationInterface[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  console.log(waterDetail)
  const { loading, setLoading, user } = useAppContext();
  const [waterValue, setWaterValue] = useState<Partial<WaterMeterValueSaveInterface>>({
    Date: "",
    Time: "",
    MeterValue: 0,
    ModelConfidence: 100,
    Note: "",
    ImagePath: "",
  });
  console.log("CameraID: ", id?.toString())
  
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
    mergedData[date][`device_${waterDetail.ID}`] = usage.Usage;
  });

  // ดึงค่าจาก DailyWaterUsage แทน
  const dailyUsages = waterDetail?.DailyWaterUsage
    ?.map(d => d.Usage) // เปลี่ยนเป็น field จริงที่เก็บปริมาณน้ำ
    .filter((v): v is number => v !== undefined) || [];
  const validUsages = dailyUsages.filter(u => typeof u === "number" && !isNaN(u));
  const avgValue = validUsages.length > 0
    ? validUsages.reduce((a, b) => a + b, 0) / validUsages.length
    : null;

  const safeAvg = avgValue ?? 0; // ถ้า null จะใช้ 0 แทน
  const maxValue = (safeAvg + 5).toFixed(2);
  const minValue = Math.max(0, safeAvg - 5);

  const handleInputChange = (field: keyof WaterMeterValueSaveInterface, value: string | number) => {
    setWaterValue((prev) => ({
      ...prev,
      [field]: value,
    }));

    // ล้าง error เมื่อผู้ใช้เริ่มพิมพ์
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-gray-800 mb-2">
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
              <p key={index} className="flex items-center gap-2 text-sm" style={{ color }}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
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
  const handleViewImage = (imagePath: string) => {
    setSelectedImage(imagePath);
    setIsImageModalOpen(true);
  };

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

  const loadWaterValueReq = async () => {
  try {
    const res = await fetchWaterValueReqByCameraId(id!);
    console.log("res: ", res.data);

    if (res.status === 200) {
      setWaterReq(res.data.data); // ✅ เก็บเฉพาะ array
    } else {
      setWaterReq(null);
      messageApi.open({ type: "error", content: res.data.error });
    }
  } catch (error) {
    setWaterReq(null);
    messageApi.open({ type: "error", content: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
  }
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  if (!waterValue.Date || !waterValue.Time) {
    message.error("กรุณาระบุวันที่และเวลา");
    return;
  }

  if (!uploadedFile) {
    message.error("กรุณาอัปโหลดรูปภาพมิเตอร์น้ำ");
    return;
  }

  if (!user || !user.ID) {
    console.error("User is not logged in");
    return;
  }

  if (!id) {
    console.error("CameraDeviceID is missing");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("Date", dayjs(waterValue.Date).format("YYYY-MM-DD"));
    formData.append("Time", dayjs(waterValue.Time, "HH:mm").format("HH:mm"));
    formData.append("MeterValue", waterValue.MeterValue!.toString());
    formData.append("ModelConfidence", waterValue.ModelConfidence!.toString());
    formData.append("Note", waterValue.Note || "");
    formData.append("ImagePath", uploadedFile);
    formData.append("UserID", user.ID.toString() || "0");
    formData.append("CameraDeviceID", id.toString() || "0");

    setAddLoading(true);

    const res = await CreateWaterMeterValue(formData);

    if (res.status === 200) {
      messageApi.success({
        content: (
          <span className="text-base font-semibold text-green-600">
            บันทึกค่ามิเตอร์สำเร็จ!
          </span>
        ),
      });

      setUploadedFile(null);
      setWaterValue({
        Date: "",
        Time: "",
        MeterValue: 0,
        ModelConfidence: 0,
        Note: "",
        ImagePath: "",
      });
      setErrors({});
      setPreviewImage(null);
      setShowAddModal(false);
    } else {
      console.error("❌ Response error:", res);
      messageApi.error(`${res.data?.message || "Unknown error"}`);
    }
  } catch (error: any) {
    console.error("❌ บันทึกค่ามิเตอร์ล้มเหลว:", error);

    // ✅ แสดงข้อความจาก backend ถ้ามี
    if (error.response?.data?.error) {
      messageApi.error(`❌ ${error.response.data.message}`);
    } else {
      messageApi.error("❌ เกิดข้อผิดพลาด ไม่สามารถบันทึกค่ามิเตอร์ได้");
    }
  } finally {
    setAddLoading(false);
  }
};


  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // ตรวจสอบวันที่ เฉพาะกรณีเพิ่มข้อมูลใหม่
    if (!waterValue.Date?.trim()) {
      newErrors.Date = "กรุณาเลือกวันที่บันทึก";
    } else {
      const selectedDate = new Date(waterValue.Date);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.Date = "วันที่ต้องเป็นวันนี้หรืออนาคตเท่านั้น";
      }
    }


    // ตรวจสอบเวลา
    if (!waterValue.Time?.trim()) {
      newErrors.Time = "กรุณาเลือกเวลาที่บันทึก";
    }

    // ตรวจสอบค่ามิเตอร์
    if (!waterValue.MeterValue || waterValue.MeterValue < 1) {
      newErrors.MeterValue = "กรุณากรอกค่ามิเตอร์น้ำที่มากกว่า 0 ลบ.ม.";
    } else if (waterValue.MeterValue > 100000) {
      newErrors.MeterValue = "ค่ามิเตอร์น้ำต้องไม่เกิน 100,000 ลบ.ม.";
    }

    // ตรวจสอบรูปภาพ
    if (!uploadedFile && !waterValue.ImagePath) {
      newErrors.ImagePath = "กรุณาอัปโหลดรูปภาพมิเตอร์น้ำ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setUploadedFile(file);

      // ล้าง error ของรูปภาพ
      if (errors.ImagePath) {
        setErrors((prev) => ({
          ...prev,
          ImagePath: "",
        }));
      }
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
      getNotificationById(),
      loadWaterValueReq()
    ])
      .finally(() => {
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

  console.log("waterreq", waterReq)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-2 sm:px-4 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
      {contextHolder}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden my-8">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-600"></div>

            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
              onClick={() => setShowAddModal(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-blue-800">
                {"เพิ่มข้อมูลค่ามิเตอร์น้ำ"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {"กรอกข้อมูลการบันทึกค่ามิเตอร์น้ำ"}
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Date and Time Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    วันที่ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:border-blue-500 transition-all outline-none border-gray-200 focus:ring-blue-500`}
                      value={waterValue.Date || ""}
                      onChange={(e) => handleInputChange("Date", e.target.value)}
                    />
                  </div>
                  {errors.Date && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.Date}
                    </p>
                  )}
                </div>

                {/* Time */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    เวลา <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:border-blue-500 transition-all outline-none border-gray-200 focus:ring-blue-500`}
                      value={waterValue.Time || ""}
                      onChange={(e) => handleInputChange("Time", e.target.value)}
                    />
                  </div>
                  {errors.Time && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      {errors.Time}
                    </p>
                  )}
                </div>
              </div>

              {/* Meter Value */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  ค่ามิเตอร์น้ำ (ลบ.ม.) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    placeholder="กรอกค่ามิเตอร์น้ำ..."
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-base"
                    value={waterValue.MeterValue || ""}
                    onChange={(e) => handleInputChange("MeterValue", parseInt(e.target.value) || 0)}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                    ลบ.ม.
                  </div>
                </div>
                {errors.MeterValue && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.MeterValue}
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  value={waterValue.Note || ""}
                  placeholder="กรอกหมายเหตุ (ถ้ามี)..."
                  onChange={(e) => handleInputChange("Note", e.target.value)}
                />
                {errors.Note && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.Note}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  รูปภาพมิเตอร์น้ำ <span className="text-red-500">*</span>
                </label>

                {previewImage ? (
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          onClick={() => {
                            setPreviewImage(null);
                            setUploadedFile(null);
                          }}
                          type="button"
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          ลบรูป
                        </button>
                      </div>
                    </div>
                    {uploadedFile ? (
                      <p className="text-sm text-gray-500 mt-2 text-center truncate">
                        📄 {uploadedFile.name}
                      </p>
                    ) : waterValue.ImagePath ? (
                      <p className="text-sm text-gray-500 mt-2 text-center truncate">
                        📄 {waterValue.ImagePath.split("/").pop()}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2 text-center italic">ไม่มีไฟล์รูปภาพ</p>
                    )}
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${errors.ImagePath
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                      }`}>
                      <div className="flex flex-col items-center justify-center py-12 px-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${errors.ImagePath
                            ? "bg-red-100 text-red-500"
                            : "bg-blue-100 text-blue-500"
                          }`}>
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className={`font-medium mb-2 ${errors.ImagePath ? "text-red-600" : "text-gray-700"
                          }`}>
                          อัปโหลดรูปภาพมิเตอร์น้ำ
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 5MB)
                        </p>
                      </div>
                    </div>
                  </label>
                )}

                {errors.ImagePath && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.ImagePath}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={addLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-3"
              >
                {addLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    บันทึกข้อมูล
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg mb-6 p-4 border border-white/20">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Section */}
          <div className="flex flex-row items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl shadow-md hover:shadow-lg hover:bg-white transition-all duration-300 border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline font-medium">ย้อนกลับ</span>
            </button>
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-2xl shadow-xl">
              <Building2 className="w-5 h-5" />
              <span className="font-bold text-lg">{waterDetail?.MeterLocation?.Name ?? "ไม่ทราบชื่ออาคาร"}</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="hidden md:inline text-gray-700 font-medium">{waterDetail?.MeterLocation?.Name ?? "ไม่ทราบตำแหน่ง"}</span>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md backdrop-blur-sm border ${waterDetail?.Wifi 
              ? 'bg-green-50/80 text-green-700 border-green-200' 
              : 'bg-red-50/80 text-red-700 border-red-200'
            }`}>
              {waterDetail?.Wifi ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="hidden md:inline font-medium">{waterDetail?.Wifi ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
     

      {/* Chart Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              ปริมาณการใช้น้ำ
            </h3>
            <p className="text-gray-600">แสดงข้อมูลการใช้น้ำรายวัน</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 pr-3 py-2"
              />
            </div>

            <span className="text-gray-500 font-medium">ถึง</span>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 pr-3 py-2"
              />
            </div>
          </div>
        </div>

        {dailyMeterData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertTriangle className="w-16 h-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold mb-2">ไม่พบข้อมูล</h4>
            <p className="text-center">ไม่พบข้อมูลการใช้น้ำในช่วงเวลาที่เลือก<br />กรุณาเลือกช่วงเวลาใหม่</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
  <div style={{ minWidth: `${Math.max(dailyMeterData.length * 60, 800)}px`, height: "320px" }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dailyMeterData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          angle={-45}
          textAnchor="end"
          interval={0}
          height={60}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          label={{ 
            value: 'ปริมาณน้ำ (ลบ.ม.)', 
            angle: -90, 
            position: 'insideLeft', 
            style: { textAnchor: 'middle', fill: '#6b7280', fontWeight: 'bold' } 
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="usage"
          name="ใช้น้ำ"
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#ffffff' }}
          activeDot={{ r: 6, fill: '#1D4ED8' }}
        />
        {avgValue != null && (
          <ReferenceLine
            y={avgValue}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{
              value: `ค่าเฉลี่ย: ${avgValue.toFixed(1)}`,
              fill: "#ef4444",
              fontWeight: "bold",
              fontSize: 12
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>

        )}

        {/* Chart Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-700">การใช้น้ำรายวัน</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
            <div className="w-4 h-1 bg-red-500"></div>
            <span className="font-medium text-red-700">ค่าเฉลี่ย</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              ประวัติการบันทึกค่ามิเตอร์
            </h3>
            <p className="text-gray-600">รายละเอียดการบันทึกค่ามิเตอร์น้ำทั้งหมด</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={exportToExcel} 
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              เพิ่มข้อมูล
            </button>
          </div>
        </div>

        {/* Mobile Card Layout */}

        

       
        {/* Desktop Table */}
        {waterDetail?.WaterMeterValue && waterDetail.WaterMeterValue.length > 0 ? (
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-4 font-bold text-gray-700 border-b border-gray-200">วัน/เดือน/ปี</th>
                    <th className="text-left p-4 font-bold text-gray-700 border-b border-gray-200">เวลา</th>
                    <th className="text-left p-4 font-bold text-gray-700 border-b border-gray-200">ค่าที่อ่านได้</th>
                    <th className="text-left p-4 font-bold text-gray-700 border-b border-gray-200">หมายเหตุ</th>
                    <th className="text-left p-4 font-bold text-gray-700 border-b border-gray-200">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {waterDetail.WaterMeterValue.map((wmv, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200"
                    >
                      <td className="p-4 text-gray-800 font-medium">
                        {wmv.Timestamp
                          ? new Date(wmv.Timestamp).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                          })
                          : "-"}
                      </td>
                      <td className="p-4 text-gray-800">
                        {wmv.Timestamp
                          ? new Date(wmv.Timestamp).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                          : "-"}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                          <Droplet className="w-4 h-4" />
                          {wmv.MeterValue} ลบ.ม.
                        </span>
                      </td>
                      <td className="p-4 text-gray-800">{wmv.Note || "-"}</td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/waterdetail/edit/${wmv.ID}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 font-medium shadow-md"
                        >
                          <Edit className="w-4 h-4" />
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) 
        : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertTriangle className="w-16 h-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold mb-2">ไม่พบข้อมูล</h4>
            <p className="text-center">ไม่พบข้อมูลมิเตอร์ในช่วงเวลาที่เลือก<br />กรุณาเลือกช่วงเวลาใหม่</p>
          </div>
        )}

        
      </div>
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 mb-6 p-6">
          <DataTable
            data={waterReq  || []} 
            onReload={loadWaterValueReq}
          />
          <ImageModal
            imagePath={selectedImage}
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
          />
        </div>
      
      </div>
    </div>
  );
};

export default WaterMonitoringDashboard;