import { useEffect, useState } from "react";
import { message } from "antd";
import { Search, Plus, Pencil, Trash2, X, Wrench, Save, MapPin, Calendar } from "lucide-react";
import dayjs from "dayjs";
import { MaintainLogInterface, StatusLogInterface, MeterLocationInterface } from "../../interfaces/InterfaceAll";
import {
  GetMaintainLogs,
  GetMaintainLogStatuses,
  CreateMaintainLog,
  UpdateMaintainLog,
  DeleteMaintainLog,
} from "../../services/https/maintain";
import { GetMerters } from "../../services/https/meter";

const INPUT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder:text-gray-400";
const TEXTAREA =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder:text-gray-400 resize-none";
const SELECT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const LABEL = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

// Color coding by keyword in status name
function statusColor(s?: StatusLogInterface) {
  if (!s) return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  const t = s.status_log.toLowerCase();
  if (t.includes("รอ") || t.includes("pending") || t.includes("open"))
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  if (t.includes("กำลัง") || t.includes("progress"))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  if (t.includes("เสร็จ") || t.includes("ปิด") || t.includes("resolved") || t.includes("closed") || t.includes("done"))
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (t.includes("เร่ง") || t.includes("urgent") || t.includes("critical"))
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
}

// Convert ISO datetime to datetime-local value (YYYY-MM-DDTHH:mm)
function toLocalInput(iso?: string) {
  if (!iso) return "";
  return dayjs(iso).format("YYYY-MM-DDTHH:mm");
}

// Convert datetime-local value to ISO string for API
function toISOString(local: string) {
  if (!local) return null;
  return dayjs(local).toISOString();
}

type FormState = {
  title: string;
  location_text: string;
  close_at: string;
  location_id: number | null | "";
  status_id: number | null | "";
};

const EMPTY_FORM: FormState = {
  title: "",
  location_text: "",
  close_at: "",
  location_id: "",
  status_id: "",
};

export default function MainTainPage() {
  const currentRoleId = Number(localStorage.getItem("role_id"));
  const canDelete = currentRoleId === 1 || currentRoleId === 2;

  const [msgApi, ctx] = message.useMessage();
  const [logs, setLogs] = useState<MaintainLogInterface[]>([]);
  const [statuses, setStatuses] = useState<StatusLogInterface[]>([]);
  const [locations, setLocations] = useState<MeterLocationInterface[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<MaintainLogInterface | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MaintainLogInterface | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await GetMaintainLogs();
    setLoading(false);
    if (res?.status === 200) {
      const data = res.data?.data ?? res.data;
      setLogs(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    fetchLogs();
    GetMaintainLogStatuses().then((res) => {
      if (res?.status === 200) {
        const data = res.data?.data ?? res.data;
        setStatuses(Array.isArray(data) ? data : []);
      }
    });
    GetMerters().then((res) => {
      if (res?.status === 200) {
        const data = res.data?.data ?? res.data;
        setLocations(Array.isArray(data) ? data : []);
      }
    });
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (log: MaintainLogInterface) => {
    setEditTarget(log);
    setForm({
      title: log.title,
      location_text: log.location_text,
      close_at: toLocalInput(log.close_at),
      location_id: log.location_id ?? "",
      status_id: log.status_id ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const isValid = form.title.trim() !== "" && form.location_text.trim() !== "";

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      location_text: form.location_text.trim(),
      close_at: form.close_at ? toISOString(form.close_at) : null,
      location_id: form.location_id !== "" ? (form.location_id as number) : null,
      status_id: form.status_id !== "" ? (form.status_id as number) : null,
    };
    const res = editTarget?.id
      ? await UpdateMaintainLog(editTarget.id, payload)
      : await CreateMaintainLog(payload);
    setSaving(false);
    if (res?.status === 200 || res?.status === 201) {
      msgApi.success(editTarget ? "แก้ไขบันทึกสำเร็จ" : "เพิ่มบันทึกสำเร็จ");
      closeModal();
      fetchLogs();
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    const res = await DeleteMaintainLog(deleteTarget.id);
    setDeleting(false);
    if (res?.status === 200 || res?.status === 204) {
      msgApi.success("ลบบันทึกสำเร็จ");
      setDeleteTarget(null);
      fetchLogs();
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  const filtered = logs.filter((l) => {
    const matchSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.location_text.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status_id === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      {ctx}
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">

        {/* ——— Header ——— */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
              <Wrench size={18} className="text-teal-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">บันทึกการซ่อมบำรุง</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">ทั้งหมด {logs.length} รายการ</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                placeholder="ค้นหาหัวข้อหรือสถานที่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors border-0 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">เพิ่มบันทึก</span>
              <span className="sm:hidden">เพิ่ม</span>
            </button>
          </div>
        </div>

        {/* ——— Status filter tabs ——— */}
        {statuses.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border-0 cursor-pointer ${
                filterStatus === "all"
                  ? "bg-teal-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              ทั้งหมด ({logs.length})
            </button>
            {statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id ?? "all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border-0 cursor-pointer ${
                  filterStatus === s.id
                    ? "bg-teal-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }`}
              >
                {s.status_log} ({logs.filter((l) => l.status_id === s.id).length})
              </button>
            ))}
          </div>
        )}

        {/* ——— Content ——— */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Wrench size={32} className="opacity-30" />
            <p className="text-sm">{search || filterStatus !== "all" ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีบันทึกการซ่อมบำรุง"}</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map((l) => (
                <div
                  key={l.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                          {l.title}
                        </p>
                        {l.status && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColor(l.status)}`}>
                            {l.status.status_log}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{l.location_text}</span>
                      </div>
                      {l.location && (
                        <p className="text-xs text-teal-600 dark:text-teal-400">{l.location.building_name}</p>
                      )}
                      {l.close_at && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar size={11} className="shrink-0" />
                          {dayjs(l.close_at).format("D MMM YYYY HH:mm")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(l)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(l)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
                      {["#", "หัวข้อ", "สถานที่", "สถานะ", "กำหนดปิด", "วันที่แจ้ง", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ${i < 6 ? "text-left" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filtered.map((l, idx) => (
                      <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs">{idx + 1}</td>
                        <td className="px-5 py-3.5 max-w-[200px]">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{l.title}</p>
                        </td>
                        <td className="px-5 py-3.5 max-w-[180px]">
                          <div className="flex items-start gap-1.5">
                            <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-gray-600 dark:text-gray-400 truncate text-xs">{l.location_text}</p>
                              {l.location && (
                                <p className="text-teal-600 dark:text-teal-400 text-xs truncate">{l.location.building_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {l.status ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(l.status)}`}>
                              {l.status.status_log}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                          {l.close_at ? dayjs(l.close_at).format("D MMM YY HH:mm") : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                          {l.created_at ? dayjs(l.created_at).format("D MMM YYYY") : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(l)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Pencil size={14} />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => setDeleteTarget(l)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
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
          <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[92vh]">
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Wrench size={15} className="text-teal-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {editTarget ? "แก้ไขบันทึก" : "เพิ่มบันทึกการซ่อมบำรุง"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className={LABEL}>หัวข้อปัญหา <span className="text-red-400">*</span></label>
                <input
                  className={INPUT}
                  placeholder="เช่น ท่อน้ำรั่ว, มิเตอร์ชำรุด"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Location text */}
              <div>
                <label className={LABEL}>รายละเอียดสถานที่ <span className="text-red-400">*</span></label>
                <textarea
                  className={TEXTAREA}
                  rows={2}
                  placeholder="อธิบายตำแหน่งที่เกิดปัญหา"
                  value={form.location_text}
                  onChange={(e) => setForm((f) => ({ ...f, location_text: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Meter location */}
                <div>
                  <label className={LABEL}>จุดมิเตอร์</label>
                  <select
                    className={SELECT}
                    value={form.location_id ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        location_id: e.target.value !== "" ? Number(e.target.value) : "",
                      }))
                    }
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.building_name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className={LABEL}>สถานะ</label>
                  <select
                    className={SELECT}
                    value={form.status_id ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status_id: e.target.value !== "" ? Number(e.target.value) : "",
                      }))
                    }
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>{s.status_log}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Close at */}
              <div>
                <label className={LABEL}>กำหนดปิดงาน</label>
                <input
                  type="datetime-local"
                  className={INPUT}
                  value={form.close_at}
                  onChange={(e) => setForm((f) => ({ ...f, close_at: e.target.value }))}
                />
              </div>
            </div>

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
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">ลบบันทึก</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  ต้องการลบ{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    "{deleteTarget.title}"
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
                {deleting ? "กำลังลบ..." : "ลบบันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
