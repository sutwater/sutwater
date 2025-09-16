import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL, CreateWaterMeterValue } from "../services/https";
import type { WaterValueStatus, WaterMeterValueInterface, WaterMeterValueSaveInterface } from "../interfaces/InterfaceAll";

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
  fetchWaterValueStatus,
  fetchWaterValueById,
} from "../services/https";
import { useAppContext } from '../contexts/AppContext';
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const CreateWaterValueContent = () => {
  const [statusList, setStatusList] = useState<WaterValueStatus[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [waterValue, setWaterValue] = useState<Partial<WaterMeterValueSaveInterface>>({
      Date: "",
      Time: "",
      MeterValue: 0,
      OCRConfidence: 100,
      Note: "",
      ImagePath: "",
    });
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setUploadedFile(file);
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

    // ✅ ตรวจสอบ user ว่าไม่ null ก่อน
    if (!user || !user.ID) {
      console.error("User is not logged in");
      return;
    }

    // ✅ ตรวจสอบ id ว่าไม่ undefined ก่อน
    if (!id) {
      console.error("CameraDeviceID is missing");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Date", dayjs(waterValue.Date).format("YYYY-MM-DD"));
      formData.append("Time", dayjs(waterValue.Time, "HH:mm").format("HH:mm"));
      formData.append("MeterValue", waterValue.MeterValue!.toString());
      formData.append("ModelConfidence", waterValue.OCRConfidence!.toString());
      formData.append("Note", waterValue.Note || "");
      formData.append("ImagePath", uploadedFile);
      formData.append("UserID", user.ID.toString() || "0");
      formData.append("CameraDeviceID", id.toString() || "0");


      const res = await CreateWaterMeterValue(formData);

      if (res.status === 200) {
        messageApi.success({
          content: <span className="text-base font-semibold text-green-600">บันทึกค่ามิเตอร์สำเร็จ!</span>,
        });


        setUploadedFile(null);
        setWaterValue({
          Date: "",
          Time: "",
          MeterValue: 0,
          OCRConfidence: 0,
          Note: "",
          ImagePath: "",
        });
        setErrors({});
        setUploadedFile(null);
        setPreviewImage(null);

        // ✅ ปิด modal
      } else {
        message.error("❌ บันทึกค่ามิเตอร์ไม่สำเร็จ");
      }
    } catch (error: any) {
      console.error("❌ บันทึกค่ามิเตอร์ล้มเหลว:", error);
    }
  };

  useEffect(() => {
    if (statusOpen && statusType === "success") {
      const timeout = setTimeout(() => {
        setStatusOpen(false);
        navigate(`/waterdetail`);
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
      {contextHolder}
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
                      required
                      className="w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-600"
                      value={waterValue.Date || ""}
                      onChange={(e) => handleInputChange("Date", e.target.value)}
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
                      required
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-2 focus:border-blue-500 transition-all outline-none "border-gray-200 focus:ring-blue-500"`}
                      value={waterValue.Time || ""}
                      onChange={(e) => handleInputChange("Time", e.target.value)}
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
                    placeholder="กรอกค่ามิเตอร์น้ำ..."
                    required
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-base"
                    value={waterValue.MeterValue || ""}
                    onChange={(e) => handleInputChange("MeterValue", parseInt(e.target.value) || 0)}
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

              {/* <div className="p-6 space-y-6">
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
              </div> */}
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
                    src={previewImage ?? (waterValue?.ImagePath ? getImageUrl(waterValue.ImagePath) : undefined)}
                    alt={"Meter Image"}
                    title={waterValue?.ImagePath || "Meter Image"}
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
            navigate(`/waterdetail/`);
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

export default CreateWaterValueContent;