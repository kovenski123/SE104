"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearToken } from "@/lib/api";
import { LogOut, User, Menu, X } from "lucide-react";

export default function Navbar() {
  const [user, setU] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setU(getUser());
  }, [pathname]);

  function logout() {
    clearToken();
    setU(null);
    router.push("/");
  }

  const isAdmin = user && ["ADMIN", "QUAN_LY", "NHAN_VIEN"].includes(user.vai_tro);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="text-lg font-bold text-ink-900">Sân Bóng</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[15px]">
          <NavLink href="/" current={pathname}>Trang chủ</NavLink>
          <NavLink href="/booking" current={pathname}>Đặt sân</NavLink>
          <NavLink href="/feedback" current={pathname}>Đánh giá</NavLink>
          {user && <NavLink href="/my-bookings" current={pathname}>Lịch của tôi</NavLink>}
          {isAdmin && <NavLink href="/admin" current={pathname}>Quản trị</NavLink>}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-neutral-200">
                <User size={14} />
                <span className="text-sm">{user.ho_ten}</span>
              </div>
              <button onClick={logout} className="p-2 rounded hover:bg-neutral-100" title="Đăng xuất">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-sm hover:bg-neutral-100 rounded">Đăng nhập</Link>
              <Link href="/register" className="px-3 py-1.5 text-sm bg-ink-900 text-white rounded hover:bg-ink-800">Đăng ký</Link>
            </>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white p-3 space-y-1">
          <Link href="/" className="block px-3 py-2 rounded hover:bg-neutral-100">Trang chủ</Link>
          <Link href="/booking" className="block px-3 py-2 rounded hover:bg-neutral-100">Đặt sân</Link>
          <Link href="/feedback" className="block px-3 py-2 rounded hover:bg-neutral-100">Đánh giá</Link>
          {user && <Link href="/my-bookings" className="block px-3 py-2 rounded hover:bg-neutral-100">Lịch của tôi</Link>}
          {isAdmin && <Link href="/admin" className="block px-3 py-2 rounded hover:bg-neutral-100">Quản trị</Link>}
          {user ? (
            <button onClick={logout} className="w-full text-left px-3 py-2 rounded hover:bg-neutral-100 text-red-600">
              Đăng xuất ({user.ho_ten})
            </button>
          ) : (
            <>
              <Link href="/login" className="block px-3 py-2 rounded hover:bg-neutral-100">Đăng nhập</Link>
              <Link href="/register" className="block px-3 py-2 rounded bg-ink-900 text-white">Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const active = current === href || (href !== "/" && current.startsWith(href));
  return (
    <Link href={href}
      className={`px-3 py-1.5 rounded text-[15px] transition ${
        active ? "bg-ink-900 text-white" : "hover:bg-neutral-100"
      }`}>
      {children}
    </Link>
  );
}
