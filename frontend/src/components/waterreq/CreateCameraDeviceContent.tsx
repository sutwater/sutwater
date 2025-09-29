import { useState, useEffect } from "react";
import { CreateCameraDevice, fetchCameraDeviceWithoutMac } from "../../services/https";
import type { WaterValueStatus, CameraDeviceSaveInterface, MeterLocationInterface } from "../../interfaces/InterfaceAll";

import {
  ArrowLeft,
  MapPin,
  Users,
  FileText,
  Tag,
  Save,
} from "lucide-react";

import {
  ConfirmModal,
  StatusModal,
} from "../ConfirmModal";

import { useAppContext } from '../../contexts/AppContext';
import { message } from "antd";
import { useNavigate } from "react-router-dom";

const CreateCameraDeviceContent = () => {
  const [statusList, setStatusList] = useState<WaterValueStatus[]>([]);
  const [meterLocation, setMeterLocation] = useState<MeterLocationInterface[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [cameraDevice, setCameraDevice] = useState<Partial<CameraDeviceSaveInterface>>({
      MacAddress: "",
      Battery: 0,
      Wifi: false,
      Status: false,
      MeterLocationID: 0,
    });

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

  const handleInputChange = (field: keyof CameraDeviceSaveInterface, value: string | number) => {
    if (!cameraDevice) return;

    setCameraDevice((prev) => ({
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

    // ตรวจสอบเวลา
    if (!cameraDevice.MacAddress?.trim()) {
      newErrors.Time = "กรุณากรอก MacAddress";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!cameraDevice.MacAddress) {
      message.error("กรุณาระบุ MacAddress");
      return;
    }
    // ✅ ตรวจสอบ user ว่าไม่ null ก่อน
    if (!user || !user.ID) {
      console.error("User is not logged in");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("MacAddress", cameraDevice.MacAddress!.toString());
      formData.append("CameraDeviceID", cameraDevice.MeterLocationID?.toString() || "0");

      setIsLoading(true);
      setConfirmOpen(false); // ปิด confirm modal
      setStatusType("loading");
      setStatusMessage("กำลังบันทึกข้อมูล...");
      setStatusOpen(true);

      const res = await CreateCameraDevice(formData);

      if (res.status === 200) {
        messageApi.success({
          content: <span className="text-base font-semibold text-green-600">บันทึกข้อมูลอุปกรณ์สำเร็จ!</span>,
        });

        setCameraDevice({
          MacAddress: "",
          Battery: 0,
          Wifi: false,
          Status: false,
          MeterLocationID: 0,
        });
        setErrors({});

        // ✅ ปิด modal
      } else {
        messageApi.error("❌ บันทึกข้อมูลอุปกรณ์ไม่สำเร็จ");
        setConfirmOpen(false); 
        setStatusOpen(false);
      }
    } catch (error: any) {
      console.error("❌ บันทึกข้อมูลอุปกรณ์ล้มเหลว:", error);
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
  }, [statusOpen, statusType, navigate]);

  const loadMeterLocation = async () => {
    try {
      const res = await fetchCameraDeviceWithoutMac();
      const meterLocation = res.data; // ✅ ดึงเฉพาะ array
      setMeterLocation(meterLocation);
      console.log("meterLocation:", meterLocation);
    } catch (err) {
      console.error("โหลดข้อมูลมิเตอร์ล้มเหลว:", err);
      message.error("ไม่สามารถโหลดข้อมูลมิเตอร์ได้");
    }
  };
  useEffect(() => {
    
    loadMeterLocation();
  }, []);

console.log("meterLocation: ",meterLocation)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
  {contextHolder}

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
              เพิ่มข้อมูลอุปกรณ์
            </h1>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Content */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">

        {/* ข้อมูลมิเตอร์น้ำ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#640D5F] to-[#640D5F] text-white">
            <div className="flex items-center gap-3">
              <FileText size={24} />
              <h2 className="text-lg font-semibold">ข้อมูลอุปกรณ์</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* ข้อมูลมิเตอร์ */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Tag size={16} />
                จุดที่อยู่มิเตอร์น้ำ *
              </label>
              <select
                value={cameraDevice?.MeterLocationID}
                onChange={(e) =>
                  handleInputChange("MeterLocationID", parseInt(e.target.value))
                }
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.StatusID
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <option value="">เลือกจุดข้อมูลมิเตอร์</option>
                {meterLocation.map((status) => (
                  <option key={status.ID} value={status.ID}>
                    {status.Name}
                  </option>
                ))}
              </select>
              {errors.StatusID && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {errors.StatusID}
                </p>
              )}
            </div>

            {/* MacAddress */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <MapPin size={16} />
                MacAddress <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="กรอกค่า MacAddress..."
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-base"
                value={cameraDevice.MacAddress || ""}
                onChange={(e) =>
                  handleInputChange("MacAddress", e.target.value || 0)
                }
              />
              {errors.MacAddress && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {errors.MacAddress}
                </p>
              )}
            </div>

          </div>
        </div>
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
                      <span>บันทึกข้อมูลอุปกรณ์</span>
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

  {/* Confirm Modal */}
  <ConfirmModal
    isOpen={confirmOpen}
    onClose={() => setConfirmOpen(false)}
    onConfirm={handleSubmit}
    title="ยืนยันการบันทึกข้อมูลอุปกรณ์"
    message="คุณต้องการบันทึกข้อมูลอุปกรณ์ ใช่หรือไม่ ?"
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

export default CreateCameraDeviceContent;