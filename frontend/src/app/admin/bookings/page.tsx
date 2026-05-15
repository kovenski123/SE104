"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiGet, apiPost, formatVND, formatDate } from "@/lib/api";
import {
  Loader2, CheckCircle2, DollarSign, Search, X, Calendar,
  Filter, Clock, XCircle, RotateCcw, Ban
} from "lucide-react";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  CHO_XAC_NHAN: { text: "Chờ xác nhận", cls: "bg-accent/20 text-accent border-accent/30" },
  DA_XAC_NHAN: { text: "Đã xác nhận", cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  DANG_SU_DUNG: { text: "Đang sử dụng", cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  HOAN_THANH: { text: "Hoàn thành", cls: "bg-primary/20 text-primary border-primary/30" },
  HUY: { text: "Đã hủy", cls: "bg-destructive/20 text-destructive border-destructive/30" },
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
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter, keyword, tuNgay, denNgay]);

  function applySearch(e: React.FormEvent) { e.preventDefault(); setKeyword(keywordInput); }
  function resetFilters() { setKeywordInput(""); setKeyword(""); setFilter(""); setTuNgay(""); setDenNgay(""); }

  async function markComplete(id: number) {
    if (!confirm("Đánh dấu booking này đã hoàn thành?\nĐồ thuê sẽ tự restock vào kho.")) return;
    try { await apiPost(`/api/bookings/${id}/complete`); load(); }
    catch (e: any) { alert(e.message); }
  }

  async function payInvoice(bookingId: number) {
    try {
      const invoices = await apiGet(`/api/invoices`);
      const inv = invoices.find((i: any) => i.booking_id === bookingId);
      if (!inv) { alert("Không tìm thấy hóa đơn"); return; }
      if (inv.trang_thai === "DA_THANH_TOAN") { alert("Hóa đơn đã thanh toán"); return; }
      if (!confirm(`Xác nhận thu ${formatVND(inv.tong_cong)}?`)) return;
      await apiPost(`/api/invoices/${inv.id}/pay`);
      load();
    } catch (e: any) { alert(e.message); }
  }

  const hasFilters = !!(keyword || filter || tuNgay || denNgay);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 bg-primary rounded-full pulse-dot" />
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Vận hành</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Lịch Đặt Sân</h1>
        <p className="text-muted-foreground mt-1">Tìm kiếm, lọc và xác nhận các booking</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-3xl border border-border p-6 space-y-4">
        <form onSubmit={applySearch} className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Tìm theo mã (BK...), tên khách, SĐT..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
          </div>
          <button type="submit" className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors">Tìm kiếm</button>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="px-4 py-3 rounded-2xl border border-border hover:bg-secondary text-foreground font-medium flex items-center gap-2 transition-colors">
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}
        </form>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 rounded-xl border border-input bg-background focus:border-primary outline-none">
              <option value="">Tất cả trạng thái</option>
              <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
              <option value="DA_XAC_NHAN">Đã xác nhận</option>
              <option value="DANG_SU_DUNG">Đang sử dụng</option>
              <option value="HOAN_THANH">Hoàn thành</option>
              <option value="HUY">Đã hủy</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className="px-3 py-2 rounded-xl border border-input bg-background focus:border-primary outline-none" />
            <span className="text-muted-foreground">→</span>
            <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className="px-3 py-2 rounded-xl border border-input bg-background focus:border-primary outline-none" />
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            Tìm thấy <strong className="text-foreground">{list.length}</strong> kết quả
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="text-left p-4">Mã</th>
                  <th className="text-left p-4">Sân</th>
                  <th className="text-left p-4">Khách</th>
                  <th className="text-left p-4">Thời gian</th>
                  <th className="text-right p-4">Tiền</th>
                  <th className="text-center p-4">Trạng thái</th>
                  <th className="text-center p-4">Hoàn tiền</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((b, i) => {
                  const st = STATUS_LABEL[b.trang_thai];
                  return (
                    <motion.tr key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4"><span className="font-mono text-sm font-bold text-primary">{b.ma_dat_san}</span></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">⚽</span>
                          <span className="font-semibold text-foreground">{b.ten_san}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">{b.ten_khach || "—"}</div>
                        <div className="text-sm text-muted-foreground">{b.sdt_khach}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{formatDate(b.ngay_dat)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{b.gio_bat_dau?.slice(0, 5)} - {b.gio_ket_thuc?.slice(0, 5)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right"><span className="font-semibold text-foreground">{formatVND(b.tien_san)}</span></td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${st?.cls}`}>{st?.text}</span>
                      </td>
                      <td className="p-4 text-center">
                        {b.trang_thai === "HUY" ? (
                          b.hoan_tien ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-chart-3/20 text-chart-3 border border-chart-3/30">
                              <RotateCcw className="w-3 h-3" /> Đã hoàn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                              <Ban className="w-3 h-3" /> Không hoàn
                            </span>
                          )
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {["CHO_XAC_NHAN", "DA_XAC_NHAN"].includes(b.trang_thai) && (
                            <>
                              <button onClick={() => payInvoice(b.id)} className="p-2 rounded-xl hover:bg-chart-3/10 text-chart-3 transition-colors" title="Thu tiền">
                                <DollarSign className="w-5 h-5" />
                              </button>
                              <button onClick={() => setCancelTarget(b)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors" title="Hủy booking">
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {b.trang_thai === "DA_XAC_NHAN" && (
                            <button onClick={() => markComplete(b.id)} className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors" title="Hoàn thành">
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-16 text-center">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">{hasFilters ? "Không có booking khớp bộ lọc" : "Chưa có booking"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {cancelTarget && (
        <CancelBookingModal booking={cancelTarget} onClose={() => setCancelTarget(null)} onSuccess={() => { setCancelTarget(null); load(); }} />
      )}
    </div>
  );
}

function CancelBookingModal({ booking, onClose, onSuccess }: any) {
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const hoursUntil = (new Date(`${booking.ngay_dat}T${booking.gio_bat_dau}`).getTime() - Date.now()) / 3600000;
  const policyDefault = hoursUntil >= 24;

  async function submit() {
    if (reason.length < 3) { setErr("Vui lòng nhập lý do (≥3 ký tự)"); return; }
    setLoading(true);
    try {
      const body: any = { ly_do_huy: reason };
      if (refund !== null) body.hoan_tien = refund;
      await apiPost(`/api/bookings/${booking.id}/cancel`, body);
      onSuccess();
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-3xl w-full max-w-md shadow-2xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-2xl font-display font-bold text-foreground">Hủy booking</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-sm">
            <div className="text-foreground"><strong className="font-mono text-primary">{booking.ma_dat_san}</strong> · {booking.ten_san}</div>
            <div className="text-muted-foreground mt-1">{booking.ten_khach} · {booking.sdt_khach}</div>
            <div className="text-muted-foreground">Còn <strong className="text-foreground">{hoursUntil.toFixed(1)}h</strong> trước giờ chơi</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Lý do hủy <span className="text-destructive">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all"
              placeholder="Ví dụ: Khách yêu cầu hủy, lịch trùng, sân bảo trì..." />
          </div>

          <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
            <div className="text-xs font-bold text-accent mb-2 uppercase tracking-wider">⚖️ Hoàn tiền (Admin/Staff)</div>
            <div className="text-xs text-muted-foreground mb-3">
              Mặc định theo policy 24h: <strong className="text-foreground">{policyDefault ? "Hoàn 50%" : "Không hoàn"}</strong>. Có thể override:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setRefund(null)}
                className={`px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${refund === null ? "bg-accent text-accent-foreground border-accent" : "bg-background border-input hover:border-accent/40"}`}>
                Auto (24h)
              </button>
              <button onClick={() => setRefund(true)}
                className={`px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all flex items-center justify-center gap-1 ${refund === true ? "bg-chart-3 text-white border-chart-3" : "bg-background border-input hover:border-chart-3/40"}`}>
                <RotateCcw className="w-3 h-3" /> Hoàn tiền
              </button>
              <button onClick={() => setRefund(false)}
                className={`px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all flex items-center justify-center gap-1 ${refund === false ? "bg-muted-foreground text-background border-muted-foreground" : "bg-background border-input hover:border-muted-foreground/40"}`}>
                <Ban className="w-3 h-3" /> Không hoàn
              </button>
            </div>
          </div>

          {err && <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{err}</div>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-border hover:bg-secondary font-semibold text-sm transition-colors">Quay lại</button>
            <button onClick={submit} disabled={loading} className="flex-1 py-3 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold disabled:opacity-50 text-sm transition-colors">
              {loading ? "Đang hủy..." : "Xác nhận hủy"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
