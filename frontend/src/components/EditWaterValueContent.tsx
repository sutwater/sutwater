import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../services/https";
import type { WaterValueStatus, WaterMeterValueInterface } from "../interfaces/InterfaceAll";

import {
  Save,
  ArrowLeft,
  Upload,
  FileText,
  Tag,
  Image,
  Calendar,
  Clock,
  Droplets,
  CheckCircle2,
  AlertCircle,
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

    if (!waterValue.Timestamp?.trim()) {
      newErrors.Time = "กรุณาเลือกเวลาที่บันทึก";
    }

    if (!waterValue.MeterValue || waterValue.MeterValue < 1) {
      newErrors.MeterValue = "กรุณากรอกค่ามิเตอร์น้ำที่มากกว่า 0";
    } else if (waterValue.MeterValue > 9999999) {
      newErrors.MeterValue = "ค่ามิเตอร์น้ำต้องไม่เกิน 9,999,999";
    }

    if (!uploadedFile && !waterValue?.ImagePath) {
      newErrors.ImagePath = "กรุณาอัปโหลดรูปภาพมิเตอร์น้ำ";
    }

    if (uploadedFile && uploadedFile.size > 5 * 1024 * 1024) {
      newErrors.ImagePath = "ขนาดไฟล์ต้องไม่เกิน 5 MB";
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

    if (uploadedFile && !(uploadedFile instanceof File)) {
      message.error("ไฟล์รูปภาพไม่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    setConfirmOpen(false);
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
      formData.append("StatusID", waterValue?.StatusID?.toString() || "0");

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
    const statusArray = res.data.status;
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
        const waterData: WaterMeterValueInterface = res.data.data;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-blue-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-all px-4 py-2.5 rounded-xl hover:bg-blue-50 cursor-pointer"
              >
                <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold">กลับ</span>
              </button>
              <div className="h-8 w-px bg-gradient-to-b from-transparent via-blue-300 to-transparent"></div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Droplets size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-600">
                    แก้ไขข้อมูลมิเตอร์น้ำ
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">อัปเดตค่ามิเตอร์และข้อมูลที่เกี่ยวข้อง</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FileText size={22} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">ข้อมูลการบันทึกค่ามิเตอร์</h2>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Calendar size={16} className="text-blue-600" />
                      </div>
                      วันที่บันทึก
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={waterValue?.Timestamp ? dayjs(waterValue.Timestamp).format("YYYY-MM-DD") : ""}
                        readOnly
                        className="w-full px-4 py-3.5 pl-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                      />
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 mb-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Clock size={16} className="text-blue-600" />
                      </div>
                      เวลาที่บันทึก
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={waterValue?.Timestamp ? dayjs(waterValue.Timestamp).format("HH:mm") : ""}
                        readOnly
                        className="w-full px-4 py-3.5 pl-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                      />
                      <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Meter Value */}
                <div className="group">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Droplets size={16} className="text-blue-600" />
                    </div>
                    ค่ามิเตอร์น้ำ <span className="text-red-500 ml-1">*</span>
                  </label>
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
                      className={`w-full px-4 py-3.5 pr-20 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all font-semibold text-lg ${
                        errors.MeterValue
                          ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                          : "border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                      placeholder="กรอกค่ามิเตอร์..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md">
                      ลบ.ม.
                    </div>
                  </div>
                  {errors.MeterValue && (
                    <div className="flex items-center gap-2 mt-3 text-red-600 text-sm font-medium bg-red-50 px-4 py-2.5 rounded-lg border border-red-200">
                      <AlertCircle size={16} />
                      <span>{errors.MeterValue}</span>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="group">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    หมายเหตุเพิ่มเติม
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none hover:border-gray-300"
                    value={waterValue?.Note || ""}
                    placeholder="ระบุหมายเหตุหรือข้อมูลเพิ่มเติม (ถ้ามี)..."
                    rows={3}
                    onChange={(e) => handleInputChange("Note", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <CheckCircle2 size={22} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">สถานะการอนุมัติข้อมูล</h2>
                </div>
              </div>

              <div className="p-8">
                <div className="group">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Tag size={16} className="text-blue-600" />
                    </div>
                    สถานะข้อมูล <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={waterValue?.StatusID}
                    onChange={(e) =>
                      handleInputChange("StatusID", parseInt(e.target.value))
                    }
                    className={`w-full px-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all font-medium ${
                      errors.StatusID
                        ? "border-red-300 bg-red-50 focus:ring-red-200"
                        : "border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  >
                    <option value="">เลือกสถานะข้อมูล</option>
                    {filteredStatusList.map((status) => (
                      <option key={status.ID} value={status.ID}>
                        {status.Description}
                      </option>
                    ))}
                  </select>
                  {errors.StatusID && (
                    <div className="flex items-center gap-2 mt-3 text-red-600 text-sm font-medium bg-red-50 px-4 py-2.5 rounded-lg border border-red-200">
                      <AlertCircle size={16} />
                      <span>{errors.StatusID}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Image size={22} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">รูปภาพมิเตอร์น้ำ</h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="relative group overflow-hidden rounded-xl">
                  <img
                    src={previewImage ?? (waterValue?.ImagePath ? getImageUrl(waterValue.ImagePath) : undefined)}
                    alt="Meter Image"
                    className="w-full aspect-square object-cover rounded-xl border-2 border-gray-200 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                </div>

                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-3 px-5 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition-all group shadow-sm hover:shadow-md">
                    <Upload size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-blue-700 font-semibold">
                      เปลี่ยนรูปภาพ
                    </span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  รองรับไฟล์ JPG, PNG<br />ขนาดไม่เกิน 5MB
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200 p-6">
              <div className="space-y-3">
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-2xl hover:scale-105 cursor-pointer group"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save size={22} className="group-hover:scale-110 transition-transform" />
                      <span>บันทึกการแก้ไข</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full px-6 py-4 text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-xl hover:bg-gray-200 hover:border-gray-300 transition-all font-semibold cursor-pointer"
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