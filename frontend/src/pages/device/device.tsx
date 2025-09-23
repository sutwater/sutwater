import React, { useEffect, useState } from 'react';
import { Camera, Wifi, WifiOff, Battery, Settings, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchCameraDevice, fetchCameraDeviceWithoutMac } from "../../services/https";// API ดึงข้อมูลจริง
import type { CameraDeviceInterface, MeterLocationInterface } from "../../interfaces/InterfaceAll";

const DeviceManagement: React.FC = () => {
  const [allDevices, setAllDevices] = useState<CameraDeviceInterface[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<CameraDeviceInterface | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const res = await fetchCameraDevice();
        const devices: CameraDeviceInterface[] = res.data;
        setAllDevices(devices);
      } catch (err) {
        console.error("โหลดข้อมูลอุปกรณ์ล้มเหลว:", err);
      }
    };
    loadDevices();
  }, []);

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-500';
    if (battery > 20) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: boolean) => (status ? 'text-green-500' : 'text-red-500');

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto">
        <div className="">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">จัดการอุปกรณ์กล้อง</h1>
          <p className="text-gray-600">ติดตามและจัดการสถานะอุปกรณ์กล้องทั้งหมด</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">อุปกรณ์ทั้งหมด</p>
              <p className="text-xl font-bold text-gray-900">{allDevices.length}</p>
            </div>
            <Camera className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ออนไลน์</p>
              <p className="text-xl font-bold text-green-600">{allDevices.filter(d => d.Status).length}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">แบตต่ำ</p>
              <p className="text-xl font-bold text-amber-600">{allDevices.filter(d => (d.Battery || 0) < 20).length}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ปัญหา WiFi</p>
              <p className="text-xl font-bold text-red-600">{allDevices.filter(d => !d.Wifi).length}</p>
            </div>
            <WifiOff className="h-6 w-6 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">รายการอุปกรณ์</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MacAddress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">พิกัดตำแหน่ง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WiFi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แบตเตอรี่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDevices.map(device => (
                <tr key={device.ID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                    <Camera className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 font-mono">{device.MacAddress}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{device.MeterLocation?.Name}</div>
                    <div className="text-sm text-gray-500">
                      {device.MeterLocation?.Latitude?.toFixed(4)}, {device.MeterLocation?.Longitude?.toFixed(4)}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${device.Status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-sm ${getStatusColor(device.Status || false)}`}>
                        {device.Status ? 'ออนไลน์' : 'ออฟไลน์'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {device.Wifi ? <Wifi className="h-4 w-4 text-green-500 mr-1" /> : <WifiOff className="h-4 w-4 text-red-500 mr-1" />}
                      <span className={`text-sm ${device.Wifi ? 'text-green-600' : 'text-red-600'}`}>
                        {device.Wifi ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Battery className={`h-4 w-4 mr-1 ${getBatteryColor(device.Battery || 0)}`} />
                      <span className={`text-sm ${getBatteryColor(device.Battery || 0)}`}>{device.Battery}%</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button onClick={() => setSelectedDevice(device)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedDevice(device); setShowSettings(true); }} className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50">
                      <Settings className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {allDevices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-gray-500">
                    ไม่พบอุปกรณ์
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDevice && (
<div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  รายละเอียดอุปกรณ์ #{selectedDevice.ID}
                </h3>
                <button
                  onClick={() => {
                    setSelectedDevice(null);
                    setShowSettings(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">MAC Address</label>
                  <p className="text-gray-900 font-mono">{selectedDevice.MacAddress}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">ตำแหน่งติดตั้ง</label>
                  <p className="text-gray-900">{selectedDevice.MeterLocation?.Name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">สถานะ</label>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${selectedDevice.Status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={getStatusColor(selectedDevice.Status || false)}>
                        {selectedDevice.Status ? 'ออนไลน์' : 'ออฟไลน์'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">แบตเตอรี่</label>
                    <div className="flex items-center mt-1">
                      <Battery className={`h-4 w-4 mr-1 ${getBatteryColor(selectedDevice.Battery || 0)}`} />
                      <span className={getBatteryColor(selectedDevice.Battery || 0)}>
                        {selectedDevice.Battery}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">การเชื่อมต่อ WiFi</label>
                  <div className="flex items-center mt-1">
                    {selectedDevice.Wifi ? 
                      <Wifi className="h-4 w-4 text-green-500 mr-1" /> : 
                      <WifiOff className="h-4 w-4 text-red-500 mr-1" />
                    }
                    <span className={selectedDevice.Wifi ? 'text-green-600' : 'text-red-600'}>
                      {selectedDevice.Wifi ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                    </span>
                  </div>
                </div>

                {showSettings && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-800 mb-3">การตั้งค่าอุปกรณ์</h4>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        รีสตาร์ทอุปกรณ์
                      </button>
                      <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        ตรวจสอบการเชื่อมต่อ
                      </button>
                      <button className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                        อัพเดทเฟิร์มแวร์
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      

      {/* Summary Cards */}
      

      {/* Device Table */}
    

      {/* Device Detail Modal */}
      
    </div>
  );
};

export default DeviceManagement;
