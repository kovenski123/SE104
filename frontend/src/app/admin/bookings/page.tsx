"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, formatVND, formatDate, getUser } from "@/lib/api";
import { Loader2, CheckCircle2, X, DollarSign } from "lucide-react";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  CHO_XAC_NHAN: { text: "Chờ xác nhận", cls: "bg-amber-100 text-amber-800" },
  DA_XAC_NHAN: { text: "Đã xác nhận", cls: "bg-blue-100 text-blue-800" },
  DANG_SU_DUNG: { text: "Đang sử dụng", cls: "bg-purple-100 text-purple-800" },
  HOAN_THANH: { text: "Hoàn thành", cls: "bg-brand-100 text-brand-700" },
  HUY: { text: "Đã hủy", cls: "bg-red-100 text-red-700" },
};

export default function BookingsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = filter ? `?trang_thai=${filter}` : "";
      const r = await apiGet(`/api/bookings${params}`);
      setList(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function markComplete(id: number) {
    if (!confirm("Đánh dấu booking này đã hoàn thành?")) return;
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

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">VẬN HÀNH</div>
          <h1 className="font-display text-4xl">LỊCH ĐẶT SÂN</h1>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-ink-900/10 bg-white font-medium text-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
          <option value="DA_XAC_NHAN">Đã xác nhận</option>
          <option value="HOAN_THANH">Hoàn thành</option>
          <option value="HUY">Đã hủy</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-400"><Loader2 className="animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-900/5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/[0.03] text-xs font-bold text-ink-400">
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
                  <tr key={b.id} className="border-t border-ink-900/5">
                    <td className="p-3 font-mono text-xs">{b.ma_dat_san}</td>
                    <td className="p-3 font-semibold">{b.ten_san}</td>
                    <td className="p-3">
                      <div className="text-xs">
                        <div className="font-medium">{b.ten_khach || "—"}</div>
                        <div className="text-ink-400">{b.sdt_khach}</div>
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <div>{formatDate(b.ngay_dat)}</div>
                      <div className="text-ink-400">{b.gio_bat_dau.slice(0,5)} - {b.gio_ket_thuc.slice(0,5)}</div>
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
                          className="p-1.5 hover:bg-brand-50 text-brand-700 rounded-lg" title="Hoàn thành">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-ink-400">Không có booking</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
