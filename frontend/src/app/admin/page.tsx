"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, formatVND } from "@/lib/api";
import { TrendingUp, Calendar, MapPin, Users, ArrowRight, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [recentBookings, setRB] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);

    Promise.all([
      apiGet(`/api/reports/summary?tu_ngay=${start}&den_ngay=${end}`).catch(() => null),
      apiGet(`/api/bookings`).catch(() => []),
    ]).then(([s, b]) => {
      setSummary(s);
      setRB(b.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-ink-400"><Loader2 className="animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">TỔNG QUAN</div>
        <h1 className="font-display text-4xl text-ink-900">BẢNG ĐIỀU KHIỂN</h1>
        <p className="text-ink-400 text-sm mt-1">Số liệu tháng hiện tại</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng doanh thu"
            value={formatVND(summary.tong_doanh_thu)}
            icon={<TrendingUp />}
            color="bg-brand-50 text-brand-700"
          />
          <StatCard
            label="Lượt đặt"
            value={summary.tong_luot_dat}
            icon={<Calendar />}
            color="bg-amber-50 text-amber-700"
          />
          <StatCard
            label="Tỷ lệ lấp đầy"
            value={`${summary.ty_le_lap_day}%`}
            icon={<MapPin />}
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="Khách hàng"
            value={summary.tong_khach_hang}
            icon={<Users />}
            color="bg-purple-50 text-purple-700"
          />
        </div>
      )}

      {summary && (
        <div className="grid md:grid-cols-2 gap-4">
          <InfoCard title="Sân đặt nhiều nhất" value={summary.san_dat_nhieu_nhat || "—"} />
          <InfoCard title="Khung giờ cao điểm" value={summary.khung_gio_cao_diem || "—"} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ink-900/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">LỊCH ĐẶT GẦN ĐÂY</h2>
          <Link href="/admin/bookings" className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:underline">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-ink-400 text-sm">Chưa có booking</p>
        ) : (
          <div className="divide-y divide-ink-900/5">
            {recentBookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-bold">{b.ten_san}</div>
                  <div className="text-xs text-ink-400">
                    {b.ten_khach || "Khách vãng lai"} • {b.ngay_dat} {b.gio_bat_dau.slice(0, 5)}-{b.gio_ket_thuc.slice(0, 5)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatVND(b.tien_san)}</div>
                  <div className="text-[10px] text-ink-400">{b.trang_thai}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction href="/admin/bookings" label="Tạo booking" />
        <QuickAction href="/admin/fields" label="Quản lý sân" />
        <QuickAction href="/admin/reports" label="Báo cáo chi tiết" />
        <QuickAction href="/admin/shifts" label="Phân ca" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-ink-900/5 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <div className="text-xs text-ink-400 mb-1">{label}</div>
      <div className="font-display text-2xl text-ink-900">{value}</div>
    </div>
  );
}

function InfoCard({ title, value }: any) {
  return (
    <div className="bg-white rounded-2xl border border-ink-900/5 p-5">
      <div className="text-xs text-ink-400 mb-1">{title}</div>
      <div className="font-display text-xl text-ink-900">{value}</div>
    </div>
  );
}

function QuickAction({ href, label }: any) {
  return (
    <Link href={href} className="p-4 bg-white rounded-xl border border-ink-900/5 hover:border-brand-500 hover:bg-brand-50/50 transition flex items-center justify-between text-sm font-semibold">
      {label} <ArrowRight size={14} className="text-ink-400" />
    </Link>
  );
}
