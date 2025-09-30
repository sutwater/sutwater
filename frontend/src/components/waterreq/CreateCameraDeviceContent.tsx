import { useState, useEffect } from "react";
import { CreateCameraDevice, fetchCameraDeviceWithoutMac } from "../../services/https";
import type {  CameraDeviceSaveInterface, MeterLocationInterface } from "../../interfaces/InterfaceAll";
import { useAppContext } from '../../contexts/AppContext';
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { message } from "antd";

interface CreateCameraDeviceContentProps {
  setShowAddModal: (value: boolean) => void;
}

const CreateCameraDeviceContent = ({ setShowAddModal }: CreateCameraDeviceContentProps) => {
  const [meterLocation, setMeterLocation] = useState<MeterLocationInterface[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const [cameraDevice, setCameraDevice] = useState<Partial<CameraDeviceSaveInterface>>({
    MacAddress: "",
    Password: "",
    MeterLocationID: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user, getNotification } = useAppContext();

  const handleInputChange = (field: keyof CameraDeviceSaveInterface, value: string | number) => {
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

  // ตรวจสอบ MacAddress
  if (!cameraDevice.MacAddress?.trim()) {
    newErrors.MacAddress = "กรุณากรอก MacAddress";
  } else {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(cameraDevice.MacAddress.trim())) {
      newErrors.MacAddress = "กรุณากรอก MacAddress ให้ถูกต้อง เช่น AA:BB:CC:DD:EE:FF";
    }
  }

  // ตรวจสอบ Password
  if (!cameraDevice.Password?.trim()) {
    newErrors.Password = "กรุณากรอก Password";
  } else if (cameraDevice.Password.trim().length < 8) {
    newErrors.Password = "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร";
  }

  // ตรวจสอบ MeterLocationID (อาคาร)
  if (!cameraDevice.MeterLocationID) {
    newErrors.MeterLocationID = "กรุณาเลือกจุดมิเตอร์";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user || !user.ID) {
      console.error("User is not logged in");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("MacAddress", cameraDevice.MacAddress!.toString());
      formData.append("PassWord", cameraDevice.Password!.toString());
      formData.append("CameraDeviceID", cameraDevice.MeterLocationID?.toString() || "0");

      setIsLoading(true);

      const res = await CreateCameraDevice(formData);

      if (res.status === 200) {
        messageApi.success("บันทึกข้อมูลอุปกรณ์สำเร็จ!");
        setCameraDevice({ MacAddress: "", Password: "", MeterLocationID: 0 });
        setErrors({});
        setShowAddModal(false);
        getNotification(); // ดึงการแจ้งเตือนใหม่

      } else {
        messageApi.info(res.data.error || "บันทึกข้อมูลอุปกรณ์ล้มเหลว");
        messageApi.info("กรุณาตรวจสอบ MacAddress ว่าไม่ซ้ำกับที่มีอยู่แล้ว");
      }
    } catch (error: any) {
      console.error("บันทึกข้อมูลอุปกรณ์ล้มเหลว:", error);
      messageApi.error("บันทึกข้อมูลอุปกรณ์ล้มเหลว");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeterLocation = async () => {
    try {
      const res = await fetchCameraDeviceWithoutMac();
      setMeterLocation(res.data || []);
    } catch (err) {
      console.error("โหลดข้อมูลมิเตอร์ล้มเหลว:", err);
      messageApi.error("ไม่สามารถโหลดข้อมูลมิเตอร์ได้");
    }
  };

  useEffect(() => {
    loadMeterLocation();
  }, []);

  return (
    <>
      {contextHolder}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 relative animate-in zoom-in-95 duration-300">
    {/* Close button */}
    <button
      onClick={() => setShowAddModal(false)}
      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
    >
      ×
    </button>

    <h3 className="text-2xl font-bold text-gray-800 mb-6">เพิ่มอุปกรณ์ใหม่</h3>

    <div className="space-y-5">
      {/* Meter Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">เลือกจุดมิเตอร์</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer"
          value={cameraDevice.MeterLocationID || ''}
          onChange={(e) => handleInputChange("MeterLocationID", parseInt(e.target.value))}
        >
          <option value="">-- เลือกข้อมูลจุดมิเตอร์ --</option>
          {meterLocation.map((loc) => (
            <option key={loc.ID} value={loc.ID}>{loc.Name}</option>
          ))}
        </select>
        {errors.MeterLocationID && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={16} /> {errors.MeterLocationID}</p>}
      </div>

      {/* MAC Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">MAC Address</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          value={cameraDevice.MacAddress || ''}
          onChange={(e) => handleInputChange("MacAddress", e.target.value)}
          placeholder="AA:BB:CC:DD:EE:FF"
        />
        {errors.MacAddress && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={16} /> {errors.MacAddress}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
            value={cameraDevice.Password || ""}
            onChange={(e) => handleInputChange("Password", e.target.value)}
            placeholder="อย่างน้อย 8 ตัวอักษร"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.Password && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={16} /> {errors.Password}</p>}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer"
          onClick={() => setShowAddModal(false)}
        >
          ยกเลิก
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "กำลังบันทึก..." : "เพิ่ม"}
        </button>
      </div>
    </div>
  </div>
</div>

    </>
  );
};

export default CreateCameraDeviceContent;