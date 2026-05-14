"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { apiGet, formatDateTime } from "@/lib/api";
import { Star, Loader2, MessageSquare } from "lucide-react";

export default function FeedbackPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const params = filter ? `?min_star=${filter}&max_star=${filter}` : "";
      const r = await apiGet(`/api/feedbacks${params}`);
      setList(r);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  const avg = list.length ? (list.reduce((s, f) => s + f.danh_gia_tong, 0) / list.length).toFixed(1) : "—";

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">CỘNG ĐỒNG</div>
        <h1 className="font-display text-5xl text-ink-900 mb-2">ĐÁNH GIÁ KHÁCH HÀNG</h1>
        <p className="text-ink-400 mb-6">Trải nghiệm thực tế từ những người đã sử dụng sân</p>

        <div className="bg-ink-900 text-white rounded-2xl p-6 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-white/50 mb-1">ĐIỂM TRUNG BÌNH</div>
            <div className="font-display text-6xl text-brand-500">
              {avg} <span className="text-2xl text-white/40">/ 5</span>
            </div>
            <div className="text-sm text-white/60 mt-1">{list.length} lượt đánh giá</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFilter("")}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${!filter ? "bg-brand-500" : "bg-white/10 hover:bg-white/20"}`}>
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map((n) => (
              <button key={n} onClick={() => setFilter(String(n))}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 ${
                  filter === String(n) ? "bg-brand-500" : "bg-white/10 hover:bg-white/20"
                }`}>
                {n}<Star size={12} fill="currentColor" />
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-ink-400">
            <Loader2 className="animate-spin mx-auto mb-2" /> Đang tải...
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-ink-900/5">
            <MessageSquare className="mx-auto mb-3 text-ink-400" size={40} />
            <p className="text-ink-400">Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((f) => <FeedbackItem key={f.id} f={f} />)}
          </div>
        )}
      </div>
    </>
  );
}

function FeedbackItem({ f }: { f: any }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-900/5 p-5 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-sm">{f.ten_khach || "Khách ẩn danh"}</div>
          <div className="text-xs text-ink-400">{f.ten_san} • {formatDateTime(f.ngay_tao)}</div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={16}
              className={n <= f.danh_gia_tong ? "text-amber-400" : "text-ink-900/15"}
              fill={n <= f.danh_gia_tong ? "currentColor" : "none"} />
          ))}
        </div>
      </div>

      {f.nhan_xet && (
        <p className="text-sm text-ink-700 mb-3 leading-relaxed">"{f.nhan_xet}"</p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-ink-400">
        {f.danh_gia_co_so && <Sub label="Cơ sở vật chất" value={f.danh_gia_co_so} />}
        {f.danh_gia_nhan_vien && <Sub label="Nhân viên" value={f.danh_gia_nhan_vien} />}
        {f.danh_gia_dich_vu && <Sub label="Dịch vụ" value={f.danh_gia_dich_vu} />}
      </div>
    </div>
  );
}

function Sub({ label, value }: any) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}:{" "}
      <span className="font-bold text-ink-700">
        {value}/5 <Star size={10} fill="currentColor" className="text-amber-400 inline" />
      </span>
    </span>
  );
}
