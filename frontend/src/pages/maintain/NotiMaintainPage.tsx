import { useEffect, useState } from "react";
import {
  Wrench, MapPin, CheckCircle2, ChevronRight,
  AlertTriangle, Droplets, Gauge, Eye, ThumbsUp, RotateCcw, ImagePlus, X,
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContextDef";
import { CreateMaintainLogReport } from "../../services/https/maintain";

// ——— ปัญหาที่พบบ่อย ———
const PRESETS = [
  { label: "น้ำรั่ว",                 icon: Droplets,      color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20",   border: "border-blue-200 dark:border-blue-800" },
  { label: "ท่อแตก",                  icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-50 dark:bg-red-900/20",     border: "border-red-200 dark:border-red-800" },
  { label: "มิเตอร์ไม่ทำงาน",         icon: Gauge,         color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800" },
  { label: "ต้องตรวจสอบด้วยมือ",      icon: Eye,           color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
  { label: "ค่ามิเตอร์สูงผิดปกติ",    icon: Gauge,         color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
  { label: "ค่ามิเตอร์ต่ำผิดปกติ",    icon: Gauge,         color: "text-teal-500",   bg: "bg-teal-50 dark:bg-teal-900/20",   border: "border-teal-200 dark:border-teal-800" },
  { label: "อื่นๆ",                   icon: Wrench,        color: "text-gray-500",   bg: "bg-gray-50 dark:bg-gray-800",      border: "border-gray-200 dark:border-gray-700" },
];

const INPUT =
  "w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder:text-gray-400";

type Submitted = { title: string; location_text: string; building?: string; time: string };

export default function NotiMaintainPage() {
  const { meters } = useAppContext();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [title, setTitle]       = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationId, setLocationId]     = useState<number | "">("");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState<Submitted | null>(null);
  const [error, setError]               = useState("");

  // ซิงค์ title เมื่อเลือก preset
  useEffect(() => {
    if (selectedPreset && selectedPreset !== "อื่นๆ") setTitle(selectedPreset);
    if (selectedPreset === "อื่นๆ") setTitle("");
  }, [selectedPreset]);

  const isValid = title.trim() !== "" && locationText.trim() !== "";

  const handlePreset = (label: string) => {
    setSelectedPreset((prev) => (prev === label ? null : label));
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!isValid) { setError("กรุณากรอกหัวข้อและรายละเอียดสถานที่"); return; }
    setSubmitting(true);
    setError("");
    const building = locationId !== ""
      ? meters.find((m) => m.id === locationId)?.building_name
      : undefined;
    const res = await CreateMaintainLogReport({
      title: title.trim(),
      location_text: locationText.trim(),
      location_id: locationId !== "" ? locationId : null,
      image: imageFile ?? undefined,
    });
    setSubmitting(false);
    if (res?.status === 200 || res?.status === 201) {
      setSubmitted({
        title: title.trim(),
        location_text: locationText.trim(),
        building,
        time: new Date().toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }),
      });
    } else {
      setError(res?.data?.error?.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleReset = () => {
    setSubmitted(null);
    setSelectedPreset(null);
    setTitle("");
    setLocationText("");
    setLocationId("");
    setImageFile(null);
    setImagePreview(null);
    setError("");
  };

  // ——— Success screen ———
  if (submitted) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-950 flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ส่งรายงานสำเร็จ</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              ทีมงานจะรับทราบและดำเนินการโดยเร็วที่สุด
            </p>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-4 text-left space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Wrench size={14} className="text-teal-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">หัวข้อปัญหา</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{submitted.title}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-teal-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">สถานที่</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{submitted.location_text}</p>
                  {submitted.building && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{submitted.building}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThumbsUp size={14} className="text-teal-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">เวลาแจ้ง</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{submitted.time}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors border-0 cursor-pointer"
            >
              <RotateCcw size={15} />
              แจ้งปัญหาใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ——— Form screen ———
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="w-full max-w-lg mx-auto space-y-5">

        {/* ——— Header ——— */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0">
            <Wrench size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">แจ้งปัญหาระบบน้ำ</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">รายงานปัญหาที่พบเพื่อให้ทีมช่างดำเนินการ</p>
          </div>
        </div>

        {/* ——— Quick select ——— */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            เลือกประเภทปัญหา
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(({ label, icon: Icon, color, bg, border }) => {
              const active = selectedPreset === label;
              return (
                <button
                  key={label}
                  onClick={() => handlePreset(label)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left cursor-pointer ${
                    active
                      ? `${bg} ${border} ${color} ring-2 ring-offset-1 ring-teal-400`
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-700"
                  }`}
                >
                  <Icon size={16} className={active ? color : "text-gray-400"} />
                  <span className="leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ——— Form ——— */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            รายละเอียดปัญหา
          </p>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              หัวข้อปัญหา <span className="text-red-400">*</span>
            </label>
            <input
              className={INPUT}
              placeholder="เช่น น้ำรั่วบริเวณชั้น 2, มิเตอร์อ่านค่าผิดปกติ"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
            />
          </div>

          {/* Location text */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              รายละเอียดสถานที่ <span className="text-red-400">*</span>
            </label>
            <textarea
              className={`${INPUT} resize-none`}
              rows={3}
              placeholder="ระบุตำแหน่งที่พบปัญหาให้ชัดเจน เช่น ชั้น 3 ห้องน้ำชาย ใกล้ลิฟต์ A"
              value={locationText}
              onChange={(e) => { setLocationText(e.target.value); setError(""); }}
            />
          </div>

          {/* Meter location (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              อาคาร / จุดมิเตอร์ <span className="text-xs font-normal text-gray-400">(ถ้าทราบ)</span>
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                className={`${INPUT} pl-8`}
                value={locationId}
                onChange={(e) => setLocationId(e.target.value !== "" ? Number(e.target.value) : "")}
              >
                <option value="">-- ไม่ทราบ / ไม่ระบุ --</option>
                {meters.map((m) => (
                  <option key={m.id} value={m.id}>{m.building_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              รูปภาพประกอบ <span className="text-xs font-normal text-gray-400">(ถ้ามี)</span>
            </label>
            {imagePreview ? (
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors border-0 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-teal-400 dark:hover:border-teal-600 transition-colors">
                <ImagePlus size={22} className="text-gray-400" />
                <span className="text-xs text-gray-400">คลิกเพื่อเลือกรูปภาพ</span>
                <span className="text-xs text-gray-300 dark:text-gray-600">JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ——— Submit ——— */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !isValid}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-0 cursor-pointer shadow-sm"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              กำลังส่ง...
            </span>
          ) : (
            <>
              ส่งรายงานปัญหา
              <ChevronRight size={16} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          รายงานจะถูกส่งถึงทีมวิศวกรและช่างเทคนิคทันที
        </p>
      </div>
    </div>
  );
}
