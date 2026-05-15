"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, formatVND, formatDate } from "@/lib/api";
import { Loader2, CheckCircle2, DollarSign, Search, X, Calendar, XCircle, RotateCcw, Ban } from "lucide-react";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  CHO_XAC_NHAN: { text: "Chờ xác nhận", cls: "bg-amber-100 text-amber-800" },
  DA_XAC_NHAN: { text: "Đã xác nhận", cls: "bg-blue-100 text-blue-800" },
  DANG_SU_DUNG: { text: "Đang sử dụng", cls: "bg-purple-100 text-purple-800" },
  HOAN_THANH: { text: "Hoàn thành", cls: "bg-green-100 text-green-700" },
  HUY: { text: "Đã hủy", cls: "bg-red-100 text-red-700" },
};

export default function BookingsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [tuNgay, setTuNgay] = useState<string>("");
  const [denNgay, setDenNgay] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filter) p.set("trang_thai", filter);
      if (keyword.trim()) p.set("keyword", keyword.trim());
      if (tuNgay) p.set("tu_ngay", tuNgay);
      if (denNgay) p.set("den_ngay", denNgay);
      const r = await apiGet(`/api/bookings?${p}`);
      setList(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter, keyword, tuNgay, denNgay]);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setKeyword(keywordInput);
  }

  function resetFilters() {
    setKeywordInput("");
    setKeyword("");
    setFilter("");
    setTuNgay("");
    setDenNgay("");
  }

  async function markComplete(id: number) {
    if (!confirm("Đánh dấu booking này đã hoàn thành?\nLưu ý: Đồ thuê sẽ tự restock vào kho.")) return;
    try {
      await apiPost(`/api/bookings/${id}/complete`);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function payInvoice(bookingId: number) {
    try {
      const invoices = await apiGet(`/api/invoices`);
      const inv = invoices.find((i: any) => i.booking_id === bookingId);
      if (!inv) {
        alert("Không tìm thấy hóa đơn");
        return;
      }
      if (inv.trang_thai === "DA_THANH_TOAN") {
        alert("Hóa đơn đã thanh toán");
        return;
      }
      if (!confirm(`Xác nhận thu ${formatVND(inv.tong_cong)}?`)) return;
      await apiPost(`/api/invoices/${inv.id}/pay`);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const hasFilters = !!(keyword || filter || tuNgay || denNgay);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold tracking-[0.25em] text-red-700 mb-2">VẬN HÀNH & KIỂM TRA</div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink-900">Lịch đặt sân</h1>
        <p className="text-sm text-ink-400 mt-1">Tìm kiếm, lọc và xác nhận các booking</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
        <form onSubmit={applySearch} className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo mã (BK...), tên khách, SĐT, email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm outline-none focus:border-red-700"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-semibold">
            Tìm
          </button>
          {hasFilters && (
            <button type="button" onClick={resetFilters}
              className="px-3 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-sm font-medium flex items-center gap-1">
              <X size={14} /> Xóa lọc
            </button>
          )}
        </form>

        <div className="flex gap-2 flex-wrap text-sm">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 bg-white outline-none focus:border-red-700">
            <option value="">Tất cả trạng thái</option>
            <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
            <option value="DA_XAC_NHAN">Đã xác nhận</option>
            <option value="DANG_SU_DUNG">Đang sử dụng</option>
            <option value="HOAN_THANH">Hoàn thành</option>
            <option value="HUY">Đã hủy</option>
          </select>

          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-ink-400" />
            <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-200 bg-white outline-none focus:border-red-700" />
            <span className="text-ink-400">→</span>
            <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-200 bg-white outline-none focus:border-red-700" />
          </div>

          <div className="ml-auto text-sm text-ink-400 self-center">
            Tìm thấy <strong className="text-ink-900">{list.length}</strong> kết quả
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs font-bold text-ink-400">
              <tr>
                <th className="text-left p-3">MÃ</th>
                <th className="text-left p-3">SÂN</th>
                <th className="text-left p-3">KHÁCH</th>
                <th className="text-left p-3">THỜI GIAN</th>
                <th className="text-right p-3">TIỀN</th>
                <th className="text-center p-3">TRẠNG THÁI</th>
                <th className="text-center p-3">HOÀN TIỀN</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const st = STATUS_LABEL[b.trang_thai];
                return (
                  <tr key={b.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="p-3 font-mono text-xs font-bold text-red-700">{b.ma_dat_san}</td>
                    <td className="p-3 font-semibold">{b.ten_san}</td>
                    <td className="p-3">
                      <div className="text-xs">
                        <div className="font-medium">{b.ten_khach || "—"}</div>
                        <div className="text-ink-400">{b.sdt_khach}</div>
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <div>{formatDate(b.ngay_dat)}</div>
                      <div className="text-ink-400">{b.gio_bat_dau.slice(0, 5)} - {b.gio_ket_thuc.slice(0, 5)}</div>
                    </td>
                    <td className="p-3 text-right font-semibold">{formatVND(b.tien_san)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st?.cls}`}>
                        {st?.text}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {b.trang_thai === "HUY" ? (
                        b.hoan_tien ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            <RotateCcw size={10} /> Đã hoàn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                            <Ban size={10} /> Không hoàn
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-ink-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {["CHO_XAC_NHAN", "DA_XAC_NHAN"].includes(b.trang_thai) && (
                        <>
                          <button onClick={() => payInvoice(b.id)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="Thu tiền">
                            <DollarSign size={14} />
                          </button>
                          <button onClick={() => setCancelTarget(b)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg" title="Hủy booking">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {b.trang_thai === "DA_XAC_NHAN" && (
                        <button onClick={() => markComplete(b.id)}
                          className="p-1.5 hover:bg-green-50 text-green-700 rounded-lg" title="Hoàn thành (tự restock đồ thuê)">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={8} className="p-12 text-center text-ink-400">
                  {hasFilters ? "Không có booking khớp bộ lọc" : "Chưa có booking"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => { setCancelTarget(null); load(); }}
        />
      )}
    </div>
  );
}

/** Modal hủy booking — CHỈ dành cho Admin/Staff với toggle Refund/No Refund */
function CancelBookingModal({ booking, onClose, onSuccess }: any) {
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const hoursUntil = (new Date(`${booking.ngay_dat}T${booking.gio_bat_dau}`).getTime() - Date.now()) / 3600000;
  const policyDefault = hoursUntil >= 24;

  async function submit() {
    if (reason.length < 3) {
      setErr("Vui lòng nhập lý do (≥3 ký tự)");
      return;
    }
    setLoading(true);
    try {
      const body: any = { ly_do_huy: reason };
      // Chỉ gửi hoan_tien nếu admin chọn override (khác null)
      if (refund !== null) body.hoan_tien = refund;
      await apiPost(`/api/bookings/${booking.id}/cancel`, body);
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h3 className="text-2xl font-bold">Hủy booking</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-ink-400">
            <div><strong className="text-ink-900">{booking.ma_dat_san}</strong> · {booking.ten_san}</div>
            <div className="text-xs mt-0.5">
              {booking.ten_khach} · {booking.sdt_khach}
            </div>
            <div className="text-xs">
              Còn <strong>{hoursUntil.toFixed(1)}h</strong> trước giờ chơi
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Lý do hủy *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:border-red-700 outline-none resize-none text-sm"
              placeholder="Ví dụ: Khách yêu cầu hủy, lịch trùng, sân bảo trì..." />
          </div>

          {/* Refund Toggle — chỉ admin/staff thấy */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-bold text-amber-900 mb-2">⚖️ HOÀN TIỀN (chỉ dành cho Admin/Staff)</div>
            <div className="text-xs text-amber-800 mb-3">
              Mặc định theo policy 24h: <strong>{policyDefault ? "Hoàn 50%" : "Không hoàn"}</strong>. Có thể override:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setRefund(null)}
                className={`px-2 py-2 rounded-lg text-xs font-semibold border-2 transition ${
                  refund === null
                    ? "bg-amber-700 text-white border-amber-700"
                    : "bg-white border-neutral-200 hover:border-amber-400"
                }`}>
                Auto (24h)
              </button>
              <button onClick={() => setRefund(true)}
                className={`px-2 py-2 rounded-lg text-xs font-semibold border-2 transition ${
                  refund === true
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-white border-neutral-200 hover:border-blue-400"
                }`}>
                <RotateCcw size={11} className="inline mr-1" />
                Hoàn tiền
              </button>
              <button onClick={() => setRefund(false)}
                className={`px-2 py-2 rounded-lg text-xs font-semibold border-2 transition ${
                  refund === false
                    ? "bg-neutral-700 text-white border-neutral-700"
                    : "bg-white border-neutral-200 hover:border-neutral-400"
                }`}>
                <Ban size={11} className="inline mr-1" />
                Không hoàn
              </button>
            </div>
          </div>

          {err && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 font-semibold text-sm">
              Quay lại
            </button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold disabled:opacity-50 text-sm">
              {loading ? "Đang hủy..." : "Xác nhận hủy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
