import React, { useEffect, useState } from "react";
import { Plus, Camera, Edit, Trash2 } from "lucide-react";
import { message, Modal, Input, Switch, Select } from "antd";
import { fetchCameraDevice, fetchCameraDeviceWithoutMac } from "../../services/https";
import type { CameraDeviceInterface, MeterLocationInterface } from "../../interfaces/InterfaceAll";

const DeviceManager: React.FC = () => {
  const [devices, setDevices] = useState<CameraDeviceInterface[]>([]);
  const [locationDevices, setLocationDevices] = useState<MeterLocationInterface[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CameraDeviceInterface | null>(null);
  const [formData, setFormData] = useState<{
  name: string;
  mac: string;
  status: boolean;
  locationId?: number; // ✅ เพิ่ม property นี้
}>({
  name: "",
  mac: "",
  status: true,
  locationId: undefined, // ✅ ค่าเริ่มต้น
});

  //const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // โหลดข้อมูลกล้อง
  const loadCameraDevices = async () => {
    try {
      //setLoading(true);
      const res = await fetchCameraDevice();
      const cameraDevice: CameraDeviceInterface[] = res.data; // API คืน array
      setDevices(cameraDevice);
      console.log("cameraDevice: ", cameraDevice);
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว:", err);
      messageApi.error("ไม่สามารถโหลดข้อมูลกล้องได้");
    } finally {
      //setLoading(false);
    }
  };

  const loadCameraDevicesWithoutMac = async () => {
    try {
      //setLoading(true);
      const res = await fetchCameraDeviceWithoutMac();
      const cameraDeviceWithoutMac: MeterLocationInterface[] = res.data; // API คืน array
      setLocationDevices(cameraDeviceWithoutMac);
      console.log("cameraDeviceWithoutMac: ", cameraDeviceWithoutMac);
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว:", err);
      messageApi.error("ไม่สามารถโหลดข้อมูลกล้องได้");
    } finally {
      //setLoading(false);
    }
  };

  useEffect(() => {
    loadCameraDevices();
    loadCameraDevicesWithoutMac();
  }, []);

  // เปิด modal (เพิ่ม/แก้ไข)
  const handleOpenModal = (device?: CameraDeviceInterface) => {
    if (device) {
      setSelectedDevice(device);
      setFormData({
        name: device.MeterLocation?.Name ?? "",
        mac: device.MacAddress ?? "",
        status: device.Status ?? true,
      });
    } else {
      setSelectedDevice(null);
      setFormData({ name: "", mac: "", status: true });
    }
    setModalOpen(true);
  };

  // const handleSave = async () => {
  //   try {
  //     if (selectedDevice?.ID) {
  //       await updateCameraDevice(selectedDevice.ID, {
  //         MacAddress: formData.mac,
  //         Status: formData.status,
  //         MeterLocation: { Name: formData.name },
  //       });
  //       messageApi.success("อัปเดตข้อมูลสำเร็จ");
  //     } else {
  //       await createCameraDevice({
  //         MacAddress: formData.mac,
  //         Status: formData.status,
  //         MeterLocation: { Name: formData.name },
  //       });
  //       messageApi.success("เพิ่มอุปกรณ์สำเร็จ");
  //     }
  //     setModalOpen(false);
  //     loadCameraDevices();
  //   } catch (err) {
  //     console.error("บันทึกข้อมูลล้มเหลว:", err);
  //     messageApi.error("ไม่สามารถบันทึกข้อมูลได้");
  //   }
  // };

  // const handleDelete = async (id: number) => {
  //   Modal.confirm({
  //     title: "ยืนยันการลบอุปกรณ์",
  //     content: "คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้?",
  //     okText: "ลบ",
  //     cancelText: "ยกเลิก",
  //     okButtonProps: { danger: true },
  //     onOk: async () => {
  //       try {
  //         await deleteCameraDevice(id);
  //         messageApi.success("ลบอุปกรณ์สำเร็จ");
  //         loadCameraDevices();
  //       } catch (err) {
  //         console.error("ลบข้อมูลล้มเหลว:", err);
  //         messageApi.error("ไม่สามารถลบอุปกรณ์ได้");
  //       }
  //     },
  //   });
  // };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {contextHolder}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-500" /> จัดการอุปกรณ์
          </h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" /> เพิ่มอุปกรณ์
          </button>
        </div>

        <div className="overflow-x-auto bg-white shadow rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">ชื่อ</th>
                <th className="p-3">Mac Address</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.ID} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {device.MeterLocation?.Name ?? `Camera-${device.ID}`}
                  </td>
                  <td className="p-3">{device.MacAddress ?? "N/A"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${
                        device.Status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {device.Status ? "online" : "offline"}
                    </span>
                  </td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleOpenModal(device)}
                      className="p-2 rounded-lg bg-yellow-100 hover:bg-yellow-200"
                    >
                      <Edit className="w-4 h-4 text-yellow-700" />
                    </button>
                    <button
                      //onClick={() => handleDelete(device.ID!)}
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4 text-red-700" />
                    </button>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-gray-500">
                    ไม่พบอุปกรณ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Form */}
        <Modal
  title={selectedDevice ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์"}
  open={isModalOpen}
  onCancel={() => setModalOpen(false)}
  okText="บันทึก"
  cancelText="ยกเลิก"
>
  <div className="flex flex-col gap-4">
    {/* เลือกชื่ออุปกรณ์จาก locationDevices */}
    <div>
      <label className="block mb-1 font-medium">เลือกตำแหน่ง/อุปกรณ์</label>
      <Select
  showSearch
  placeholder="เลือกอุปกรณ์"
  value={formData.locationId}
  onChange={(value) => setFormData({ ...formData, locationId: value })}
  className="w-full"
  options={locationDevices.map((loc) => ({
    label: loc.Name ?? `Device-${loc.ID}`, // ใช้ loc.Name ตรง ๆ
    value: loc.ID,
  }))}
/>


    </div>

    {/* MAC Address */}
    <div>
      <label className="block mb-1 font-medium">Mac Address</label>
      <Input
        value={formData.mac}
        onChange={(e) => setFormData({ ...formData, mac: e.target.value })}
        placeholder="กรอก MAC Address"
      />
    </div>

    {/* Switch สถานะ */}
    {/* <div className="flex items-center gap-3">
      <span>สถานะ:</span>
      <Switch
        checked={formData.status}
        onChange={(checked) => setFormData({ ...formData, status: checked })}
        checkedChildren="Online"
        unCheckedChildren="Offline"
      />
    </div> */}
  </div>
</Modal>

      </div>
    </div>
  );
};

export default DeviceManager;
