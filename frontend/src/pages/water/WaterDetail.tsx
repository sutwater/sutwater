import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { MapPin, Wifi, Battery, Network, ArrowLeft, Bell, Droplet, Building2, Calendar, WifiOff, Plus, Download, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { GetMeterLocationDetail, GetNotificationsByMeterLocation, CreateWaterMeterValue } from "../../services/https"
import { CameraDeviceInterface, NotificationInterface, WaterMeterValueSaveInterface } from '../../interfaces/InterfaceAll';
import { message } from 'antd';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { useAppContext } from '../../contexts/AppContext';

const WaterMonitoringDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [waterDetail, setWaterDetail] = useState<CameraDeviceInterface | null>(null);
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
      getNotificationById()
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

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 lg:px-30 pb-20 overflow-auto">
      {contextHolder}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
        </div>
      )}
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
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:border-blue-500 transition-all outline-none  "border-gray-200 focus:ring-blue-500"
      `}
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
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:border-blue-500 transition-all outline-none "border-gray-200 focus:ring-blue-500"
      `}
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

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md backdrop-blur-sm ${waterDetail?.Wifi ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'
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
        <div className="bg-white p-8 rounded-3xl text-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center mb-4 space-x-4">
            <div className="bg-gray-100 p-3 rounded-2xl backdrop-blur-sm">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold">การแจ้งเตือน</h3>

          </div>
          <p className="text-black text-base">รายการแจ้งเตือนทั้งหมด</p>
        </div>

        {/* Cumulative Data */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
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
            <div className="flex flex-col items-center bg-red-50 rounded-3xl p-3 sm:p-4 flex-1 sm:w-40 hover:shadow-md transition-shadow duration-200">
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
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ">
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
      <div className="bg-white rounded-3xl border border-white/20 shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">ปริมาณการใช้น้ำ</h3>
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
          <div className="h-80 sm:h-96 w-full overflow-x-auto">
            <div
              className="h-full"
              style={{ width: `${dailyMeterData.length * 60}px`, minWidth: "100%" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyMeterData} margin={{ bottom: 50 }}> {/* เพิ่ม margin bottom */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}

                    label={{
                      value: "วันที่",
                      position: "bottom",
                      offset: 38 // ดัน label ลงด้านล่าง
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: 'ปริมาณน้ำ (ลบ.ม.)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="linear"
                    dataKey="usage"
                    name="ใช้น้ำ"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  {avgValue != null && (
                    <ReferenceLine
                      y={avgValue}
                      stroke="#ef4444"
                      strokeWidth={2}
                      label={{
                        position: "right",
                        value: "ค่าเฉลี่ย",
                        fill: "#ef4444",
                        fontWeight: "bold",
                      }}
                    />
                  )}
                  {maxValue != null && (
                    <Line
                      type="monotone"
                      dataKey="max"
                      name="ค่าสูงสุด"
                      stroke="#22c55e"
                      strokeDasharray="4 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {minValue != null && (
                    <Line
                      type="monotone"
                      dataKey="min"
                      name="ค่าต่ำสุด"
                      stroke="#a855f7"
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
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>ค่าเฉลี่ย</span>
          </div>
        </div>
      </div>

      {/* Data Table - Mobile Responsive */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              ประวัติการบันทึกค่ามิเตอร์
            </h3>
            <p className="text-gray-500">รายละเอียดการบันทึกค่ามิเตอร์น้ำทั้งหมด</p>
          </div>

          <div className="flex gap-3">
            <button onClick={exportToExcel} className="flex items-center gap-3 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
              <Download className="w-5 h-5" />
              Export Excel
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-3 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              เพิ่มข้อมูล
            </button>
          </div>
        </div>



        {/* Mobile Card Layout */}
        <div className="block lg:hidden space-y-4">
          {waterDetail?.WaterMeterValue?.map((wmv, index) => (
            <div key={index} className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-gray-800">
                  {wmv.Timestamp && (
                    <div className="text-lg font-semibold text-gray-800">
                      {new Date(wmv.Timestamp).toLocaleDateString("th-TH")}
                    </div>
                  )}


                </div>
                <div className="text-2xl font-bold text-blue-600">{wmv.MeterValue} ลบ.ม.</div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{wmv.Timestamp
                  ? new Date(wmv.Timestamp).toLocaleTimeString("th-TH")
                  : "-"}</span>

              </div>
              {wmv.Note && (
                <p className="text-gray-600 mb-4 bg-white/60 p-3 rounded-lg">{wmv.Note}</p>
              )}
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all">
                <Edit className="w-4 h-4" />
                แก้ไขข้อมูล
              </button>
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

                    <td className="p-3 text-gray-800 font-medium">{wmv.MeterValue} ลบ.ม.</td>
                    <td className="p-3 text-gray-800">{wmv.Note || "-"}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          navigate(`/waterdetail/edit/${wmv.ID}`);
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                      >
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