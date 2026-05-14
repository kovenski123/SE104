"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost, setToken, setUser } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [matKhau, setMK] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await apiPost("/api/auth/login", { email, mat_khau: matKhau });
      setToken(res.access_token);
      setUser(res.user);
      if (["ADMIN", "QUAN_LY", "NHAN_VIEN"].includes(res.user.vai_tro)) {
        router.push("/admin");
      } else {
        router.push("/booking");
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(em: string, pw: string) {
    setEmail(em);
    setMK(pw);
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-ink-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 pitch-pattern opacity-20" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-red-700 flex items-center justify-center text-lg">⚽</div>
          <div className="text-xl font-bold">Sân Bóng</div>
        </Link>
        <div className="relative">
          <h1 className="text-5xl font-bold mb-4">
            Chào mừng<br /><span className="text-red-500">trở lại</span>
          </h1>
          <p className="text-white/60 max-w-md">
            Đăng nhập để xem lịch đặt, quản lý booking và nhận ưu đãi từ thẻ thành viên.
          </p>
        </div>
        <div className="relative text-xs text-white/40">Hệ thống đặt sân bóng đá</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">⚽</div>
            <span className="font-display text-xl">SÂN BÓNG</span>
          </Link>

          <h2 className="font-display text-4xl mb-2">ĐĂNG NHẬP</h2>
          <p className="text-ink-400 text-sm mb-8">Sử dụng tài khoản của bạn để tiếp tục</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-900/10 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                placeholder="ban@example.com"
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                type="password" required value={matKhau} onChange={(e) => setMK(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-900/10 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                placeholder="••••••••"
              />
            </Field>

            {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl font-semibold disabled:opacity-50 transition"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-6">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-brand-600 font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>

          <div className="mt-8 p-4 rounded-xl bg-ink-900/[0.03] border border-ink-900/5">
            <div className="text-xs font-bold tracking-wider text-ink-400 mb-3">⚡ TÀI KHOẢN DEMO</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <DemoBtn onClick={() => fillDemo("admin@sanbong.vn", "admin123")} label="Admin" />
              <DemoBtn onClick={() => fillDemo("quanly@sanbong.vn", "quanly123")} label="Quản lý" />
              <DemoBtn onClick={() => fillDemo("nva@sanbong.vn", "nhanvien123")} label="Nhân viên" />
              <DemoBtn onClick={() => fillDemo("khach@gmail.com", "khach1234")} label="Khách hàng" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-900 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function DemoBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="px-3 py-2 rounded-lg bg-white border border-ink-900/10 hover:border-brand-500 hover:bg-brand-50 transition font-medium text-left">
      {label}
    </button>
  );
}
