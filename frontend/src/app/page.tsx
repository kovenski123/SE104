"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowRight, Calendar, Clock, Shield, Star } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-ink-900 leading-tight mb-5">
                Đặt sân bóng đá<br />
                <span className="text-red-700">nhanh & tiện lợi</span>
              </h1>
              <p className="text-lg text-ink-400 mb-7 leading-relaxed">
                Xem lịch trống real-time, chọn khung giờ, thanh toán QR — chỉ trong 3 bước. Không gọi điện, không chờ xác nhận.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/booking"
                  className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded font-semibold flex items-center gap-2 transition">
                  Đặt sân ngay <ArrowRight size={18} />
                </Link>
                <Link href="/register"
                  className="px-6 py-3 border border-neutral-300 hover:bg-neutral-100 rounded font-semibold transition">
                  Đăng ký thành viên
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-neutral-200 bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
              <div className="absolute inset-6 border-2 border-white/40 rounded" />
              <div className="absolute inset-y-6 left-1/2 w-px bg-white/40" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/40 rounded-full" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/60 rounded-full" />
              <span className="relative text-7xl">⚽</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-ink-900">Vì sao chọn chúng tôi?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Feature icon={<Calendar />} title="Đặt online 24/7" desc="Xem lịch trống và đặt sân bất kỳ lúc nào." />
            <Feature icon={<Shield />} title="Thanh toán an toàn" desc="QR ngân hàng, hóa đơn rõ ràng minh bạch." />
            <Feature icon={<Clock />} title="Khung giờ linh hoạt" desc="Slot 1.5 giờ, dễ chọn theo lịch của bạn." />
            <Feature icon={<Star />} title="Thẻ thành viên" desc="Ưu đãi 5-15% cho thành viên thân thiết." />
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-6 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-ink-400">
          Hệ thống đặt sân bóng đá
        </div>
      </footer>
    </>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-lg p-5 border border-neutral-200">
      <div className="w-10 h-10 rounded bg-red-50 text-red-700 flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-bold text-ink-900 mb-1">{title}</h3>
      <p className="text-sm text-ink-400">{desc}</p>
    </div>
  );
}
