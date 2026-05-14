"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiGet, apiPost, formatVND } from "@/lib/api";
import { AlertCircle, CheckCircle2, MapPin, Phone, User as UserIcon, Mail, Wifi, Car, Coffee, Loader2 } from "lucide-react";

// Giờ bắt đầu: mỗi 30 phút từ 6:00 đến 22:00
const START_TIMES: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) continue; // Bỏ slot 22:30 (chơi tối thiểu 30p thì kết thúc 23:00 quá giờ)
    START_TIMES.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// Duration options: 0.5h tới 3h, bước 30 phút
const DURATIONS = [0.5, 1, 1.5, 2, 2.5, 3];

function addDuration(start: string, hours: number): string {
  const [h, m] = start.split(":").map(Number);
  const totalMin = h * 60 + m + hours * 60;
  const eh = Math.floor(totalMin / 60);
  const em = totalMin % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

const DAY_LABELS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

type Field = {
  id: number;
  ten_san: string;
  loai_san: string;
  suc_chua: number;
  gia_tieu_chuan: number;
  gia_cao_diem: number;
  mo_ta: string | null;
  trang_thai: string;
};

type Service = {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh: string;
  ton_kho: number;
};

export default function BookingPage() {
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [dateOffset, setDateOffset] = useState(0); // 0..6 từ hôm nay
  const [bookedRanges, setBookedRanges] = useState<{ s: number; e: number }[]>([]);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(1); // mặc định 1 tiếng
  const [chosenSvc, setChosenSvc] = useState<Record<number, number>>({});
  const [tenKhach, setTenKhach] = useState("");
  const [sdtKhach, setSdtKhach] = useState("");
  const [emailKhach, setEmailKhach] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [loadErr, setLoadErr] = useState("");

  // Date hiện tại
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d;
  }, [dateOffset]);
  const dateStr = targetDate.toISOString().slice(0, 10);

  // Load fields + services
  useEffect(() => {
    Promise.all([
      apiGet("/api/fields?trang_thai=HOAT_DONG"),
      apiGet("/api/services?trang_thai=HOAT_DONG"),
    ])
      .then(([f, s]) => {
        setFields(f);
        setServices(s);
        if (f.length > 0) {
          setActiveField(f[0]);
        } else {
          setLoadErr("Hệ thống chưa có dữ liệu sân. Vui lòng chạy `python seed.py` ở backend.");
        }
      })
      .catch((e: any) => {
        setLoadErr(
          e.message?.includes("Failed to fetch") || e.message?.includes("NetworkError")
            ? "Không kết nối được tới backend (cổng 8000). Kiểm tra `uvicorn` đã chạy chưa."
            : `Lỗi tải dữ liệu: ${e.message}`
        );
      });
  }, []);

  // Load schedule khi field/date đổi
  useEffect(() => {
    if (!activeField) return;
    setStartTime(null);
    apiGet(`/api/fields/${activeField.id}/schedule?ngay=${dateStr}`)
      .then((r) => {
        const ranges = r.bookings.map((b: any) => {
          const [sh, sm] = b.gio_bat_dau.split(":").map(Number);
          const [eh, em] = b.gio_ket_thuc.split(":").map(Number);
          return { s: sh * 60 + sm, e: eh * 60 + em };
        });
        setBookedRanges(ranges);
      })
      .catch(() => setBookedRanges([]));
  }, [activeField, dateStr]);

  function isSlotBooked(gbd: string, gkt: string): boolean {
    const [sh, sm] = gbd.split(":").map(Number);
    const [eh, em] = gkt.split(":").map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    return bookedRanges.some((b) => s < b.e && e > b.s);
  }

  /** Kiểm tra một slot start có khả dụng (đủ chỗ cho duration đã chọn, không quá 23:00) */
  function isStartAvailable(start: string, dur: number): boolean {
    const end = addDuration(start, dur);
    const [eh, em] = end.split(":").map(Number);
    const endMin = eh * 60 + em;
    if (endMin > 23 * 60) return false; // Sân đóng cửa 23:00
    return !isSlotBooked(start, end);
  }

  function setQty(svcId: number, qty: number) {
    setChosenSvc((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[svcId];
      else n[svcId] = qty;
      return n;
    });
  }

  // Tính tiền
  const endTime = useMemo(() => startTime ? addDuration(startTime, duration) : null, [startTime, duration]);

  const tienSan = useMemo(() => {
    if (!activeField || !startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const peak = 17 * 60;
    let total = 0;
    if (start < peak) {
      const ne = Math.min(end, peak);
      total += ((ne - start) / 60) * activeField.gia_tieu_chuan;
    }
    if (end > peak) {
      const pb = Math.max(start, peak);
      total += ((end - pb) / 60) * activeField.gia_cao_diem;
    }
    return total;
  }, [activeField, startTime, endTime]);

  const tienDV = useMemo(() => {
    return Object.entries(chosenSvc).reduce((sum, [id, qty]) => {
      const svc = services.find((s) => s.id === parseInt(id));
      return sum + (svc ? svc.don_gia * qty : 0);
    }, 0);
  }, [chosenSvc, services]);

  const tongCong = tienSan + tienDV;

  async function submit() {
    setErr("");
    if (!activeField) { setErr("Vui lòng chọn sân"); return; }
    if (!startTime || !endTime) { setErr("Vui lòng chọn giờ bắt đầu"); return; }
    if (!tenKhach.trim()) { setErr("Vui lòng nhập họ tên"); return; }
    if (!/^0\d{9}$/.test(sdtKhach)) { setErr("SĐT phải gồm 10 số, bắt đầu bằng 0"); return; }
    if (emailKhach.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailKhach)) {
      setErr("Email không hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost("/api/bookings/guest", {
        san_id: activeField.id,
        ngay_dat: dateStr,
        gio_bat_dau: startTime + ":00",
        gio_ket_thuc: endTime + ":00",
        ten_khach: tenKhach,
        sdt_khach: sdtKhach,
        email_khach: emailKhach.trim() || null,
        services: Object.entries(chosenSvc).map(([id, qty]) => ({
          dich_vu_id: parseInt(id), so_luong: qty,
        })),
      });
      router.push(`/payment/${res.id}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadErr) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto p-6 mt-8">
          <div className="bg-red-50 border border-red-300 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-700 mb-1">Không tải được dữ liệu</h3>
                <p className="text-sm text-red-700 mb-3">{loadErr}</p>
                <div className="bg-white border border-red-200 rounded p-3 text-xs text-ink-700 font-mono whitespace-pre">
{`# Mở terminal mới ở folder backend rồi chạy:
cd backend
python seed.py
uvicorn app.main:app --reload`}
                </div>
                <button onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-700 text-white rounded text-sm font-semibold hover:bg-red-800">
                  Tải lại trang
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!activeField) {
    return (
      <>
        <Navbar />
        <div className="p-16 text-center text-ink-400">
          <Loader2 className="animate-spin mx-auto mb-2" /> Đang tải...
        </div>
      </>
    );
  }

  const minGia = Math.min(...fields.map((f) => f.gia_tieu_chuan));
  const maxGia = Math.max(...fields.map((f) => f.gia_cao_diem));

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Breadcrumb */}
        <div className="text-xs text-ink-400 mb-3">
          Trang chủ / Sân bóng đá / Hồ Chí Minh
        </div>

        {/* Header */}
        <div className="flex items-start gap-2 mb-1 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-ink-900">Sân bóng đá UIT</h1>
          <CheckCircle2 size={20} className="text-blue-500 mt-1.5" />
        </div>
        <div className="flex items-center gap-1 text-sm text-ink-400 mb-1">
          <MapPin size={14} /> Khu phố 6, P. Linh Trung, TP. Thủ Đức, TPHCM
        </div>
        <div className="text-sm text-ink-400 mb-5">
          Đánh giá: <span className="text-amber-500">★ 4.5/5</span>
        </div>

        {/* Preview + Info */}
        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {/* Preview (CSS pitch) */}
          <div className="md:col-span-2">
            <PitchPreview field={activeField} allFields={fields} />
            {/* Thumbnails */}
            <div className="grid grid-cols-6 gap-2 mt-2">
              {fields.slice(0, 6).map((f) => (
                <button key={f.id} onClick={() => setActiveField(f)}
                  className={`aspect-[4/3] rounded border-2 overflow-hidden transition ${
                    activeField.id === f.id ? "border-red-700" : "border-neutral-200 hover:border-neutral-400"
                  }`}>
                  <PitchMini field={f} allFields={fields} />
                </button>
              ))}
            </div>
          </div>

          {/* Info panel */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 h-fit">
            <h3 className="font-bold text-lg mb-3 text-ink-900">Thông tin sân</h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Giờ mở cửa" value="6:00 - 22:30" />
              <InfoRow label="Số sân" value={`${fields.length} sân`} />
              <InfoRow label="Giá sân" value={`${formatVND(minGia)} - ${formatVND(maxGia)}/h`} />
              <InfoRow label="Slot đặt" value="1.5 giờ" />
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="text-xs font-bold text-ink-400 mb-2">DỊCH VỤ TIỆN ÍCH</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Chip icon={<Wifi size={12} />}>Wifi</Chip>
                <Chip icon={<Car size={12} />}>Bãi đỗ xe</Chip>
                <Chip icon={<Coffee size={12} />}>Căng tin</Chip>
                <Chip>Đồ ăn</Chip>
                <Chip>Nước uống</Chip>
              </div>
            </div>
          </div>
        </div>

        {/* Field selector cards */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 text-ink-900">Chọn sân</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {fields.map((f) => (
              <button key={f.id} onClick={() => setActiveField(f)}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  activeField.id === f.id
                    ? "border-red-700 bg-red-50"
                    : "border-neutral-200 hover:border-neutral-400 bg-white"
                }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">⚽</span>
                  <span className="font-bold text-sm">{f.ten_san.split(" - ")[0]}</span>
                </div>
                <div className="text-xs text-ink-400">
                  {f.loai_san === "SAN_5" ? "Sân 5 người" : f.loai_san === "SAN_7" ? "Sân 7 người" : "Sân 11 người"}
                </div>
                <div className="text-xs text-red-700 font-semibold mt-1">{formatVND(f.gia_tieu_chuan)}/h</div>
              </button>
            ))}
          </div>
        </div>

        {/* Booking section */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5 mb-6">
          <h2 className="text-xl font-bold mb-1 text-ink-900">Đặt sân</h2>
          <p className="text-sm text-ink-400 mb-4">
            Đang đặt: <span className="font-semibold text-ink-900">{activeField.ten_san}</span>
          </p>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <LegendDot color="bg-white border-neutral-400" text="Giờ trống" />
            <LegendDot color="bg-red-100 border-red-400" text="Đã đặt" />
            <LegendDot color="bg-red-700 border-red-700" text="Đang chọn" />
            <LegendDot color="bg-amber-50 border-amber-400" text="Cao điểm" />
          </div>

          {/* Day tabs */}
          <div className="border-b border-neutral-200 mb-4 -mx-1 px-1 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const isToday = i === 0;
                const dayLabel = isToday ? "Hôm nay" : DAY_LABELS[d.getDay()];
                return (
                  <button key={i} onClick={() => setDateOffset(i)}
                    data-active={dateOffset === i}
                    className={`day-tab px-4 py-2.5 text-sm font-medium border-b-3 transition ${
                      dateOffset === i ? "text-ink-900" : "text-ink-400 hover:text-ink-900"
                    }`}>
                    <div>{dayLabel}</div>
                    <div className="text-[11px] text-ink-400">{d.getDate()}/{d.getMonth() + 1}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration picker */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-ink-900 mb-2">1. Chọn thời lượng chơi</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`px-3 py-2.5 rounded border-2 text-sm font-semibold transition ${
                    duration === d
                      ? "bg-red-700 text-white border-red-700"
                      : "bg-white border-neutral-300 hover:border-red-400"
                  }`}>
                  {d === 0.5 ? "30 phút" : `${d} giờ`}
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-1.5">Slot 30 phút — chọn từ 30 phút tới 3 giờ.</p>
          </div>

          {/* Start time grid */}
          <h3 className="text-sm font-bold text-ink-900 mb-2">2. Chọn giờ bắt đầu</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2 mb-5">
            {START_TIMES.map((t) => {
              const end = addDuration(t, duration);
              const available = isStartAvailable(t, duration);
              const isPeak = parseInt(t.split(":")[0]) >= 17;
              const isSelected = startTime === t;
              return (
                <button key={t} disabled={!available}
                  onClick={() => setStartTime(t)}
                  className={`slot ${!available ? "disabled" : ""} px-2 py-2 rounded border-2 text-xs sm:text-sm font-medium ${
                    isSelected
                      ? "bg-red-700 text-white border-red-700"
                      : !available
                      ? "bg-red-100 text-red-700 border-red-300"
                      : isPeak
                      ? "bg-amber-50 border-amber-400 text-amber-800 hover:bg-amber-100"
                      : "bg-white border-neutral-300 hover:border-neutral-500"
                  }`}
                  title={available ? `${t} - ${end}` : "Không khả dụng"}>
                  <div className="font-bold">{t}</div>
                  <div className="text-[10px] opacity-75">→ {end}</div>
                </button>
              );
            })}
          </div>

          {/* Add-ons */}
          <div className="mb-5">
            <h3 className="font-bold text-base mb-3 text-ink-900">Dịch vụ đi kèm</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {services.slice(0, 8).map((svc) => {
                const qty = chosenSvc[svc.id] || 0;
                return (
                  <label key={svc.id}
                    className={`flex items-center gap-3 p-3 rounded border-2 cursor-pointer transition ${
                      qty > 0 ? "border-red-700 bg-red-50" : "border-neutral-200 hover:border-neutral-400"
                    }`}>
                    <input type="checkbox" checked={qty > 0}
                      onChange={(e) => setQty(svc.id, e.target.checked ? 1 : 0)}
                      className="w-4 h-4 accent-red-700" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{svc.ten_dich_vu}</div>
                      <div className="text-xs text-ink-400">{formatVND(svc.don_gia)}/{svc.don_vi_tinh}</div>
                    </div>
                    {qty > 0 && (
                      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                        <button type="button" onClick={(e) => { e.preventDefault(); setQty(svc.id, qty - 1); }}
                          className="w-7 h-7 rounded bg-white border border-neutral-300 hover:bg-neutral-100">−</button>
                        <span className="w-7 text-center text-sm font-bold">{qty}</span>
                        <button type="button" onClick={(e) => { e.preventDefault(); setQty(svc.id, Math.min(qty + 1, svc.ton_kho)); }}
                          className="w-7 h-7 rounded bg-white border border-neutral-300 hover:bg-neutral-100">+</button>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Contact form */}
          <div className="mb-5">
            <h3 className="font-bold text-base mb-3 text-ink-900">Thông tin liên hệ</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <UserIcon size={14} /> Họ tên *
                </label>
                <input value={tenKhach} onChange={(e) => setTenKhach(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2.5 rounded border border-neutral-300 focus:border-red-700 focus:ring-2 focus:ring-red-100 outline-none transition" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} /> Số điện thoại *
                </label>
                <input value={sdtKhach} onChange={(e) => setSdtKhach(e.target.value)}
                  placeholder="0901234567" maxLength={10}
                  className="w-full px-3 py-2.5 rounded border border-neutral-300 focus:border-red-700 focus:ring-2 focus:ring-red-100 outline-none transition" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
                  <Mail size={14} /> Email <span className="text-ink-400 font-normal">(tuỳ chọn — để nhận nhắc lịch 30 phút trước giờ chơi)</span>
                </label>
                <input value={emailKhach} onChange={(e) => setEmailKhach(e.target.value)}
                  placeholder="ban@email.com" type="email"
                  className="w-full px-3 py-2.5 rounded border border-neutral-300 focus:border-red-700 focus:ring-2 focus:ring-red-100 outline-none transition" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-4 border border-neutral-200">
            <div className="text-sm space-y-1.5 mb-3">
              <SumRow label="Sân" value={activeField.ten_san} />
              <SumRow label="Ngày" value={`${targetDate.getDate()}/${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`} />
              <SumRow label="Khung giờ" value={startTime && endTime ? `${startTime} - ${endTime} (${duration === 0.5 ? "30 phút" : duration + " giờ"})` : "—"} />
              <SumRow label="Tiền sân" value={formatVND(tienSan)} />
              <SumRow label="Tiền dịch vụ" value={formatVND(tienDV)} />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-neutral-300">
              <span className="font-bold">Tổng cộng</span>
              <span className="text-2xl font-bold text-red-700">{formatVND(tongCong)}</span>
            </div>
          </div>

          {err && (
            <div className="mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>
          )}

          <button onClick={submit} disabled={submitting || !startTime}
            className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition">
            {submitting ? "Đang xử lý..." : "Đặt sân →"}
          </button>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-400">{label}:</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function Chip({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-neutral-300">
      {icon}{children}
    </span>
  );
}

function LegendDot({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-4 h-4 rounded border-2 ${color}`} />
      <span className="text-ink-700">{text}</span>
    </div>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-400">{label}:</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}

function PitchPreview({ field, allFields }: { field: Field; allFields: Field[] }) {
  const idx = allFields.findIndex((f) => f.id === field.id);
  const imgIdx = (idx >= 0 ? idx : 0) % 6 + 1;
  const imgSrc = `/fields/img-${imgIdx}.jpg`;

  return (
    <div className="fade-in relative aspect-[16/9] rounded-lg overflow-hidden bg-neutral-200 border border-neutral-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={field.ten_san}
        className="absolute inset-0 w-full h-full object-cover" />
      <div className="pitch-overlay absolute inset-0" />

      <div className="absolute bottom-4 left-5 right-5 text-white">
        <div className="text-2xl md:text-3xl font-bold drop-shadow-lg">{field.ten_san}</div>
        <div className="text-sm opacity-95 drop-shadow">
          {field.loai_san === "SAN_5" ? "Sân 5 người" : field.loai_san === "SAN_7" ? "Sân 7 người" : "Sân 11 người"} · Sức chứa {field.suc_chua} người
        </div>
        {field.mo_ta && <div className="text-xs opacity-90 mt-1 drop-shadow line-clamp-1">{field.mo_ta}</div>}
      </div>

      <div className="absolute top-3 right-3 bg-white/95 rounded px-2.5 py-1 text-xs font-bold text-red-700 shadow">
        {formatVND(field.gia_tieu_chuan)}/h
      </div>
    </div>
  );
}

function PitchMini({ field, allFields }: { field: Field; allFields: Field[] }) {
  const idx = allFields.findIndex((f) => f.id === field.id);
  const imgIdx = (idx >= 0 ? idx : 0) % 6 + 1;
  const imgSrc = `/fields/img-${imgIdx}.jpg`;

  return (
    <div className="relative w-full h-full bg-neutral-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={field.ten_san}
        className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20" />
      <span className="absolute bottom-1 left-1 right-1 text-white text-[10px] font-bold drop-shadow text-center">
        {field.ten_san.split(" - ")[0]}
      </span>
    </div>
  );
}
