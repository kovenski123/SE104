"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getUser, clearToken } from "@/lib/api";
import {
  LayoutDashboard, Calendar, MapPin, Package, Users, ClipboardList,
  Star, FileBarChart, LogOut, Menu, X
} from "lucide-react";

const MENU = [
  { href: "/admin", icon: LayoutDashboard, label: "Bảng điều khiển", roles: ["ADMIN", "QUAN_LY", "NHAN_VIEN"] },
  { href: "/admin/bookings", icon: Calendar, label: "Lịch đặt sân", roles: ["ADMIN", "QUAN_LY", "NHAN_VIEN"] },
  { href: "/admin/fields", icon: MapPin, label: "Quản lý sân", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/services", icon: Package, label: "Dịch vụ", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/users", icon: Users, label: "Tài khoản", roles: ["ADMIN"] },
  { href: "/admin/shifts", icon: ClipboardList, label: "Phân ca", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/feedbacks", icon: Star, label: "Đánh giá", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/reports", icon: FileBarChart, label: "Báo cáo", roles: ["ADMIN", "QUAN_LY"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setU] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = getUser();
    if (!u || !["ADMIN", "QUAN_LY", "NHAN_VIEN"].includes(u.vai_tro)) {
      router.push("/login");
      return;
    }
    setU(u);
  }, []);

  function logout() {
    clearToken();
    router.push("/");
  }

  if (!user) return null;

  const items = MENU.filter((m) => m.roles.includes(user.vai_tro));

  return (
    <div className="min-h-screen bg-ink-900/[0.02]">
      {/* Mobile header */}
      <div className="lg:hidden bg-ink-900 text-white p-3 flex items-center justify-between sticky top-0 z-30">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">⚽</div>
          <span className="font-display text-lg">QUẢN TRỊ</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-ink-900 text-white flex flex-col ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 transition-transform`}>
        <div className="p-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">⚽</div>
            <div>
              <div className="font-display text-lg leading-none">SÂN BÓNG</div>
              <div className="text-[10px] text-white/40 mt-0.5">ADMIN PANEL</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map((m) => {
            const active = pathname === m.href || (m.href !== "/admin" && pathname.startsWith(m.href));
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-brand-500 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}>
                <Icon size={16} />
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="px-3 py-2 rounded-xl bg-white/5 text-xs mb-2">
            <div className="font-bold">{user.ho_ten}</div>
            <div className="text-white/50 mt-0.5">{user.vai_tro}</div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
