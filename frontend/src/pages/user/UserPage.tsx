import { useEffect, useState } from "react";
import { message } from "antd";
import { Search, Pencil, Trash2, X, Users, Save } from "lucide-react";
import { GetUsers, DeleteUsersById, UpdateUserAssignment } from "../../services/https/user";
import { GetRoles, GetPositions } from "../../services/https/api";
import { UsersInterface } from "../../interfaces/IUser";

const SELECT =
  "w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const LABEL = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const ROLE_COLORS: Record<number, string> = {
  1: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  3: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  4: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

type Role = { id: number; role: string };
type Position = { id: number; position: string };
type EditState = { role_id: number | ""; position_id: number | "" };

const ROLE_ENGINEER = 2;

export default function UserPage() {
  const currentId     = Number(localStorage.getItem("id"));
  const currentRoleId = Number(localStorage.getItem("role_id"));

  const canDelete = (u: UsersInterface) =>
    currentRoleId !== ROLE_ENGINEER && u.id !== currentId;

  const [msgApi, ctx] = message.useMessage();
  const [users, setUsers] = useState<UsersInterface[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editUser, setEditUser] = useState<UsersInterface | null>(null);
  const [editState, setEditState] = useState<EditState>({ role_id: "", position_id: "" });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UsersInterface | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await GetUsers();
    setLoading(false);
    if (res?.status === 200) setUsers(res.data?.data ?? res.data ?? []);
  };

  useEffect(() => {
    fetchUsers();
    GetRoles().then((res) => {
      if (res?.status === 200) setRoles(res.data?.data ?? res.data ?? []);
    });
    GetPositions().then((res) => {
      if (res?.status === 200) setPositions(res.data?.data ?? res.data ?? []);
    });
  }, []);

  const openEdit = (user: UsersInterface) => {
    setEditUser(user);
    setEditState({ role_id: user.role_id ?? "", position_id: user.position_id ?? "" });
  };

  const handleSave = async () => {
    if (!editUser?.id || editState.role_id === "") return;
    setSaving(true);
    const res = await UpdateUserAssignment(String(editUser.id), {
      role_id: editState.role_id as number,
      position_id: editState.position_id !== "" ? (editState.position_id as number) : null,
    });
    setSaving(false);
    if (res?.status === 200) {
      msgApi.success("บันทึกข้อมูลสำเร็จ");
      setEditUser(null);
      fetchUsers();
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    const res = await DeleteUsersById(String(deleteTarget.id));
    setDeleting(false);
    if (res?.status === 200) {
      msgApi.success("ลบผู้ใช้สำเร็จ");
      setDeleteTarget(null);
      fetchUsers();
    } else {
      msgApi.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
    }
  };

  const roleName = (id?: number) => roles.find((r) => r.id === id)?.role;
  const positionName = (id?: number) => positions.find((p) => p.id === id)?.position;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      {ctx}
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">

        {/* ——— Header ——— */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-teal-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">จัดการผู้ใช้</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">ทั้งหมด {users.length} คน</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ——— Loading / Empty ——— */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">ไม่พบผู้ใช้</div>
        ) : (
          <>
            {/* ——— Mobile: cards ——— */}
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar user={u} size={10} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{u.email ?? "—"}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {u.role_id ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role_id] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                            {roleName(u.role_id) ?? "—"}
                          </span>
                        ) : null}
                        {positionName(u.position_id) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {positionName(u.position_id)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(u)}
                        title="แก้ไข"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      {canDelete(u) && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title="ลบ"
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

            {/* ——— Desktop: table ——— */}
            <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["ผู้ใช้", "อีเมล", "บทบาท", "ตำแหน่ง", ""].map((h, i) => (
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
                    {filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar user={u} size={8} />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {u.first_name} {u.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{u.email ?? "—"}</td>
                        <td className="px-5 py-3.5">
                          {u.role_id ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role_id] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                              {roleName(u.role_id) ?? "—"}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                          {positionName(u.position_id) ?? "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(u)}
                              title="แก้ไข"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-0 bg-transparent cursor-pointer"
                            >
                              <Pencil size={14} />
                            </button>
                            {canDelete(u) && (
                              <button
                                onClick={() => setDeleteTarget(u)}
                                title="ลบ"
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

      {/* ——— Edit Modal ——— */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            {/* drag handle on mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Avatar user={editUser} size={9} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {editUser.first_name} {editUser.last_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-[160px]">{editUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className={LABEL}>บทบาท</label>
                <select
                  className={SELECT}
                  value={editState.role_id}
                  onChange={(e) => setEditState((s) => ({ ...s, role_id: Number(e.target.value) }))}
                >
                  <option value="">-- เลือกบทบาท --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>ตำแหน่ง</label>
                <select
                  className={SELECT}
                  value={editState.position_id}
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, position_id: e.target.value !== "" ? Number(e.target.value) : "" }))
                  }
                >
                  <option value="">-- ไม่ระบุตำแหน่ง --</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.position}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-0 bg-transparent cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving || editState.role_id === ""}
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
            {/* drag handle on mobile */}
            <div className="flex justify-center -mt-1 mb-4 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">ลบผู้ใช้</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  ต้องการลบ{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {deleteTarget.first_name} {deleteTarget.last_name}
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
                {deleting ? "กำลังลบ..." : "ลบผู้ใช้"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ user, size }: { user: UsersInterface; size: number }) {
  const initials = ((user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "")).toUpperCase() || "U";
  const cls = `w-${size} h-${size} rounded-full object-cover shrink-0`;

  if (user.profile_image) {
    return <img src={user.profile_image} alt={initials} className={cls} />;
  }

  return (
    <div className={`${cls} bg-teal-500 flex items-center justify-center text-white text-xs font-bold`}>
      {initials}
    </div>
  );
}
