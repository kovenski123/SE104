"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, formatVND, formatDate } from "@/lib/api";
import { Loader2, CheckCircle2, DollarSign, Search, X, Calendar } from "lucide-react";

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
                    <td className="p-3 text-right whitespace-nowrap">
                      {["CHO_XAC_NHAN", "DA_XAC_NHAN"].includes(b.trang_thai) && (
                        <button onClick={() => payInvoice(b.id)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="Thu tiền">
                          <DollarSign size={14} />
                        </button>
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
                <tr><td colSpan={7} className="p-12 text-center text-ink-400">
                  {hasFilters ? "Không có booking khớp bộ lọc" : "Chưa có booking"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
