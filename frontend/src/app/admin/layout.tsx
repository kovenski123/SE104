"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getUser, clearToken } from "@/lib/api";
import {
  LayoutDashboard, Calendar, MapPin, Package, Users, ClipboardList,
  Star, FileBarChart, LogOut, Menu, X, Zap, ChevronRight, Bell
} from "lucide-react";

const MENU = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", roles: ["ADMIN", "QUAN_LY", "NHAN_VIEN"] },
  { href: "/admin/bookings", icon: Calendar, label: "Lịch Đặt Sân", roles: ["ADMIN", "QUAN_LY", "NHAN_VIEN"] },
  { href: "/admin/fields", icon: MapPin, label: "Quản Lý Sân", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/services", icon: Package, label: "Dịch Vụ", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/users", icon: Users, label: "Tài Khoản", roles: ["ADMIN"] },
  { href: "/admin/shifts", icon: ClipboardList, label: "Phân Ca", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/feedbacks", icon: Star, label: "Đánh Giá", roles: ["ADMIN", "QUAN_LY"] },
  { href: "/admin/reports", icon: FileBarChart, label: "Báo Cáo", roles: ["ADMIN", "QUAN_LY"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setU] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = getUser();
    if (!u || !["ADMIN", "QUAN_LY", "NHAN_VIEN"].includes(u.vai_tro)) {
      router.push("/login");
      return;
    }
    setU(u);
  }, [router]);

  function logout() { clearToken(); router.push("/"); }

  if (!user) return null;
  const items = MENU.filter((m) => m.roles.includes(user.vai_tro));

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden bg-sidebar text-sidebar-foreground p-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">KICKOFF</div>
            <div className="text-[10px] text-sidebar-foreground/50">Admin Panel</div>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-sidebar-accent transition-colors">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`fixed lg:sticky top-0 left-0 z-40 w-72 h-screen bg-sidebar text-sidebar-foreground flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300`}>
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-xl leading-none">KICKOFF</div>
              <div className="text-xs text-sidebar-foreground/50 mt-0.5">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map((m) => {
            const active = pathname === m.href || (m.href !== "/admin" && pathname.startsWith(m.href));
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}>
                <Icon className="w-5 h-5" />
                <span className="flex-1">{m.label}</span>
                {active && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="p-4 rounded-2xl bg-sidebar-accent mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">{user.ho_ten?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sidebar-foreground truncate">{user.ho_ten}</div>
                <div className="text-xs text-sidebar-foreground/50">{user.vai_tro}</div>
              </div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all">
            <LogOut className="w-5 h-5" /><span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" />
        )}
      </AnimatePresence>

      <main className="lg:ml-72 min-h-screen">
        <div className="hidden lg:flex items-center justify-between p-6 border-b border-border bg-card">
          <div>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-xs">{user.ho_ten?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{user.ho_ten}</span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
