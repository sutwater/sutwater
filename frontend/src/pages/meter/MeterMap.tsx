import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAppContext } from "../../contexts/AppContextDef";
import { GetMeterLocationDetail } from "../../services/https/waterValue";
import { DailyWaterUsageInterface } from "../../interfaces/InterfaceAll";

// Teal SVG pin
const PIN_ICON = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 24 12 24S24 20 24 12C24 5.373 18.627 0 12 0z" fill="#0d9488"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  className: "",
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -44],
});

const DEFAULT_CENTER: [number, number] = [14.88, 102.016];

// ——— Hospital boundary (actual campus corners, clockwise) ———
const HOSPITAL_POLYGON: [number, number][] = [
  [14.872057, 102.032653], // ซ้ายบน
  [14.868710, 102.037165], // ขวาบน
  [14.863138, 102.037573], // ขวาล่าง
  [14.865121, 102.028199], // ซ้ายล่าง
];

const WORLD_RING: [number, number][] = [
  [90, -180], [90, 180], [-90, 180], [-90, -180],
];

// ——— Popup content — lazy-loads water data when popup opens ———
function MeterPopupContent({
  locationId,
  buildingName,
}: {
  locationId: number;
  buildingName: string;
}) {
  const navigate = useNavigate();
  const [usages, setUsages] = useState<DailyWaterUsageInterface[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    GetMeterLocationDetail(String(locationId)).then((res) => {
      setFetching(false);
      if (res?.status === 200) {
        const raw = res.data?.data ?? res.data;
        const list: DailyWaterUsageInterface[] =
          raw?.DailyWaterUsage ?? raw?.daily_water_usage ?? [];
        const sorted = [...list].sort(
          (a, b) =>
            new Date(b.Timestamp ?? "").getTime() -
            new Date(a.Timestamp ?? "").getTime()
        );
        setUsages(sorted.slice(0, 2));
      }
    });
  }, [locationId]);

  const row = (label: string, value: string, sub?: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0d9488" }}>{value}</span>
        {sub && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ minWidth: 210, fontFamily: "inherit" }}>
      {/* Header */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
        {buildingName}
      </p>

      {/* Water data */}
      {fetching ? (
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>กำลังโหลดข้อมูล...</p>
      ) : usages.length > 0 ? (
        <div style={{ marginBottom: 10 }}>
          {row(
            "ล่าสุด",
            `${usages[0].Usage?.toFixed(2) ?? "—"} m³`,
            usages[0].Timestamp ? dayjs(usages[0].Timestamp).format("D MMM") : undefined
          )}
          {usages[1] &&
            row(
              "ก่อนหน้า",
              `${usages[1].Usage?.toFixed(2) ?? "—"} m³`,
              usages[1].Timestamp ? dayjs(usages[1].Timestamp).format("D MMM") : undefined
            )}
          {usages[0].Usage != null && usages[1]?.Usage != null && (
            <div style={{ marginTop: 6, padding: "4px 8px", background: "#f0fdf4", borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: "#166534" }}>
                เปลี่ยนแปลง{" "}
                <strong>
                  {(usages[0].Usage - usages[1].Usage) >= 0 ? "+" : ""}
                  {(usages[0].Usage - usages[1].Usage).toFixed(2)} m³
                </strong>
              </span>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>ไม่มีข้อมูลการใช้น้ำ</p>
      )}

      {/* Detail button */}
      <button
        onClick={() => navigate(`/water-detail?id=${locationId}`)}
        style={{
          width: "100%",
          padding: "7px 0",
          background: "#0d9488",
          color: "white",
          border: "none",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: 0.3,
        }}
      >
        ดูรายละเอียด →
      </button>
    </div>
  );
}

// ——— Fit map to all markers ———
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) { map.setView(positions[0], 17); return; }
    map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
  }, [map, positions]);
  return null;
}

export default function MeterMap() {
  const { meters } = useAppContext();

  const positions = useMemo<[number, number][]>(
    () => meters.map((m) => [m.latitude, m.longitude]),
    [meters]
  );

  return (
    <div className="relative" style={{ height: "calc(100vh - 48px)" }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={15}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <FitBounds positions={positions} />

        {/* Inverse mask — dim outside hospital */}
        <Polygon
          positions={[WORLD_RING, HOSPITAL_POLYGON]}
          pathOptions={{ fillColor: "#000000", fillOpacity: 0.45, stroke: false }}
        />
        {/* Hospital border */}
        <Polygon
          positions={HOSPITAL_POLYGON}
          pathOptions={{ color: "#0d9488", weight: 2, dashArray: "8 5", fillOpacity: 0 }}
        />

        {meters.map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={PIN_ICON}>
            <Tooltip permanent direction="bottom" offset={[0, 6]} opacity={1}>
              <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {m.building_name}
              </span>
            </Tooltip>
            <Popup minWidth={220} maxWidth={260}>
              {m.id != null && (
                <MeterPopupContent locationId={m.id} buildingName={m.building_name} />
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
