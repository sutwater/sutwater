// WaterMeterMap.tsx
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from '../../contexts/AppContext';

// แก้ marker icon ไม่แสดง
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

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
  const [newName, setNewName] = useState('');
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [addingMode, setAddingMode] = useState(false); // เพิ่ม state นี้
  const { meters } = useAppContext();

  console.log(meters)

  const handleAddMarker = (lat: number, lng: number) => {
    setNewMarker({ lat, lng });
    setNewName('');
    setAddingMode(false); // ปิดโหมดหลังจากคลิกแผนที่
  };

  // const handleSave = () => {
  //   if (!newMarker || newName.trim() === '') return;

    //const newId = meters.length + 1;
    // const newMeter: MeterInterface = {
    //   ID: newId,
    //   name: newName,
    //   latitude: newMarker.lat,
    //   longtitude: newMarker.lng,
    // };

  //   setMeters([...meters, newMeter]);
  //   setNewMarker(null);
  //   setNewName('');
  // };

  const tileUrl = satelliteMode
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = satelliteMode
    ? 'Tiles © Esri'
    : '&copy; OpenStreetMap contributors';

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      {/* ปุ่มสลับโหมดแผนที่ */}
      <div className="absolute right-4 top-35 z-[1000] bg-white p-3 rounded shadow-md max-w-md">
        <h1 className="text-center text-2xl font-bold mb-1">แมพ</h1>
        <button
          onClick={() => setSatelliteMode(!satelliteMode)}
          className="mt-1 bg-green-600 text-white px-3 py-1 rounded"
        >
          {satelliteMode ? 'แผนที่ถนน' : 'ภาพดาวเทียม'}
        </button>
      </div>

      {/* ปุ่มเข้าสู่โหมดเพิ่มมิเตอร์ */}
      <div className="absolute right-4 bottom-10 z-[1000] bg-white p-3 rounded shadow-md max-w-md">
        <h1 className="text-center text-2xl font-bold mb-1">เพิ่ม</h1>
        <button
          onClick={() => setAddingMode(true)}
          className="mt-1 bg-green-600 text-white px-3 py-1 rounded"
        >
          เพิ่มมิเตอร์
        </button>
      </div>

      <MapContainer center={[14.86397, 102.03537]} zoom={17} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        {/* คลิกเพิ่ม marker เฉพาะเมื่อเปิดโหมด */}
        {addingMode && <LocationMarker onAdd={handleAddMarker} />}

        {meters
  .filter(m => typeof m.Latitude === 'number' && typeof m.Longtitude === 'number')
  .map((meter) => (
    <Marker key={meter.ID} position={[meter.Latitude, meter.Longtitude]}>
      <Popup>
        <strong>{meter.Name ?? "ไม่มีชื่อ"}</strong>
        <br />
        พิกัด: {meter.Latitude.toFixed(4)} , {meter.Longtitude.toFixed(4)}
      </Popup>
    </Marker>
))}


        {newMarker && (
          <Marker position={[newMarker.lat, newMarker.lng]}>
            <Popup>
              <div>
                <p>เพิ่มมิเตอร์ที่นี่:</p>
                <input
                  type="text"
                  placeholder="ชื่อมิเตอร์"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border p-1 mb-1 w-full"
                />
                <button className="bg-blue-500 text-white px-2 py-1 rounded">
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
