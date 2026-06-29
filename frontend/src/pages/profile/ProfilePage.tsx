import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { Camera, Save, KeyRound, Eye, EyeOff, Trash2, TriangleAlert } from "lucide-react";
import { GetUsersById, UpdateUsersById, DeleteUsersByAdmin } from "../../services/https/user";
import { ChangePassword } from "../../services/https/sign";
import { GetGender } from "../../services/https/api";

const INPUT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const LABEL = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1930 + 1 }, (_, i) => THIS_YEAR - i);

type Gender = { id: number; gender: string };

export default function ProfilePage() {
  const navigate = useNavigate();
  const [msgApi, ctx] = message.useMessage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const id = localStorage.getItem("id") ?? "";

  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emptyForm = {
    first_name: "",
    last_name: "",
    email: "",
    birthday: "",
    gender_id: "" as string | number,
    profile_image: "",
  };

  const [form, setForm]           = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);

  const [pw, setPw] = useState({ old_password: "", new_password: "", confirm: "" });
  const [genders, setGenders] = useState<Gender[]>([]);

  useEffect(() => {
    GetUsersById(id).then((res) => {
      if (res?.status === 200) {
        const u = res.data?.data ?? res.data;
        const loaded = {
          first_name:    u.first_name    ?? "",
          last_name:     u.last_name     ?? "",
          email:         u.email         ?? "",
          birthday:      u.birthday ? u.birthday.slice(0, 10) : "",
          gender_id:     u.gender_id != null ? String(u.gender_id) : "",
          profile_image: u.profile_image ?? "",
        };
        setForm(loaded);
        setInitialForm(loaded);
      }
    });
    GetGender().then((res) => {
      if (res?.status === 200) {
        setGenders(res.data?.data ?? res.data ?? []);
      }
    });
  }, [id]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { msgApi.error("ไฟล์ต้องไม่เกิน 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, profile_image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      first_name:    form.first_name,
      last_name:     form.last_name,
      email:         form.email,
      birthday:      form.birthday ? `${form.birthday}T00:00:00Z` : undefined,
      gender_id:     form.gender_id !== "" ? Number(form.gender_id) : undefined,
      profile_image: form.profile_image,
    };
    const res = await UpdateUsersById(id, payload as never);
    setSaving(false);
    if (res?.status === 200) {
      msgApi.success("บันทึกข้อมูลสำเร็จ");
    } else {
      msgApi.error(res?.data?.error?.message ?? res?.data?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  const handlePwSave = async () => {
    if (pw.new_password !== pw.confirm) { msgApi.error("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    if (pw.new_password.length < 8) { msgApi.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    setPwSaving(true);
    const res = await ChangePassword(id, { old_password: pw.old_password, new_password: pw.new_password });
    setPwSaving(false);
    if (res?.status === 200) {
      msgApi.success("เปลี่ยนรหัสผ่านสำเร็จ");
      setPw({ old_password: "", new_password: "", confirm: "" });
    } else {
      msgApi.error("รหัสผ่านเดิมไม่ถูกต้อง");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await DeleteUsersByAdmin();
    setDeleting(false);
    if (res?.status === 200 || res?.status === 204) {
      msgApi.success("ลบบัญชีสำเร็จ");
      localStorage.clear();
      setTimeout(() => navigate("/"), 1000);
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
      setShowDeleteModal(false);
    }
  };

  const bYear  = form.birthday.slice(0, 4);
  const bMonth = form.birthday.slice(5, 7);
  const bDay   = form.birthday.slice(8, 10);
  const daysInMonth = bYear && bMonth ? new Date(Number(bYear), Number(bMonth), 0).getDate() : 31;

  const updateBirthday = (y: string, m: string, d: string) => {
    if (!y || !m || !d) { setForm((f) => ({ ...f, birthday: "" })); return; }
    const maxDay = new Date(Number(y), Number(m), 0).getDate();
    const safeDay = String(Math.min(Number(d), maxDay)).padStart(2, "0");
    setForm((f) => ({ ...f, birthday: `${y}-${m}-${safeDay}` }));
  };

  const isFormChanged = JSON.stringify(form) !== JSON.stringify(initialForm);
  const initials = (form.first_name[0] ?? form.email[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      {ctx}
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">

        {/* ——— Avatar ——— */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            {form.profile_image ? (
              <img src={form.profile_image} alt="avatar"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-teal-500/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center cursor-pointer text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {form.first_name} {form.last_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">รองรับ JPG, PNG ขนาดไม่เกิน 2MB</p>
          </div>
        </div>

        {/* ——— Personal info ——— */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-5">ข้อมูลส่วนตัว</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>ชื่อ</label>
              <input className={INPUT} value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>นามสกุล</label>
              <input className={INPUT} value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className={LABEL}>อีเมล</label>
              <input type="email" className={INPUT} value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>วันเกิด</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className={INPUT}
                  value={bDay}
                  onChange={(e) => updateBirthday(bYear, bMonth, e.target.value)}
                >
                  <option value="">วัน</option>
                  {Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                    <option key={d} value={d}>{Number(d)}</option>
                  ))}
                </select>
                <select
                  className={INPUT}
                  value={bMonth}
                  onChange={(e) => updateBirthday(bYear, e.target.value, bDay)}
                >
                  <option value="">เดือน</option>
                  {MONTHS.map((name, i) => (
                    <option key={i} value={String(i + 1).padStart(2, "0")}>{name}</option>
                  ))}
                </select>
                <select
                  className={INPUT}
                  value={bYear}
                  onChange={(e) => updateBirthday(e.target.value, bMonth, bDay)}
                >
                  <option value="">ปี</option>
                  {YEARS.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>เพศ</label>
              <select className={INPUT}
                value={form.gender_id}
                onChange={(e) => setForm((f) => ({ ...f, gender_id: e.target.value }))}
              >
                <option value="">-- เลือกเพศ --</option>
                {genders.map((g) => (
                  <option key={g.id} value={String(g.id)}>{g.gender}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-5">
            <button
              onClick={handleSave}
              disabled={saving || !isFormChanged}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 cursor-pointer border-0 transition-colors"
            >
              <Save size={15} />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>

        {/* ——— Change password ——— */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <KeyRound size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">เปลี่ยนรหัสผ่าน</h2>
          </div>
          <div className="space-y-4">
            {([
              { label: "รหัสผ่านเดิม", key: "old_password", show: showOld,  toggle: () => setShowOld((v) => !v) },
              { label: "รหัสผ่านใหม่", key: "new_password", show: showNew,  toggle: () => setShowNew((v) => !v) },
              { label: "ยืนยันรหัสผ่านใหม่", key: "confirm",      show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
            ] as const).map(({ label, key, show, toggle }) => (
              <div key={key}>
                <label className={LABEL}>{label}</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    className={`${INPUT} pr-10`}
                    value={pw[key]}
                    onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent border-0 cursor-pointer p-0">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-5">
            <button
              onClick={handlePwSave}
              disabled={pwSaving || !pw.old_password || !pw.new_password || !pw.confirm}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 cursor-pointer border-0 transition-colors"
            >
              <KeyRound size={15} />
              {pwSaving ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
        </div>

        {/* ——— Danger Zone ——— */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/40 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">พื้นที่อันตราย</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            การลบบัญชีจะลบข้อมูลทั้งหมดของคุณออกจากระบบถาวร และไม่สามารถกู้คืนได้
          </p>
          <button
            onClick={() => setShowDeleteBtn((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-transparent cursor-pointer"
          >
            <TriangleAlert size={14} />
            {showDeleteBtn ? "ซ่อนตัวเลือก" : "จัดการบัญชี"}
          </button>
          {showDeleteBtn && (
            <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-900/30">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-transparent cursor-pointer"
              >
                <Trash2 size={14} />
                ลบบัญชีของฉัน
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ——— Delete Confirmation Modal ——— */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 pb-8 sm:pb-6">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-5 sm:hidden" />
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">ยืนยันการลบบัญชี</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  บัญชีของ <span className="font-medium text-gray-700 dark:text-gray-200">{form.email}</span> จะถูกลบออกจากระบบถาวร การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors border-0 cursor-pointer"
              >
                <Trash2 size={14} />
                {deleting ? "กำลังลบ..." : "ลบบัญชี"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
