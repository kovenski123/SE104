"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Plus, Edit2, X, Loader2 } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin", QUAN_LY: "Quản lý", NHAN_VIEN: "Nhân viên", KHACH_HANG: "Khách hàng",
};

export default function UsersAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("vai_tro", filter);
      if (keyword) params.set("keyword", keyword);
      const r = await apiGet(`/api/users?${params}`);
      setList(r);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">NHÂN SỰ</div>
          <h1 className="font-display text-4xl">TÀI KHOẢN</h1>
        </div>
        <button onClick={() => setCreating(true)}
          className="px-4 py-2.5 bg-ink-900 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Tạo tài khoản
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Tìm theo tên / email / SĐT..."
          className="px-4 py-2.5 rounded-xl border border-ink-900/10 bg-white text-sm flex-1 min-w-[200px]" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-ink-900/10 bg-white font-medium text-sm">
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="QUAN_LY">Quản lý</option>
          <option value="NHAN_VIEN">Nhân viên</option>
          <option value="KHACH_HANG">Khách hàng</option>
        </select>
        <button onClick={load} className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold">Tìm</button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-900/5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/[0.03] text-xs font-bold text-ink-400">
              <tr>
                <th className="text-left p-3">HỌ TÊN</th>
                <th className="text-left p-3">EMAIL</th>
                <th className="text-left p-3">SĐT</th>
                <th className="text-center p-3">VAI TRÒ</th>
                <th className="text-center p-3">TRẠNG THÁI</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-t border-ink-900/5">
                  <td className="p-3 font-semibold">{u.ho_ten}</td>
                  <td className="p-3 text-ink-400">{u.email}</td>
                  <td className="p-3 text-ink-400">{u.sdt}</td>
                  <td className="p-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ink-900/5">
                      {ROLE_LABEL[u.vai_tro]}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.trang_thai === "HOAT_DONG" ? "bg-brand-100 text-brand-700" : "bg-red-100 text-red-700"
                    }`}>{u.trang_thai === "HOAT_DONG" ? "Hoạt động" : "Vô hiệu hóa"}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(u)} className="p-1.5 hover:bg-ink-900/5 rounded-lg">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <CreateUserModal onClose={() => setCreating(false)} onSuccess={() => { setCreating(false); load(); }} />}
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function CreateUserModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    ho_ten: "", email: "", sdt: "", mat_khau: "", vai_tro: "NHAN_VIEN",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await apiPost("/api/users", form);
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} title="TẠO TÀI KHOẢN">
      <div className="space-y-3">
        <Input label="Họ tên" value={form.ho_ten} onChange={(v) => setForm({ ...form, ho_ten: v })} />
        <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input label="SĐT" value={form.sdt} onChange={(v) => setForm({ ...form, sdt: v })} />
        <Input label="Mật khẩu (≥8, có chữ + số)" type="password" value={form.mat_khau} onChange={(v) => setForm({ ...form, mat_khau: v })} />
        <label className="block">
          <span className="text-sm font-semibold mb-1.5 block">Vai trò</span>
          <select value={form.vai_tro} onChange={(e) => setForm({ ...form, vai_tro: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-ink-900/10 outline-none bg-white">
            <option value="NHAN_VIEN">Nhân viên</option>
            <option value="QUAN_LY">Quản lý</option>
            <option value="ADMIN">Admin</option>
            <option value="KHACH_HANG">Khách hàng</option>
          </select>
        </label>
        {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-ink-900/10 font-semibold">Hủy</button>
          <button onClick={submit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-ink-900 text-white font-semibold disabled:opacity-50">
            {loading ? "..." : "Tạo"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    ho_ten: user.ho_ten, sdt: user.sdt,
    vai_tro: user.vai_tro, trang_thai: user.trang_thai,
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await apiPut(`/api/users/${user.id}`, form);
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} title="SỬA TÀI KHOẢN">
      <div className="space-y-3">
        <div className="text-xs text-ink-400">Email: {user.email} (không đổi)</div>
        <Input label="Họ tên" value={form.ho_ten} onChange={(v) => setForm({ ...form, ho_ten: v })} />
        <Input label="SĐT" value={form.sdt} onChange={(v) => setForm({ ...form, sdt: v })} />
        <label className="block">
          <span className="text-sm font-semibold mb-1.5 block">Vai trò</span>
          <select value={form.vai_tro} onChange={(e) => setForm({ ...form, vai_tro: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-ink-900/10 outline-none bg-white">
            <option value="KHACH_HANG">Khách hàng</option>
            <option value="NHAN_VIEN">Nhân viên</option>
            <option value="QUAN_LY">Quản lý</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold mb-1.5 block">Trạng thái</span>
          <select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-ink-900/10 outline-none bg-white">
            <option value="HOAT_DONG">Hoạt động</option>
            <option value="VO_HIEU_HOA">Vô hiệu hóa</option>
          </select>
        </label>
        {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-ink-900/10 font-semibold">Hủy</button>
          <button onClick={submit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-ink-900 text-white font-semibold disabled:opacity-50">
            {loading ? "..." : "Lưu"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ onClose, title, children }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-ink-900/5">
          <h3 className="font-display text-2xl">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-ink-900/5 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <label className="block">
      <span className="text-sm font-semibold mb-1.5 block">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-ink-900/10 focus:border-brand-500 outline-none" />
    </label>
  );
}
