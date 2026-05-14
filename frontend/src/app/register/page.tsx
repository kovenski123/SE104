"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost, setToken, setUser } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ ho_ten: "", email: "", sdt: "", mat_khau: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function up(k: string, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await apiPost("/api/auth/register", form);
      setToken(res.access_token);
      setUser(res.user);
      router.push("/booking");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-brand-50 via-white to-brand-50">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center text-white">⚽</div>
          <span className="font-display text-2xl">SÂN BÓNG</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-ink-900/5">
          <h2 className="font-display text-4xl mb-2">TẠO TÀI KHOẢN</h2>
          <p className="text-ink-400 text-sm mb-6">Đăng ký miễn phí để đặt sân online 24/7</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Họ và tên" required>
              <input value={form.ho_ten} onChange={(e) => up("ho_ten", e.target.value)} required
                className="input" placeholder="Nguyễn Văn A" />
            </Field>
            <Field label="Email" required>
              <input type="email" value={form.email} onChange={(e) => up("email", e.target.value)} required
                className="input" placeholder="email@example.com" />
            </Field>
            <Field label="Số điện thoại" required>
              <input value={form.sdt} onChange={(e) => up("sdt", e.target.value)} required
                pattern="0\d{9}" maxLength={10}
                className="input" placeholder="0901234567" />
            </Field>
            <Field label="Mật khẩu (≥ 8 ký tự, có chữ và số)" required>
              <input type="password" value={form.mat_khau} onChange={(e) => up("mat_khau", e.target.value)} required minLength={8}
                className="input" placeholder="••••••••" />
            </Field>

            {err && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl font-semibold disabled:opacity-50 transition">
              {loading ? "Đang tạo..." : "Đăng ký"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-6">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>

        <style jsx>{`
          .input {
            width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem;
            border: 1px solid rgb(10 15 13 / 0.1); outline: none;
            transition: all 0.15s;
          }
          .input:focus {
            border-color: #10b981;
            box-shadow: 0 0 0 4px rgb(16 185 129 / 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink-900 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
