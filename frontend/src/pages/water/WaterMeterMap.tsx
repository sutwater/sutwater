// WaterMeterMap.tsx
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// ข้อมูลของมิเตอร์
type Meter = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

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
  const [meters, setMeters] = useState<Meter[]>([]);
  const [newMarker, setNewMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [newName, setNewName] = useState('');
  const [satelliteMode, setSatelliteMode] = useState(false);

  const handleAddMarker = (lat: number, lng: number) => {
    setNewMarker({ lat, lng });
    setNewName('');
  };

  const handleSave = () => {
    if (!newMarker || newName.trim() === '') return;

    const newId = meters.length + 1;
    const newMeter: Meter = {
      id: newId,
      name: newName,
      lat: newMarker.lat,
      lng: newMarker.lng,
    };

    setMeters([...meters, newMeter]);
    setNewMarker(null);
    setNewName('');
  };

  const tileUrl = satelliteMode
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = satelliteMode
    ? 'Tiles © Esri'
    : '&copy; OpenStreetMap contributors';

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div className="absolute z-[1000] bg-white p-3 rounded shadow-md m-3 max-w-md">
        <h1 className="text-2xl font-bold mb-1">โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี</h1>
        <button
          onClick={() => setSatelliteMode(!satelliteMode)}
          className="mt-1 bg-green-600 text-white px-3 py-1 rounded"
        >
          {satelliteMode ? 'แสดงแผนที่ถนน' : 'แสดงภาพดาวเทียม'}
        </button>
      </div>

      <MapContainer center={[14.86397, 102.03537]} zoom={17} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution={tileAttribution} url={tileUrl} />
        <LocationMarker onAdd={handleAddMarker} />

        {meters.map((meter) => (
          <Marker key={meter.id} position={[meter.lat, meter.lng]}>
            <Popup>
              <strong>{meter.name}</strong>
              <br />
              พิกัด: {meter.lat.toFixed(5)}, {meter.lng.toFixed(5)}
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
                <button onClick={handleSave} className="bg-blue-500 text-white px-2 py-1 rounded">
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
