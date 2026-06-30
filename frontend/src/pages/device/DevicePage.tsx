import { useEffect, useState } from "react";
import { message } from "antd";
import { Search, Plus, Pencil, Trash2, X, Cpu, Save, MapPin, Eye, EyeOff } from "lucide-react";
import dayjs from "dayjs";
import { DeviceInterface, MeterLocationInterface } from "../../interfaces/InterfaceAll";
import {
  GetDevices,
  GetAvailableLocations,
  CreateDevice,
  UpdateDevice,
  DeleteDevice,
} from "../../services/https/device";

const INPUT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder:text-gray-400";
const SELECT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const LABEL = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

type CreateForm = {
  mac_address: string;
  password: string;
  location_id: number | "";
};

type UpdateForm = {
  mac_address: string;
  location_id: number | null | "";
};

const EMPTY_CREATE: CreateForm = { mac_address: "", password: "", location_id: "" };
const EMPTY_UPDATE: UpdateForm = { mac_address: "", location_id: "" };

// MAC address formatted as XX:XX:XX:XX:XX:XX
function formatMac(raw: string) {
  const clean = raw.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  return clean.match(/.{1,2}/g)?.join(":") ?? clean;
}

function MacBadge({ mac }: { mac: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg">
      <Cpu size={11} className="text-gray-400" />
      {mac}
    </span>
  );
}

export default function DeviceManagement() {
  const [msgApi, ctx] = message.useMessage();
  const [devices, setDevices] = useState<DeviceInterface[]>([]);
  const [availableLocations, setAvailableLocations] = useState<MeterLocationInterface[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<DeviceInterface | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateForm>(EMPTY_UPDATE);
  const [updating, setUpdating] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<DeviceInterface | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    const res = await GetDevices();
    setLoading(false);
    if (res?.status === 200) {
      const data = res.data?.data ?? res.data;
      setDevices(Array.isArray(data) ? data : []);
    }
  };

  const fetchAvailableLocations = async () => {
    const res = await GetAvailableLocations();
    if (res?.status === 200) {
      const data = res.data?.data ?? res.data;
      setAvailableLocations(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchAvailableLocations();
  }, []);

  // ——— Add ———
  const openAdd = () => {
    setCreateForm(EMPTY_CREATE);
    setShowPw(false);
    setShowAdd(true);
  };

  const closeAdd = () => {
    setShowAdd(false);
    setCreateForm(EMPTY_CREATE);
  };

  const isCreateValid =
    createForm.mac_address.trim() !== "" &&
    createForm.password.length >= 6 &&
    createForm.location_id !== "";

  const handleCreate = async () => {
    if (!isCreateValid || createForm.location_id === "") return;
    setSaving(true);
    const res = await CreateDevice({
      mac_address: createForm.mac_address.trim(),
      password: createForm.password,
      location_id: createForm.location_id as number,
    });
    setSaving(false);
    if (res?.status === 200 || res?.status === 201) {
      msgApi.success("เพิ่มอุปกรณ์สำเร็จ");
      closeAdd();
      fetchDevices();
      fetchAvailableLocations();
    } else if (res?.status === 409) {
      msgApi.error("MAC Address นี้มีอยู่ในระบบแล้ว");
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  // ——— Edit ———
  const openEdit = (d: DeviceInterface) => {
    setEditTarget(d);
    setUpdateForm({
      mac_address: d.mac_address,
      location_id: d.location_id ?? "",
    });
  };

  const closeEdit = () => {
    setEditTarget(null);
    setUpdateForm(EMPTY_UPDATE);
  };

  const isUpdateValid = updateForm.mac_address.trim() !== "";

  const handleUpdate = async () => {
    if (!editTarget?.id || !isUpdateValid) return;
    setUpdating(true);
    const res = await UpdateDevice(editTarget.id, {
      mac_address: updateForm.mac_address.trim(),
      location_id: updateForm.location_id === "" ? null : (updateForm.location_id as number),
    });
    setUpdating(false);
    if (res?.status === 200) {
      msgApi.success("แก้ไขอุปกรณ์สำเร็จ");
      closeEdit();
      fetchDevices();
      fetchAvailableLocations();
    } else if (res?.status === 409) {
      msgApi.error("MAC Address นี้มีอยู่ในระบบแล้ว");
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  // ——— Delete ———
  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    const res = await DeleteDevice(deleteTarget.id);
    setDeleting(false);
    if (res?.status === 200 || res?.status === 204) {
      msgApi.success("ลบอุปกรณ์สำเร็จ");
      setDeleteTarget(null);
      fetchDevices();
      fetchAvailableLocations();
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  // Locations available in the edit dropdown = available + current device's location
  const editLocations: MeterLocationInterface[] = editTarget?.location
    ? [
        editTarget.location,
        ...availableLocations.filter((l) => l.id !== editTarget.location?.id),
      ]
    : availableLocations;

  const filtered = devices.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.mac_address.toLowerCase().includes(q) ||
      (d.location?.building_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      {ctx}
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">

        {/* ——— Header ——— */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
              <Cpu size={18} className="text-teal-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">จัดการอุปกรณ์</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">ทั้งหมด {devices.length} เครื่อง</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                placeholder="ค้นหา MAC หรืออาคาร..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors border-0 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">เพิ่มอุปกรณ์</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
          </div>
        </div>

        {/* ——— Content ——— */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Cpu size={32} className="opacity-30" />
            <p className="text-sm">{search ? "ไม่พบอุปกรณ์ที่ค้นหา" : "ยังไม่มีอุปกรณ์"}</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map((d) => (
                <div
                  key={d.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <MacBadge mac={d.mac_address} />
                      {d.location ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin size={11} className="text-teal-500 shrink-0" />
                          <span className="truncate">{d.location.building_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">ไม่ได้กำหนดตำแหน่ง</span>
                      )}
                      <p className="text-xs text-gray-400">
                        {d.created_at ? dayjs(d.created_at).format("D MMM YYYY") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(d)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d)}
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
                      {["#", "MAC Address", "ตำแหน่งมิเตอร์", "วันที่เพิ่ม", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${i < 4 ? "text-left" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.map((d, idx) => (
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs">{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <MacBadge mac={d.mac_address} />
                        </td>
                        <td className="px-5 py-3.5">
                          {d.location ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                              <MapPin size={13} className="text-teal-500 shrink-0" />
                              {d.location.building_name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                          {d.created_at ? dayjs(d.created_at).format("D MMM YYYY") : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(d)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(d)}
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

      {/* ——— Add Modal ——— */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Cpu size={15} className="text-teal-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">เพิ่มอุปกรณ์</p>
              </div>
              <button
                onClick={closeAdd}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className={LABEL}>MAC Address <span className="text-red-400">*</span></label>
                <input
                  className={INPUT}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  value={createForm.mac_address}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, mac_address: formatMac(e.target.value) }))
                  }
                  maxLength={17}
                />
              </div>
              <div>
                <label className={LABEL}>รหัสผ่านอุปกรณ์ <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    className={INPUT + " pr-10"}
                    type={showPw ? "text" : "password"}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-0 bg-transparent cursor-pointer p-0"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {createForm.password.length > 0 && createForm.password.length < 6 && (
                  <p className="text-xs text-red-400 mt-1">ต้องมีอย่างน้อย 6 ตัวอักษร</p>
                )}
              </div>
              <div>
                <label className={LABEL}>ตำแหน่งมิเตอร์ <span className="text-red-400">*</span></label>
                <select
                  className={SELECT}
                  value={createForm.location_id}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      location_id: e.target.value !== "" ? Number(e.target.value) : "",
                    }))
                  }
                >
                  <option value="">-- เลือกตำแหน่ง --</option>
                  {availableLocations.map((l) => (
                    <option key={l.id} value={l.id}>{l.building_name}</option>
                  ))}
                </select>
                {availableLocations.length === 0 && (
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                    ไม่มีตำแหน่งว่าง — กรุณาเพิ่มจุดมิเตอร์ก่อน
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={closeAdd}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !isCreateValid}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-colors border-0 cursor-pointer"
              >
                <Save size={14} />
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— Edit Modal ——— */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Cpu size={15} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">แก้ไขอุปกรณ์</p>
                  <p className="text-xs text-gray-400 font-mono">{editTarget.mac_address}</p>
                </div>
              </div>
              <button
                onClick={closeEdit}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className={LABEL}>MAC Address <span className="text-red-400">*</span></label>
                <input
                  className={INPUT}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  value={updateForm.mac_address}
                  onChange={(e) =>
                    setUpdateForm((f) => ({ ...f, mac_address: formatMac(e.target.value) }))
                  }
                  maxLength={17}
                />
              </div>
              <div>
                <label className={LABEL}>ตำแหน่งมิเตอร์</label>
                <select
                  className={SELECT}
                  value={updateForm.location_id ?? ""}
                  onChange={(e) =>
                    setUpdateForm((f) => ({
                      ...f,
                      location_id: e.target.value !== "" ? Number(e.target.value) : null,
                    }))
                  }
                >
                  <option value="">-- ไม่กำหนดตำแหน่ง --</option>
                  {editLocations.map((l) => (
                    <option key={l.id} value={l.id}>{l.building_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={closeEdit}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating || !isUpdateValid}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-colors border-0 cursor-pointer"
              >
                <Save size={14} />
                {updating ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— Delete Modal ——— */}
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
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">ลบอุปกรณ์</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  ต้องการลบอุปกรณ์{" "}
                  <span className="font-mono font-medium text-gray-700 dark:text-gray-200">
                    {deleteTarget.mac_address}
                  </span>{" "}
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
                {deleting ? "กำลังลบ..." : "ลบอุปกรณ์"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
