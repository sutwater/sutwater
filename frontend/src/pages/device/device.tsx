import React, { useEffect, useState } from 'react';
import { Camera, Plus, Settings, Edit2, Trash2, MapPin, X } from 'lucide-react';
import { fetchCameraDevice, deleteCameraDeviceByMeterLocationId, updateCameraDeviceMacAddress } from "../../services/https";
import type { CameraDeviceInterface } from "../../interfaces/InterfaceAll";
import CreateCameraDevicePage from './CreateCameraDevice';
import { useAppContext } from '../../contexts/AppContext';

const DeviceManagement: React.FC = () => {
  const [allDevices, setAllDevices] = useState<CameraDeviceInterface[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<CameraDeviceInterface | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedMacAddress, setEditedMacAddress] = useState("");
  const { getNotification } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadDevices = async () => {
    setIsLoading(true); // เริ่มโหลด
    try {
      const res = await fetchCameraDevice();
      setAllDevices(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลอุปกรณ์ล้มเหลว:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 500); // โหลดเสร็จ
    }
  };


  useEffect(() => {
    if (selectedDevice) {
      setEditedMacAddress(selectedDevice.MacAddress || "");
      setIsEditing(false);
    }
  }, [selectedDevice]);

  const handleDeleteDevice = async (device: CameraDeviceInterface) => {
    if (!device.MeterLocation?.ID) return;

    if (!window.confirm(`คุณต้องการลบอุปกรณ์ ${device.MacAddress} ใช่หรือไม่?`)) return;

    setIsLoading(true);
    try {
      await deleteCameraDeviceByMeterLocationId(device.MeterLocation.ID.toString());
      setAllDevices(prev => prev.filter(d => d.ID !== device.ID));
      setSelectedDevice(null);
      setShowSettings(false);
      alert("ลบอุปกรณ์เรียบร้อยแล้ว");
    } catch (err) {
      console.error("ลบอุปกรณ์ล้มเหลว:", err);
      alert("เกิดข้อผิดพลาดในการลบอุปกรณ์");
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };


  useEffect(() => {
    loadDevices();
  }, []);

  const handleUpdateMacAddress = async () => {
    if (!selectedDevice?.ID) return;
    setIsLoading(true);
    try {
      await updateCameraDeviceMacAddress(selectedDevice.ID.toString(), editedMacAddress);
      setAllDevices(prev =>
        prev.map(d =>
          d.ID === selectedDevice.ID
            ? { ...d, MacAddress: editedMacAddress }
            : d
        )
      );
      setSelectedDevice(prev => prev ? { ...prev, MacAddress: editedMacAddress } : null);
      setIsEditing(false);
      alert("อัปเดต MacAddress เรียบร้อยแล้ว");
      getNotification();
    } catch (err) {
      console.error("อัปเดต MacAddress ล้มเหลว:", err);
      alert("เกิดข้อผิดพลาดในการอัปเดต MacAddress");
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };


  const filteredDevices = allDevices.filter(device =>
    device.MacAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.MeterLocation?.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">จัดการอุปกรณ์กล้อง</h1>
          <p className="text-gray-600">ติดตามและจัดการอุปกรณ์กล้องทั้งหมดในระบบ</p>
        </div>

        {/* Summary Card */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-400 p-4 rounded-xl">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">อุปกรณ์ทั้งหมดในระบบ</p>
                  <p className="text-3xl font-bold text-gray-900">{allDevices.length} <span className="text-lg text-gray-500">เครื่อง</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Add Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ค้นหา MAC Address หรือชื่อตำแหน่ง..."
              className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium cursor-pointer"
          >
            <Plus className="w-5 h-5" /> เพิ่มอุปกรณ์
          </button>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredDevices.map(device => (
            <div
              key={device.ID}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
            >
              {/* Card Header */}
              <div className="bg-blue-500  p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">อุปกรณ์ #{device.ID}</p>
                      <p className="text-blue-100 text-xs font-mono">{device.MacAddress}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDevice(device);
                      setShowSettings(true);
                    }}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{device.MeterLocation?.Name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {device.MeterLocation?.Latitude.toFixed(4)}, {device.MeterLocation?.Longitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDevice(device);
                    setShowSettings(true);
                  }}
                  className="w-full mt-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                >
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}

          {filteredDevices.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">ไม่พบอุปกรณ์</p>
              <p className="text-gray-400 text-sm mt-1">ลองค้นหาด้วยคำอื่นหรือเพิ่มอุปกรณ์ใหม่</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && <CreateCameraDevicePage setShowAddModal={setShowAddModal} />}

      {/* Device Details Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">รายละเอียดอุปกรณ์</h3>
                    <p className="text-blue-100 text-sm">ID: #{selectedDevice.ID}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedDevice(null);
                    setShowSettings(false);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* MAC Address Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">MAC Address</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      value={editedMacAddress}
                      onChange={(e) => setEditedMacAddress(e.target.value)}
                    />
                    <button
                      onClick={handleUpdateMacAddress}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium cursor-pointer"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded-lg border border-gray-200">
                      {selectedDevice.MacAddress}
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" /> แก้ไข
                    </button>
                  </div>
                )}
              </div>

              {/* Location Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">ตำแหน่งติดตั้ง</label>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium">{selectedDevice.MeterLocation?.Name}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      พิกัด: {selectedDevice.MeterLocation?.Latitude.toFixed(6)}, {selectedDevice.MeterLocation?.Longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {showSettings && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDeleteDevice(selectedDevice)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    <Trash2 className="w-5 h-5" />
                    ลบ MacAddress อุปกรณ์
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;