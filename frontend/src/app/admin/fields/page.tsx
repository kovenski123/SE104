"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, formatVND } from "@/lib/api";
import { Plus, Edit2, X, Loader2 } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  HOAT_DONG: "Hoạt động", BAO_TRI: "Bảo trì", DONG_CUA: "Đóng cửa",
};

export default function FieldsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await apiGet("/api/fields");
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
          <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">CƠ SỞ VẬT CHẤT</div>
          <h1 className="font-display text-4xl">QUẢN LÝ SÂN</h1>
        </div>
        <button onClick={() => setCreating(true)}
          className="px-4 py-2.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Thêm sân
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-900/5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/[0.03] text-xs font-bold text-ink-400">
              <tr>
                <th className="text-left p-3">TÊN SÂN</th>
                <th className="text-left p-3">LOẠI</th>
                <th className="text-right p-3">SỨC CHỨA</th>
                <th className="text-right p-3">GIÁ THƯỜNG</th>
                <th className="text-right p-3">GIÁ CAO ĐIỂM</th>
                <th className="text-center p-3">TRẠNG THÁI</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className="border-t border-ink-900/5">
                  <td className="p-3 font-semibold">{f.ten_san}</td>
                  <td className="p-3">{f.loai_san}</td>
                  <td className="p-3 text-right">{f.suc_chua}</td>
                  <td className="p-3 text-right">{formatVND(f.gia_tieu_chuan)}</td>
                  <td className="p-3 text-right">{formatVND(f.gia_cao_diem)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      f.trang_thai === "HOAT_DONG" ? "bg-brand-100 text-brand-700" :
                      f.trang_thai === "BAO_TRI" ? "bg-amber-100 text-amber-800" :
                      "bg-red-100 text-red-700"
                    }`}>{STATUS_LABEL[f.trang_thai]}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(f)} className="p-1.5 hover:bg-ink-900/5 rounded-lg">
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
        <FieldModal field={editing} onClose={() => { setEditing(null); setCreating(false); }}
          onSuccess={() => { setEditing(null); setCreating(false); load(); }} />
      )}
    </div>
  );
}

function FieldModal({ field, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    ten_san: field?.ten_san || "",
    loai_san: field?.loai_san || "SAN_5",
    suc_chua: field?.suc_chua || 10,
    gia_tieu_chuan: field?.gia_tieu_chuan || 150000,
    gia_cao_diem: field?.gia_cao_diem || 250000,
    mo_ta: field?.mo_ta || "",
    trang_thai: field?.trang_thai || "HOAT_DONG",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setErr("");
    try {
      if (field) {
        await apiPut(`/api/fields/${field.id}`, form);
      } else {
        await apiPost("/api/fields", form);
      }
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-ink-900/5">
          <h3 className="font-display text-2xl">{field ? "SỬA SÂN" : "THÊM SÂN"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-ink-900/5 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <Input label="Tên sân" value={form.ten_san} onChange={(v) => setForm({ ...form, ten_san: v })} />
          <Select label="Loại sân" value={form.loai_san} onChange={(v) => setForm({ ...form, loai_san: v })}
            options={[["SAN_5", "Sân 5"], ["SAN_7", "Sân 7"], ["SAN_11", "Sân 11"]]} />
          <Input label="Sức chứa" type="number" value={form.suc_chua} onChange={(v) => setForm({ ...form, suc_chua: parseInt(v) || 0 })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Giá thường (VND/h)" type="number" value={form.gia_tieu_chuan}
              onChange={(v) => setForm({ ...form, gia_tieu_chuan: parseFloat(v) || 0 })} />
            <Input label="Giá cao điểm (VND/h)" type="number" value={form.gia_cao_diem}
              onChange={(v) => setForm({ ...form, gia_cao_diem: parseFloat(v) || 0 })} />
          </div>
          <Input label="Mô tả" value={form.mo_ta} onChange={(v) => setForm({ ...form, mo_ta: v })} textarea />
          <Select label="Trạng thái" value={form.trang_thai} onChange={(v) => setForm({ ...form, trang_thai: v })}
            options={[["HOAT_DONG", "Hoạt động"], ["BAO_TRI", "Bảo trì"], ["DONG_CUA", "Đóng cửa"]]} />

          {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-ink-900/10 font-semibold">Hủy</button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-ink-900 text-white font-semibold disabled:opacity-50">
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", textarea }: any) {
  return (
    <label className="block">
      <span className="text-sm font-semibold mb-1.5 block">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full px-3 py-2 rounded-xl border border-ink-900/10 focus:border-brand-500 outline-none resize-none" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-ink-900/10 focus:border-brand-500 outline-none" />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <label className="block">
      <span className="text-sm font-semibold mb-1.5 block">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-ink-900/10 focus:border-brand-500 outline-none bg-white">
        {options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
