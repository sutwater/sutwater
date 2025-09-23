import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Satellite, Plus } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { CreateMeter } from '../../services/https';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MeterLocationInterface } from '../../interfaces/InterfaceAll';
import './custom-tooltip.css';

import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const defaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Component สำหรับคลิกเพิ่ม marker
const LocationMarker = ({ onAdd }: { onAdd: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const WaterMeterMap = () => {
  //const [meters, setMeters] = useState<MeterInterface[]>([]);
  const [newMarker, setNewMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [messageApi] = message.useMessage();
  const navigate = useNavigate();

  const [newName, setNewName] = useState('');
  const [mode, setMode] = useState<'road' | 'satellite'>('satellite');
  const [addingMode, setAddingMode] = useState(false); // เพิ่ม state นี้
  const { meters, waterusage, getMeters, loading, setLoading } = useAppContext();

  waterusage.forEach((log, idx) => {
    console.log(`waterlog[${idx}] MeterLocation ID:`, log.CameraDevice?.MeterLocation?.ID);
  });

  console.log("meters: ", meters)
  // ฟังก์ชันสร้าง marker พร้อมเลข
  const getMeterIcon = (value?: number) => {
    return L.divIcon({
      className: "custom-meter-icon",
      html: `
      <div style="
        background: ${value !== undefined ? "#2563eb" : "#6b7280"};
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 0 6px rgba(0,0,0,0.3);
      ">
        ${value !== undefined ? value : ""}
      </div>
    `,
      iconSize: [60, 60],
      iconAnchor: [22, 45], // ให้ marker อยู่ตรงตำแหน่งพอดี
      popupAnchor: [0, -45],
    });
  };

  const handleAddMarker = (lat: number, lng: number) => {
    setNewMarker({ lat, lng });
    setNewName('');
    setAddingMode(false);
  };

  // ฟังก์ชันบันทึกมิเตอร์ใหม่
  const handleSaveMeter = async () => {
    if (!newMarker || newName.trim() === '') {
      alert('กรุณากรอกชื่อมิเตอร์และเลือกตำแหน่งบนแผนที่');
      return;
    }
    try {
      const payload: MeterLocationInterface = {
        Name: newName,
        Latitude: newMarker.lat,
        Longitude: newMarker.lng,
      };

      let res = await CreateMeter(payload);
      if (res.status == 200) {
        messageApi.open({
          type: "success",
          content: "Create ingredient successfully",
        });
      } else {
        messageApi.open({
          type: "error",
          content: "Create ingredient Error",
        });
      }

      // เคลียร์ข้อมูล
      setNewMarker(null);
      setNewName('');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการบันทึกมิเตอร์:', error);
    }
  };

  const tileUrl =
    mode === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution =
    mode === 'satellite'
      ? 'Tiles © Esri'
      : '&copy; OpenStreetMap contributors';
  useEffect(() => {
    setLoading(true);
    getMeters()
      .finally(() => {
        setTimeout(() => setLoading(false), 1000);
      });
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {/* ปุ่มสลับโหมดแผนที่ */}
      <div className="absolute top-40 right-15 z-[10] bg-white p-2 rounded-xl shadow-lg flex gap-2">
        <button
          onClick={() => setMode('satellite')}
          className={`flex flex-col items-center p-2 rounded-lg border ${mode === 'satellite'
              ? 'border-green-500 bg-green-50'
              : 'border-transparent hover:bg-gray-100'
            }`}
        >
          <Satellite className="w-6 h-6 mb-1" />
          <span className="text-xs">ดาวเทียม</span>
        </button>

        <button
          onClick={() => setMode('road')}
          className={`flex flex-col items-center p-2 rounded-lg border ${mode === 'road'
              ? 'border-green-500 bg-green-50'
              : 'border-transparent hover:bg-gray-100'
            }`}
        >
          <Map className="w-6 h-6 mb-1" />
          <span className="text-xs">ถนน</span>
        </button>
      </div>

      <div className="absolute top-40 right-50 z-[10] bg-white p-2 rounded-xl shadow-lg flex flex-col items-center gap-1 w-22 select-none">
        <button
          onClick={() => setAddingMode(!addingMode)}
          className={`flex flex-col items-center p-2 rounded-lg border w-full
            ${addingMode
              ? 'border-orange-500 bg-orange-50 text-orange-600'
              : 'border-transparent hover:bg-gray-100 text-gray-700'
            }`}
        >
          <Plus className={`w-6 h-6 mb-1 ${addingMode ? 'text-orange-600' : 'text-gray-500'}`} />
          <span className="text-xs font-medium">{addingMode ? 'กำลังเพิ่ม' : 'เพิ่มจุด'}</span>
        </button>
      </div>

      <MapContainer key={mode} center={[14.86750, 102.03415]} zoom={17} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        {addingMode && <LocationMarker onAdd={handleAddMarker} />}

        {meters
          .filter(m => typeof m.Latitude === "number" && typeof m.Longitude === "number")
          .map((meter) => {
            // หา WaterMeterValue ของ log ที่ MeterLocation.ID ตรงกับ meter.ID
            const currentLog = waterusage.find(
              (log) => log.CameraDevice?.MeterLocation?.ID === meter.ID
            );

            return (
              <Marker key={meter.ID} position={[meter.Latitude, meter.Longitude]} icon={getMeterIcon(currentLog?.MeterValue)}>
                <Tooltip
                  direction="top"
                  offset={[0, -35]}
                  opacity={1}
                  permanent
                  className={`custom-tooltip ${mode === "satellite" ? "tooltip-satellite" : ""}`}
                >
                  {meter.Name ?? "ไม่มีชื่อ"}
                </Tooltip>
                <Popup>
                  <div className="w-64 p-4">
                    <h2 className="text-lg font-semibold mb-2 text-center text-gray-800">
                      {meter.Name ?? "ไม่มีชื่อ"}
                    </h2>
                    <p className="text-sm text-gray-700 mb-1">
                      📅 วันที่อ่านล่าสุด:{" "}
                      {currentLog?.Timestamp
                        ? new Date(currentLog.Timestamp).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        : "ไม่มีข้อมูล"}
                    </p>
                    <p className="text-sm text-gray-700 mb-1">
                      💧 ค่าที่อ่าน:{" "}
                      {currentLog?.MeterValue !== undefined
                        ? `${currentLog.MeterValue} ลูกบาศก์เมตร`
                        : "ไม่มีข้อมูล"}
                    </p>
                    <button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 rounded-md shadow cursor-pointer"
                      onClick={() => navigate(`/waterdetail/${meter.ID}`)}
                    >
                      ดูข้อมูลเพิ่มเติม
                    </button>
                  </div>
                </Popup>


              </Marker>
            );
          })}

        {newMarker && (
          <Marker position={[newMarker.lat, newMarker.lng]}>
            <Popup>
              <div className="w-64 p-4">
                <h2 className="text-lg font-semibold mb-3 text-center text-gray-800">
                  เพิ่มมิเตอร์ รพ.มทส.
                </h2>
                <input
                  type="text"
                  placeholder="ชื่อมิเตอร์"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold py-2 rounded-md shadow-md"
                  onClick={handleSaveMeter}
                >
                  บันทึก
                </button>
              </div>
            </Popup>
          </Marker>
        )}

      </MapContainer>
    </div>
  );
};


export default WaterMeterMap;