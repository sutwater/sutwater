import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../services/https";
import type { WaterValueStatus, WaterMeterValueInterface } from "../interfaces/InterfaceAll";

import {
  Save,
  ArrowLeft,
  Upload,
  MapPin,
  Users,
  FileText,
  Tag,
  Image,
} from "lucide-react";

import {
  ConfirmModal,
  StatusModal,
} from "./ConfirmModal";

import {
  UpdateWaterMeterValue,
  fetchWaterValueStatus,
  fetchWaterValueById,
} from "../services/https";
import { useAppContext } from '../contexts/AppContext';
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const EditWaterValueContent = () => {
  const [statusList, setStatusList] = useState<WaterValueStatus[]>([]);
  const [previewImage, setPreviewImage] = useState<string | undefined>(undefined);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [waterValue, setWaterValue] = useState<WaterMeterValueInterface | null>(null);
  const LocationId = waterValue?.CameraDevice?.MeterLocation?.ID;
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user } = useAppContext();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusType, setStatusType] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [statusMessage, setStatusMessage] = useState<string | undefined>(
    undefined
  );
  const allowedStatusIDs = [1, 2];
  const filteredStatusList = Array.isArray(statusList)
    ? statusList.filter((status) => allowedStatusIDs.includes(status.ID))
    : [];
console.log("waterValue: ",waterValue)

  const getImageUrl = (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const handleInputChange = (field: keyof WaterMeterValueInterface, value: string | number) => {
    if (!waterValue) return;

    setWaterValue((prev) => ({
      ...prev!,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    if (!waterValue) return false;
    const newErrors: { [key: string]: string } = {};

    // ตรวจสอบเวลา
    if (!waterValue.Timestamp?.trim()) {
      newErrors.Time = "กรุณาเลือกเวลาที่บันทึก";
    }

    // ตรวจสอบค่ามิเตอร์
    if (!waterValue.MeterValue || waterValue.MeterValue < 1) {
      newErrors.MeterValue = "กรุณากรอกค่ามิเตอร์น้ำที่มากกว่า 0 ลบ.ม.";
    } else if (waterValue.MeterValue > 100000) {
      newErrors.MeterValue = "ค่ามิเตอร์น้ำต้องไม่เกิน 100,000 ลบ.ม.";
    }

    // ตรวจสอบรูปภาพ
    if (!uploadedFile && !waterValue.WaterMeterImage?.ImagePath) {
      newErrors.ImagePath = "กรุณาอัปโหลดรูปภาพมิเตอร์น้ำ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setUploadedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !waterValue || !id) return;

    // ตรวจสอบว่า uploadedFile (ถ้ามี) ต้องเป็น File จริง
    if (uploadedFile && !(uploadedFile instanceof File)) {
      message.error("ไฟล์รูปภาพไม่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    setConfirmOpen(false); // ปิด confirm modal
    setStatusType("loading");
    setStatusMessage("กำลังบันทึกข้อมูล...");
    setStatusOpen(true);

    try {
      const formData = new FormData();
      formData.append("Date", dayjs(waterValue.Date).format("YYYY-MM-DD"));
      formData.append("Time", dayjs(waterValue.Time, "HH:mm").format("HH:mm"));
      formData.append("MeterValue", String(waterValue.MeterValue ?? ""));
      formData.append("ModelConfidence", String(waterValue.ModelConfidence ?? ""));
      formData.append("Note", waterValue.Note || "");
      formData.append("UserID", user?.ID?.toString() ?? "0");
      formData.append("CameraDeviceID", waterValue?.CameraDevice?.ID?.toString() || "0");

      if (uploadedFile) {
        formData.append("ImagePath", uploadedFile);
      }

      await UpdateWaterMeterValue(id, formData);

      setStatusType("success");
      setStatusMessage("อัปเดตข้อมูลสำเร็จแล้ว!");
    } catch (error: any) {
      console.error("❌ อัปเดตข้อมูลล้มเหลว:", error);

      if (error.response) {
        console.error("🔴 Response:", error.response.data);
        message.error(
          `เกิดข้อผิดพลาด: ${error.response.data.message || "ไม่ทราบสาเหตุ"}`
        );
      } else {
        message.error("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("LocationId: ",LocationId) 
    if (statusOpen && statusType === "success") {
      const timeout = setTimeout(() => {
        setStatusOpen(false);
        navigate(`/waterdetail/${LocationId}`);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [statusOpen, statusType, id, navigate]);


  useEffect(() => {
    const loadStatus = async () => {
  try {
    const res = await fetchWaterValueStatus();
    const statusArray = res.data.status; // ✅ ดึงเฉพาะ array
    setStatusList(statusArray);
    console.log("Loaded statusList:", statusArray);
  } catch (err) {
    console.error("โหลดสถานะข้อมูลล้มเหลว:", err);
    message.error("ไม่สามารถโหลดสถานะข้อมูลได้");
  }
};



    const loadWaterValue = async () => {
      if (!id) return;
      try {
        const res = await fetchWaterValueById(id);
        const waterData: WaterMeterValueInterface = res.data.data; // ✅ ดึงเฉพาะ data
        setWaterValue(waterData);
        console.log("Loaded waterValue:", waterData);
      } catch (err) {
        message.error("ไม่สามารถโหลดข้อมูลได้");
      }
    };


    loadWaterValue();
    loadStatus();
  }, [id]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">กลับ</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  แก้ไขข้อมูลมิเตอร์น้ำ
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#640D5F] to-[#640D5F] text-white">
                <div className="flex items-center gap-3">
                  <FileText size={24} />
                  <h2 className="text-lg font-semibold">ข้อมูลมิเตอร์น้ำ</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* เวลาวันที่ */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <Tag size={16} />
                      วันที่
                    </label>
                    <input
                      type="date"
                      value={waterValue?.Timestamp ? dayjs(waterValue.Timestamp).format("YYYY-MM-DD") : ""}
                      readOnly
                      className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      placeholder="กรอกวันที่..."
                    />
                    {errors.Date && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span>⚠️</span> {errors.Date}
                      </p>
                    )}
                  </div>
                    {/* เวลา */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <Tag size={16} />
                      เวลา
                    </label>
                    <input
                      type="time"
                      value={waterValue?.Timestamp ? dayjs(waterValue.Timestamp).format("HH:mm") : ""}
                      readOnly
                      className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      placeholder="เลือกเวลา..."
                    />
                    {errors.Time && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>{" "}
                        {errors.Time}
                      </p>
                    )}
                  </div>
                </div>
                    {/* ค่ามิเตอร์น้ำ */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <MapPin size={16} />
                    ค่ามิเตอร์น้ำ (ลบ.ม.) <span className="text-red-500">*</span>
                  </label>

                  {/* กล่อง input + หน่วย */}
                  <div className="relative">
                    <input
                      type="number"
                      min="1"

                      max="100000"
                      value={waterValue?.MeterValue ?? ""}
                      onInput={(e) => {
                        const value = Number((e.target as HTMLInputElement).value);
                        if (value > 100000) (e.target as HTMLInputElement).value = "100000";
                        if (value < 1) (e.target as HTMLInputElement).value = "1";
                      }}
                      onChange={(e) => handleInputChange("MeterValue", Number(e.target.value))}
                      className={`w-full px-4 py-3 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.MeterValue
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                        }`}
                      placeholder="กรอกค่ามิเตอร์น้ำ..."
                    />

                    {/* หน่วยอยู่ขวาใน input */}
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ลบ.ม.
                    </span>
                  </div>

                  {errors.MeterValue && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.MeterValue}
                    </p>
                  )}
                </div>
                  {/* //หมายเหตุ */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <FileText size={16} />
                    หมายเหตุ
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    value={waterValue?.Note}
                    placeholder="กรอกหมายเหตุ (ถ้ามี)..."
                    onChange={(e) => handleInputChange("Note", e.target.value)}
                  />

                  <div className="flex justify-between items-center mt-2">
                    {errors.Time && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        {errors.Time}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#640D5F] to-[#640D5F] text-white">
                <div className="flex items-center gap-3">
                  <Users size={24} />
                  <h2 className="text-lg font-semibold">สถานะการอนุมัติข้อมูล</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-0 space-y-0">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <Tag size={16} />
                      สถานะข้อมูลมิเตอร์ *
                    </label>
                    <select
                      value={waterValue?.StatusID}
                      onChange={(e) =>
                        handleInputChange("StatusID", parseInt(e.target.value))
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.StatusID
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      <option value="">เลือกสถานะข้อมูลมิเตอร์</option>
                      {filteredStatusList.map((status) => (
                        <option key={status.ID} value={status.ID}>
                          {status.Description}
                        </option>
                      ))}
                    </select>
                    {errors.StatusID && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span>⚠️</span> {errors.StatusID}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Poster Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#640D5F] to-[#640D5F] text-white">
                <div className="flex items-center gap-3">
                  <Image size={24} />
                  <h2 className="text-lg font-semibold">รูปภาพมิเตอร์น้ำ</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="relative group">
                  <img
                    src={previewImage ?? (waterValue?.WaterMeterImage?.ImagePath ? getImageUrl(waterValue.WaterMeterImage.ImagePath) : undefined)}
                    alt="Water Meter"
                    className="w-full aspect-[3/3.25] object-cover rounded-lg border border-gray-200 group-hover:shadow-lg transition-shadow"
                  />

                  <div className="absolute inset-0  group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>

                <div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all">
                      <Upload size={18} className="text-blue-600" />
                      <span className="text-blue-700 font-medium">
                        เปลี่ยนรูปภาพมิเตอร์น้ำ
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 ">
              <div className="space-y-3">
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>บันทึกการแก้ไข</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="ยืนยันการแก้ไขข้อมูลมิเตอร์น้ำ"
        message="คุณต้องการบันทึกการแก้ข้อมูลค่ามิเตอร์น้ำนี้ ใช่หรือไม่ ?"
        type="info"
        confirmText="บันทึก"
        cancelText="ยกเลิก"
        isLoading={isLoading}
      />

      {/* Status Modal */}
      <StatusModal
        isOpen={statusOpen}
        onClose={() => {
          setStatusOpen(false);
          if (statusType === "success") {
            navigate(`/waterdetail/${LocationId}`);
          }
        }}
        status={statusType}
        message={statusMessage}
        autoClose={statusType === "success"}
        autoCloseDelay={3000}
      />

    </div>
  );
};

export default EditWaterValueContent;