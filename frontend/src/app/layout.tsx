import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sân Bóng — Đặt lịch & Quản lý",
  description: "Hệ thống đặt lịch và quản lý sân bóng đá",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
