import { useEffect, useRef, useState } from "react";
import { message } from "antd";
import { Camera, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import { GetUsersById, UpdateUsersById } from "../../services/https/user";
import { ChangePassword } from "../../services/https/sign";
import { GetGender } from "../../services/https/api";

const INPUT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const LABEL = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

type Gender = { id: number; gender: string };

export default function ProfilePage() {
  const [msgApi, ctx] = message.useMessage();
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

  const isFormChanged = JSON.stringify(form) !== JSON.stringify(initialForm);
  const initials = (form.first_name[0] ?? form.email[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-6">
      {ctx}
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ——— Avatar ——— */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-5">
          <div className="relative">
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
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {form.first_name} {form.last_name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">รองรับ JPG, PNG ขนาดไม่เกิน 2MB</p>
          </div>
        </div>

        {/* ——— Personal info ——— */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-5">ข้อมูลส่วนตัว</h2>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="col-span-2">
              <label className={LABEL}>อีเมล</label>
              <input type="email" className={INPUT} value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>วันเกิด</label>
              <input type="date" className={INPUT} value={form.birthday}
                onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))} />
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
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

      </div>
    </div>
  );
}
