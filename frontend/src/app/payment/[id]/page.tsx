"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiGet, apiPost, formatVND } from "@/lib/api";
import { CheckCircle2, Clock, Copy, Loader2, ArrowLeft, AlertCircle } from "lucide-react";

// Thông tin TK demo (đổi theo TK thật khi deploy)
const BANK = {
  name: "Ngân hàng Vietcombank",
  account: "0123456789",
  holder: "SAN BONG UIT",
  bin: "970436", // Vietcombank BIN
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claimed, setClaimed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const b = await apiGet(`/api/bookings/public/${bookingId}`);
      setBooking(b);
      // Tính lại tổng (vì invoice không có endpoint public, tính từ booking)
      const tienDV = (b.services || []).reduce((s: number, x: any) => s + parseFloat(x.thanh_tien), 0);
      const tongCong = parseFloat(b.tien_san) + tienDV;
      setInvoice({ tong_cong: tongCong, tien_san: parseFloat(b.tien_san), tien_dich_vu: tienDV });

      // Detect đã claim chưa (qua ghi_chu)
      if (b.ghi_chu && b.ghi_chu.includes("KHÁCH BÁO ĐÃ CHUYỂN KHOẢN")) {
        setClaimed(true);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [bookingId]);

  async function confirmPaid() {
    if (!confirm("Bạn xác nhận đã chuyển khoản đúng số tiền?")) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/bookings/${bookingId}/claim-paid`);
      setClaimed(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="p-16 text-center text-ink-400">
          <Loader2 className="animate-spin mx-auto mb-2" /> Đang tải...
        </div>
      </>
    );
  }

  if (err || !booking) {
    return (
      <>
        <Navbar />
        <div className="max-w-md mx-auto p-8 mt-12 bg-red-50 border border-red-200 rounded text-center">
          <AlertCircle className="mx-auto mb-2 text-red-600" />
          <p className="text-red-700">{err || "Không tìm thấy booking"}</p>
          <Link href="/booking" className="inline-block mt-4 px-4 py-2 bg-red-700 text-white rounded">
            Quay lại đặt sân
          </Link>
        </div>
      </>
    );
  }

  const amount = Math.round(invoice.tong_cong);
  const desc = `Thanh toan ${booking.ma_dat_san}`;
  // VietQR format: https://vietqr.io/en/danh-sach-api/
  const qrUrl = `https://img.vietqr.io/image/${BANK.bin}-${BANK.account}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(BANK.holder)}`;
  // Fallback nếu vietqr.io không hoạt động
  const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(`Bank:${BANK.name}|Acc:${BANK.account}|Amount:${amount}|Memo:${desc}`)}`;

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/booking" className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-ink-900 mb-4">
          <ArrowLeft size={14} /> Quay lại đặt sân
        </Link>

        <div className="text-center mb-5">
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 mb-2">Thanh toán</h1>
          <p className="text-ink-400">Quét mã QR để chuyển khoản hoàn tất đặt sân</p>
        </div>

        {/* Booking info */}
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 mb-5">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Row label="Mã đặt sân" value={booking.ma_dat_san} mono />
            <Row label="Sân" value={booking.ten_san} />
            <Row label="Ngày" value={formatDate(booking.ngay_dat)} />
            <Row label="Khung giờ" value={`${booking.gio_bat_dau.slice(0, 5)} - ${booking.gio_ket_thuc.slice(0, 5)}`} />
            <Row label="Khách hàng" value={booking.ten_khach || "-"} />
            <Row label="SĐT" value={booking.sdt_khach || "-"} />
          </div>
          {booking.services && booking.services.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-200 text-sm">
              <div className="text-xs text-ink-400 mb-1 font-semibold">DỊCH VỤ:</div>
              <div className="text-ink-700">
                {booking.services.map((s: any) => `${s.ten_dich_vu} ×${s.so_luong}`).join(" · ")}
              </div>
            </div>
          )}
        </div>

        {/* QR + Bank info */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5 mb-5">
          {!claimed ? (
            <div className="grid md:grid-cols-2 gap-6 items-center">
              {/* QR */}
              <div className="text-center">
                <div className="inline-block p-3 bg-white border-2 border-neutral-200 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="QR Code" width={280} height={280}
                    onError={(e) => { (e.target as HTMLImageElement).src = fallbackQr; }}
                    className="w-[280px] h-[280px]" />
                </div>
                <p className="text-xs text-ink-400 mt-2">Mở app ngân hàng → Quét QR</p>
              </div>

              {/* Bank info */}
              <div>
                <div className="text-xs font-bold text-ink-400 mb-3">THÔNG TIN CHUYỂN KHOẢN</div>
                <BankRow label="Ngân hàng" value={BANK.name} />
                <BankRow label="Số tài khoản" value={BANK.account} onCopy={() => copyText(BANK.account)} />
                <BankRow label="Chủ tài khoản" value={BANK.holder} />
                <BankRow label="Số tiền" value={formatVND(amount)} big onCopy={() => copyText(String(amount))} />
                <BankRow label="Nội dung" value={desc} onCopy={() => copyText(desc)} />

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  <strong>Lưu ý:</strong> Ghi đúng nội dung chuyển khoản để nhân viên đối soát nhanh chóng.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                <Clock size={32} className="text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 mb-2">Đã ghi nhận thanh toán</h2>
              <p className="text-ink-400 mb-1">
                Cảm ơn bạn. Nhân viên sẽ kiểm tra giao dịch và xác nhận đặt sân trong vài phút.
              </p>
              <p className="text-sm text-ink-400 mb-6">
                Trạng thái: <span className="text-amber-600 font-semibold">Đang chờ xác nhận</span>
              </p>

              <div className="inline-flex gap-2">
                <Link href="/booking"
                  className="px-5 py-2.5 bg-ink-900 hover:bg-ink-800 text-white rounded font-semibold transition">
                  Đặt thêm sân
                </Link>
                <Link href="/my-bookings"
                  className="px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 rounded font-semibold transition">
                  Xem lịch của tôi
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {!claimed && (
          <button onClick={confirmPaid} disabled={submitting}
            className="w-full py-4 bg-green-700 hover:bg-green-800 text-white rounded font-bold text-lg disabled:opacity-50 transition flex items-center justify-center gap-2">
            {submitting ? (
              <><Loader2 className="animate-spin" size={18} /> Đang xử lý...</>
            ) : (
              <><CheckCircle2 size={20} /> Đã thanh toán</>
            )}
          </button>
        )}

        <p className="text-xs text-center text-ink-400 mt-4">
          Sau khi bấm <strong>Đã thanh toán</strong>, đơn sẽ chuyển sang trạng thái <em>chờ nhân viên xác nhận</em>.
        </p>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-ink-400">{label}</div>
      <div className={`font-semibold text-ink-900 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function BankRow({ label, value, big, onCopy }: { label: string; value: string; big?: boolean; onCopy?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-neutral-100 last:border-b-0">
      <div className="text-sm text-ink-400">{label}</div>
      <div className="flex items-center gap-2">
        <div className={big ? "text-xl font-bold text-red-700" : "font-semibold text-ink-900 text-right"}>
          {value}
        </div>
        {onCopy && (
          <button onClick={onCopy} className="p-1 rounded hover:bg-neutral-100" title="Copy">
            <Copy size={14} className="text-ink-400" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(s: string): string {
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
