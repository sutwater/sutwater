import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, Form, InputNumber, Input, Modal, message, Upload } from "antd";
import type { UploadFile } from "antd";
import { Plus, ImagePlus } from "lucide-react";
import { useAppContext } from "../../contexts/AppContextDef";
import { GetDevices } from "../../services/https/device";
import { GetWaterValues, CreateWaterValueManual } from "../../services/https/waterValue";

// ——— Types ———
interface DeviceItem { id: number; mac_address: string; location_id: number | null }
interface WaterItem  { id: number; meter_value: number; timestamp: string }

// ——— Map pin ———
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

const HOSPITAL_POLYGON: [number, number][] = [
  [14.872057, 102.032653],
  [14.868710, 102.037165],
  [14.863138, 102.037573],
  [14.865121, 102.028199],
];
const WORLD_RING: [number, number][] = [[90,-180],[90,180],[-90,180],[-90,-180]];

// ——— Popup content ———
function MeterPopupContent({
  locationId,
  buildingName,
  deviceId,
  canAdd,
  onAddReading,
}: {
  locationId: number;
  buildingName: string;
  deviceId: number | undefined;
  canAdd: boolean;
  onAddReading: (deviceId: number, buildingName: string) => void;
}) {
  const navigate = useNavigate();
  const [readings, setReadings] = useState<WaterItem[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (deviceId == null) return;
    setFetching(true);
    GetWaterValues(deviceId).then((res) => {
      setFetching(false);
      if (res?.status === 200) {
        const raw: WaterItem[] = res.data?.data ?? res.data ?? [];
        const sorted = [...raw]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 2);
        setReadings(sorted);
      }
    });
  }, [deviceId]);

  const latest = readings[0];
  const prev   = readings[1];
  const usage  = latest && prev ? latest.meter_value - prev.meter_value : null;

  return (
    <div style={{ minWidth: 210, fontFamily: "inherit" }}>
      {/* Header */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginBottom: 10,
                  paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
        {buildingName}
      </p>

      {!deviceId ? (
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>ไม่พบอุปกรณ์</p>
      ) : fetching ? (
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>กำลังโหลด...</p>
      ) : !latest ? (
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>ยังไม่มีข้อมูล</p>
      ) : (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>ค่ามิเตอร์</span>
            <div style={{ textAlign:"right" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0d9488" }}>
                {latest.meter_value.toLocaleString()}
              </span>
              <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 3 }}>m³</span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: "#9ca3af", textAlign:"right", marginBottom: 8 }}>
            {dayjs(latest.timestamp).format("D MMM YYYY HH:mm")}
          </p>
          {usage != null && (
            <div style={{ padding:"5px 10px", background:"#f0fdf4", borderRadius: 7,
                          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize: 11, color: "#166534" }}>ใช้ล่าสุด</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                {usage} m³
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <button
          onClick={() => navigate(`/water-detail?id=${locationId}`)}
          style={{ flex: 1, padding:"7px 0", background:"#0d9488", color:"white",
                   border:"none", borderRadius: 7, fontSize: 12, fontWeight: 600,
                   cursor:"pointer", letterSpacing: 0.3 }}
        >
          ดูรายละเอียด →
        </button>
        {canAdd && deviceId != null && (
          <button
            onClick={() => onAddReading(deviceId, buildingName)}
            style={{ padding:"7px 10px", background:"#f0fdf4", color:"#0d9488",
                     border:"1.5px solid #0d9488", borderRadius: 7, fontSize: 12,
                     fontWeight: 600, cursor:"pointer", display:"flex",
                     alignItems:"center", gap: 3 }}
          >
            <Plus size={13} /> เพิ่ม
          </button>
        )}
      </div>
    </div>
  );
}

// ——— Fit bounds ———
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) { map.setView(positions[0], 17); return; }
    map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] });
  }, [map, positions]);
  return null;
}

// ——— Main page ———
export default function MeterMap() {
  const { meters } = useAppContext();

  const roleId = localStorage.getItem("role_id");
  const canAdd = roleId === "1" || roleId === "2";

  const [locationDeviceMap, setLocationDeviceMap] = useState<Record<number, number>>({});

  useEffect(() => {
    GetDevices().then((res) => {
      if (res?.status === 200) {
        const list: DeviceItem[] = res.data?.data ?? res.data ?? [];
        const map: Record<number, number> = {};
        list.forEach((d) => { if (d.location_id != null) map[d.location_id] = d.id; });
        setLocationDeviceMap(map);
      }
    });
  }, []);

  const positions = useMemo<[number, number][]>(
    () => meters.map((m) => [m.latitude, m.longitude]),
    [meters]
  );

  // ——— Create modal ———
  const [createTarget, setCreateTarget] = useState<{ deviceId: number; buildingName: string } | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const openCreate = (deviceId: number, buildingName: string) => {
    setCreateTarget({ deviceId, buildingName });
  };

  const closeCreate = () => {
    setCreateTarget(null);
    form.resetFields();
    setFileList([]);
  };

  const handleCreate = async () => {
    if (!createTarget) return;
    try {
      const values = await form.validateFields();
      setCreateLoading(true);
      const payload: { meter_value: number; device_id: number; timestamp?: string; note?: string; image?: File } = {
        meter_value: values.meter_value,
        device_id: createTarget.deviceId,
      };
      if (values.timestamp) payload.timestamp = (values.timestamp as Dayjs).toISOString();
      if (values.note)      payload.note = values.note;
      if (fileList[0]?.originFileObj) payload.image = fileList[0].originFileObj;

      const res = await CreateWaterValueManual(payload);
      setCreateLoading(false);
      if (res?.status === 200 || res?.status === 201) {
        message.success(`บันทึกค่ามิเตอร์ "${createTarget.buildingName}" สำเร็จ`);
        closeCreate();
      } else {
        message.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      // validation failed
    }
  };

  return (
    <div className="relative" style={{ height: "calc(100vh - 48px)" }}>
      <MapContainer center={DEFAULT_CENTER} zoom={15} scrollWheelZoom
                    style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds positions={positions} />

        <Polygon positions={[WORLD_RING, HOSPITAL_POLYGON]}
                 pathOptions={{ fillColor:"#000", fillOpacity:0.45, stroke:false }} />
        <Polygon positions={HOSPITAL_POLYGON}
                 pathOptions={{ color:"#0d9488", weight:2, dashArray:"8 5", fillOpacity:0 }} />

        {meters.map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={PIN_ICON}>
            <Tooltip permanent direction="bottom" offset={[0, 6]} opacity={1}>
              <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {m.building_name}
              </span>
            </Tooltip>
            <Popup minWidth={220} maxWidth={260}>
              {m.id != null && (
                <MeterPopupContent
                  locationId={m.id}
                  buildingName={m.building_name}
                  deviceId={locationDeviceMap[m.id]}
                  canAdd={canAdd}
                  onAddReading={openCreate}
                />
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ——— Create modal (ต้องอยู่นอก MapContainer) ——— */}
      <Modal
        title={`เพิ่มค่ามิเตอร์ — ${createTarget?.buildingName ?? ""}`}
        open={createTarget != null}
        onOk={handleCreate}
        onCancel={closeCreate}
        okText="บันทึก"
        cancelText="ยกเลิก"
        confirmLoading={createLoading}
        okButtonProps={{ className: "!bg-teal-600 !border-teal-600 hover:!bg-teal-700" }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="meter_value"
            label="ค่ามิเตอร์ (m³)"
            rules={[{ required: true, message: "กรุณากรอกค่ามิเตอร์" }]}
          >
            <InputNumber className="w-full" min={0} placeholder="เช่น 12345" />
          </Form.Item>
          <Form.Item name="timestamp" label="วันที่และเวลา (ปล่อยว่างเพื่อใช้เวลาปัจจุบัน)">
            <DatePicker
              showTime
              className="w-full"
              format="DD/MM/YYYY HH:mm"
              disabledDate={(d) => d.isAfter(dayjs(), "day")}
              placeholder="ไม่ระบุ = ใช้เวลาปัจจุบัน"
            />
          </Form.Item>
          <Form.Item name="note" label="หมายเหตุ">
            <Input.TextArea rows={2} placeholder="หมายเหตุ (ถ้ามี)" />
          </Form.Item>
          <Form.Item label="รูปภาพมิเตอร์ (ถ้ามี)">
            <Upload.Dragger
              accept="image/*"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl)}
              listType="picture"
            >
              <p className="ant-upload-drag-icon flex justify-center">
                <ImagePlus size={28} className="text-teal-500" />
              </p>
              <p className="ant-upload-text text-sm">คลิกหรือลากไฟล์รูปมาวางที่นี่</p>
              <p className="ant-upload-hint text-xs text-gray-400">รองรับ JPG, PNG, WEBP (สูงสุด 1 ไฟล์)</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
