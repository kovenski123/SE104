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

    // Validate gmail cho mọi user thường (không bao gồm staff @sanbong.vn)
    const isStaffEmail = email.toLowerCase().endsWith("@sanbong.vn");
    if (!isStaffEmail && !email.toLowerCase().endsWith("@gmail.com")) {
      setErr("Vui lòng dùng email Gmail (@gmail.com)");
      return;
    }

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

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-ink-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-700/30 rounded-full blur-3xl" />
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
            <div className="w-9 h-9 rounded-xl bg-red-700 flex items-center justify-center text-white">⚽</div>
            <span className="text-xl font-bold">Sân Bóng</span>
          </Link>

          <h2 className="text-4xl font-bold mb-2">Đăng nhập</h2>
          <p className="text-ink-400 text-sm mb-8">Sử dụng tài khoản của bạn để tiếp tục</p>

          <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
            <Field label="Email (Gmail)">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-ink-900/10 focus:border-red-700 focus:ring-4 focus:ring-red-700/10 outline-none transition"
                placeholder="ban@gmail.com"
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                type="password" required value={matKhau} onChange={(e) => setMK(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-ink-900/10 focus:border-red-700 focus:ring-4 focus:ring-red-700/10 outline-none transition"
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
            <Link href="/register" className="text-red-700 font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>

          <p className="text-center text-xs text-ink-400 mt-4">
            Email phải có đuôi <strong>@gmail.com</strong>
          </p>
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
