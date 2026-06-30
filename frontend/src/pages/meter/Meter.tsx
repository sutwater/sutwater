import { useEffect, useState } from "react";
import { message } from "antd";
import { Search, Plus, Pencil, Trash2, X, MapPin, Save } from "lucide-react";
import dayjs from "dayjs";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MeterLocationInterface } from "../../interfaces/InterfaceAll";
import { GetMerters, CreateMeter, UpdateMeter, DeleteMeter } from "../../services/https/meter";

// Custom teal pin using SVG — avoids Vite asset-pipeline issues with default Leaflet icons
const PIN_ICON = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 24 12 24S24 20 24 12C24 5.373 18.627 0 12 0z" fill="#0d9488"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  className: "",
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
});

const DEFAULT_CENTER: [number, number] = [14.88, 102.016];

const INPUT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder:text-gray-400";
const LABEL = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

type FormState = {
  building_name: string;
  latitude: number | null;
  longitude: number | null;
};

const EMPTY_FORM: FormState = { building_name: "", latitude: null, longitude: null };

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MeterLocationManagement() {
  const [msgApi, ctx] = message.useMessage();
  const [meters, setMeters] = useState<MeterLocationInterface[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<MeterLocationInterface | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MeterLocationInterface | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeters = async () => {
    setLoading(true);
    const res = await GetMerters();
    setLoading(false);
    if (res?.status === 200) {
      const data = res.data?.data ?? res.data;
      setMeters(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (m: MeterLocationInterface) => {
    setEditTarget(m);
    setForm({ building_name: m.building_name, latitude: m.latitude, longitude: m.longitude });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const isValid =
    form.building_name.trim() !== "" &&
    form.latitude !== null &&
    form.longitude !== null;

  const handleSave = async () => {
    if (!isValid || form.latitude === null || form.longitude === null) return;
    setSaving(true);
    const payload = {
      building_name: form.building_name.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    };
    const res = editTarget?.id
      ? await UpdateMeter(editTarget.id, payload)
      : await CreateMeter(payload);
    setSaving(false);
    if (res?.status === 200 || res?.status === 201) {
      msgApi.success(editTarget ? "แก้ไขจุดมิเตอร์สำเร็จ" : "เพิ่มจุดมิเตอร์สำเร็จ");
      closeModal();
      fetchMeters();
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    const res = await DeleteMeter(deleteTarget.id);
    setDeleting(false);
    if (res?.status === 200 || res?.status === 204) {
      msgApi.success("ลบจุดมิเตอร์สำเร็จ");
      setDeleteTarget(null);
      fetchMeters();
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  const filtered = meters.filter((m) =>
    m.building_name.toLowerCase().includes(search.toLowerCase())
  );

  const mapCenter: [number, number] =
    form.latitude !== null && form.longitude !== null
      ? [form.latitude, form.longitude]
      : DEFAULT_CENTER;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      {ctx}
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-teal-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">จัดการจุดมิเตอร์</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">ทั้งหมด {meters.length} จุด</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                placeholder="ค้นหาชื่ออาคาร..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors border-0 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">เพิ่มจุดมิเตอร์</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <MapPin size={32} className="opacity-30" />
            <p className="text-sm">{search ? "ไม่พบจุดมิเตอร์ที่ค้นหา" : "ยังไม่มีจุดมิเตอร์"}</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={14} className="text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{m.building_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                          {m.latitude.toFixed(6)}, {m.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {m.created_at ? dayjs(m.created_at).format("D MMM YYYY") : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(m)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["#", "ชื่ออาคาร", "ละติจูด", "ลองจิจูด", "วันที่เพิ่ม", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${i < 5 ? "text-left" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs">{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                              <MapPin size={13} className="text-teal-600" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{m.building_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{m.latitude.toFixed(6)}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">{m.longitude.toFixed(6)}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                          {m.created_at ? dayjs(m.created_at).format("D MMM YYYY") : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(m)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(m)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ——— Add / Edit Modal ——— */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92vh]">
            {/* drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <MapPin size={15} className="text-teal-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {editTarget ? "แก้ไขจุดมิเตอร์" : "เพิ่มจุดมิเตอร์"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="px-5 py-5 space-y-4 overflow-y-auto">
              {/* Building name */}
              <div>
                <label className={LABEL}>
                  ชื่ออาคาร / จุดมิเตอร์ <span className="text-red-400">*</span>
                </label>
                <input
                  className={INPUT}
                  placeholder="เช่น อาคาร A ชั้น 1"
                  value={form.building_name}
                  onChange={(e) => setForm((f) => ({ ...f, building_name: e.target.value }))}
                />
              </div>

              {/* Map picker */}
              <div>
                <label className={LABEL}>
                  ตำแหน่งบนแผนที่ <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  คลิกบนแผนที่เพื่อปักหมุดตำแหน่งมิเตอร์ — ลากหมุดเพื่อปรับละเอียด
                </p>

                {/* Map container — key forces remount on open/switch so center updates */}
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 280 }}>
                  <MapContainer
                    key={`${editTarget?.id ?? "new"}-${showModal}`}
                    center={mapCenter}
                    zoom={form.latitude !== null ? 17 : 15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapClickHandler
                      onPick={(lat, lng) =>
                        setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
                      }
                    />
                    {form.latitude !== null && form.longitude !== null && (
                      <Marker
                        position={[form.latitude, form.longitude]}
                        icon={PIN_ICON}
                        draggable
                        eventHandlers={{
                          dragend(e) {
                            const latlng = (e.target as L.Marker).getLatLng();
                            setForm((f) => ({ ...f, latitude: latlng.lat, longitude: latlng.lng }));
                          },
                        }}
                      />
                    )}
                  </MapContainer>
                </div>

                {/* Coordinate readout */}
                {form.latitude !== null && form.longitude !== null ? (
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400 mb-0.5">ละติจูด</p>
                      <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
                        {form.latitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400 mb-0.5">ลองจิจูด</p>
                      <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
                        {form.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-2">
                    ⚠ ยังไม่ได้เลือกตำแหน่ง — กรุณาคลิกบนแผนที่
                  </p>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isValid}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-colors border-0 cursor-pointer"
              >
                <Save size={14} />
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— Delete Confirmation Modal ——— */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex justify-center -mt-1 mb-4 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">ลบจุดมิเตอร์</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  ต้องการลบ{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">{deleteTarget.building_name}</span>{" "}
                  ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors border-0 cursor-pointer"
              >
                {deleting ? "กำลังลบ..." : "ลบจุดมิเตอร์"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
