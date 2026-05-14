"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, formatVND } from "@/lib/api";
import { Plus, Edit2, X, Loader2 } from "lucide-react";

export default function ServicesAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await apiGet("/api/services");
      setList(r);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">SẢN PHẨM</div>
          <h1 className="font-display text-4xl">DỊCH VỤ</h1>
        </div>
        <button onClick={() => setCreating(true)}
          className="px-4 py-2.5 bg-ink-900 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Thêm dịch vụ
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-900/5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/[0.03] text-xs font-bold text-ink-400">
              <tr>
                <th className="text-left p-3">TÊN DỊCH VỤ</th>
                <th className="text-right p-3">ĐƠN GIÁ</th>
                <th className="text-center p-3">ĐƠN VỊ</th>
                <th className="text-right p-3">TỒN KHO</th>
                <th className="text-center p-3">TRẠNG THÁI</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-ink-900/5">
                  <td className="p-3 font-semibold">{s.ten_dich_vu}</td>
                  <td className="p-3 text-right">{formatVND(s.don_gia)}</td>
                  <td className="p-3 text-center">{s.don_vi_tinh}</td>
                  <td className={`p-3 text-right font-semibold ${s.ton_kho < 5 ? "text-red-600" : ""}`}>{s.ton_kho}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.trang_thai === "HOAT_DONG" ? "bg-brand-100 text-brand-700" : "bg-ink-900/10 text-ink-400"
                    }`}>{s.trang_thai === "HOAT_DONG" ? "Hoạt động" : "Ngừng KD"}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(s)} className="p-1.5 hover:bg-ink-900/5 rounded-lg">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <ServiceModal svc={editing} onClose={() => { setEditing(null); setCreating(false); }}
          onSuccess={() => { setEditing(null); setCreating(false); load(); }} />
      )}
    </div>
  );
}

function ServiceModal({ svc, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    ten_dich_vu: svc?.ten_dich_vu || "",
    don_gia: svc?.don_gia || 10000,
    don_vi_tinh: svc?.don_vi_tinh || "Cái",
    ton_kho: svc?.ton_kho || 10,
    trang_thai: svc?.trang_thai || "HOAT_DONG",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      if (svc) await apiPut(`/api/services/${svc.id}`, form);
      else await apiPost("/api/services", form);
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-ink-900/5">
          <h3 className="font-display text-2xl">{svc ? "SỬA DỊCH VỤ" : "THÊM DỊCH VỤ"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-ink-900/5 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <Input label="Tên" value={form.ten_dich_vu} onChange={(v) => setForm({ ...form, ten_dich_vu: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Đơn giá" type="number" value={form.don_gia} onChange={(v) => setForm({ ...form, don_gia: parseFloat(v) })} />
            <Input label="Đơn vị" value={form.don_vi_tinh} onChange={(v) => setForm({ ...form, don_vi_tinh: v })} />
          </div>
          <Input label="Tồn kho" type="number" value={form.ton_kho} onChange={(v) => setForm({ ...form, ton_kho: parseInt(v) || 0 })} />
          <label className="block">
            <span className="text-sm font-semibold mb-1.5 block">Trạng thái</span>
            <select value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-ink-900/10 outline-none bg-white">
              <option value="HOAT_DONG">Hoạt động</option>
              <option value="NGUNG_KINH_DOANH">Ngừng kinh doanh</option>
            </select>
          </label>

          {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-ink-900/10 font-semibold">Hủy</button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-ink-900 text-white font-semibold disabled:opacity-50">
              {loading ? "..." : "Lưu"}
            </button>
          </div>
        </div>
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
