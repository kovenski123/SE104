"use client";
import { useEffect, useState } from "react";
import { apiGet, formatDateTime } from "@/lib/api";
import { Star, Loader2, AlertTriangle } from "lucide-react";

export default function FeedbacksAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = filter ? `?max_star=${filter}` : "";
      const [items, s] = await Promise.all([
        apiGet(`/api/feedbacks${params}`),
        apiGet("/api/feedbacks/stats"),
      ]);
      setList(items);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">PHẢN HỒI</div>
        <h1 className="font-display text-4xl">ĐÁNH GIÁ KHÁCH HÀNG</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-ink-900/5 p-4">
            <div className="text-xs text-ink-400 mb-1">TỔNG ĐÁNH GIÁ</div>
            <div className="font-display text-3xl">{stats.tong_so}</div>
          </div>
          <div className="bg-white rounded-2xl border border-ink-900/5 p-4">
            <div className="text-xs text-ink-400 mb-1">ĐIỂM TRUNG BÌNH</div>
            <div className="font-display text-3xl text-brand-600 flex items-center gap-1">
              {stats.trung_binh} <Star size={20} fill="currentColor" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-ink-900/5 p-4">
            <div className="text-xs text-ink-400 mb-1">CẢNH BÁO (&lt; 3★)</div>
            <div className="font-display text-3xl text-red-600 flex items-center gap-1">
              {stats.canh_bao} <AlertTriangle size={20} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-ink-900/5 p-4">
            <div className="text-xs text-ink-400 mb-2">PHÂN BỐ</div>
            <div className="space-y-0.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const cnt = stats.phan_bo?.[n] || 0;
                const pct = stats.tong_so ? (cnt / stats.tong_so * 100) : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3">{n}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-ink-900/10 overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-ink-400 w-5 text-right">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("")} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${!filter ? "bg-ink-900 text-white" : "bg-white border border-ink-900/10"}`}>
          Tất cả
        </button>
        <button onClick={() => setFilter("2")} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === "2" ? "bg-red-600 text-white" : "bg-white border border-ink-900/10"}`}>
          Cảnh báo (≤2★)
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {list.map((f) => (
            <div key={f.id} className={`bg-white rounded-2xl border p-5 ${f.danh_gia_tong < 3 ? "border-red-300" : "border-ink-900/5"}`}>
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div>
                  <div className="font-bold text-sm">{f.ten_khach}</div>
                  <div className="text-xs text-ink-400">{f.ten_san} • {f.ma_dat_san} • {formatDateTime(f.ngay_tao)}</div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} size={16} className={n <= f.danh_gia_tong ? "text-amber-400" : "text-ink-900/15"}
                      fill={n <= f.danh_gia_tong ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
              {f.nhan_xet && <p className="text-sm text-ink-700 mt-2">"{f.nhan_xet}"</p>}
              {f.danh_gia_tong < 3 && (
                <div className="mt-3 text-xs text-red-700 flex items-center gap-1">
                  <AlertTriangle size={12} /> Đánh giá thấp — cần liên hệ khách hàng
                </div>
              )}
            </div>
          ))}
          {list.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-ink-900/5 text-ink-400">Chưa có đánh giá</div>
          )}
        </div>
      )}
    </div>
  );
}
