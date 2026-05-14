"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiGet, apiPost, formatVND, formatDate, getUser } from "@/lib/api";
import { Sparkles, Check, Loader2 } from "lucide-react";

const CARDS = [
  {
    type: "BAC", name: "BẠC", color: "from-slate-400 to-slate-600", text: "text-slate-100",
    monthly: 200000, discount: "5%",
    perks: ["Giảm 5% tiền sân", "Đặt sân trước 7 ngày", "Hỗ trợ ưu tiên"],
  },
  {
    type: "VANG", name: "VÀNG", color: "from-amber-400 to-amber-600", text: "text-amber-50",
    monthly: 400000, discount: "10%",
    perks: ["Giảm 10% tiền sân", "Đặt sân trước 14 ngày", "Tặng 1 chai nước/lần", "Hỗ trợ VIP"],
  },
  {
    type: "BACH_KIM", name: "BẠCH KIM", color: "from-zinc-700 via-zinc-900 to-black", text: "text-white",
    monthly: 700000, discount: "15%",
    perks: ["Giảm 15% tiền sân", "Đặt sân trước 30 ngày", "Tặng dịch vụ thuê giày", "Concierge 24/7"],
  },
];

const PERIODS = [1, 3, 6, 12];

export default function MembershipPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<any>(null);
  const [chosen, setChosen] = useState<string>("VANG");
  const [thang, setThang] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getUser()) {
      router.push("/login");
      return;
    }
    apiGet("/api/memberships/me")
      .then((r) => setCurrent(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function calcFee(type: string, months: number): number {
    const card = CARDS.find((c) => c.type === type);
    if (!card) return 0;
    let d = 0;
    if (months >= 12) d = 0.20;
    else if (months >= 6) d = 0.10;
    else if (months >= 3) d = 0.05;
    return card.monthly * months * (1 - d);
  }

  async function submit() {
    setSubmitting(true);
    try {
      await apiPost("/api/memberships", { loai_the: chosen, thoi_han_thang: thang });
      alert("Đăng ký thẻ thành viên thành công!");
      const r = await apiGet("/api/memberships/me");
      setCurrent(r);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="p-16 text-center text-ink-400">
          <Loader2 className="animate-spin mx-auto mb-2" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-xs font-bold tracking-[0.25em] text-brand-600 mb-2">ƯU ĐÃI</div>
        <h1 className="font-display text-5xl text-ink-900 mb-2">THẺ THÀNH VIÊN</h1>
        <p className="text-ink-400 mb-6">Càng đặt nhiều — càng tiết kiệm. Gia hạn linh hoạt 1–12 tháng.</p>

        {current && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs text-white/60 mb-1">THẺ HIỆN TẠI</div>
                <div className="font-display text-3xl">{current.loai_the}</div>
                <div className="text-sm text-white/70 mt-1">
                  Hiệu lực: {formatDate(current.ngay_bat_dau)} → {formatDate(current.ngay_ket_thuc)}
                </div>
              </div>
              <Sparkles size={40} className="text-amber-300" />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {CARDS.map((c) => (
            <button key={c.type} onClick={() => setChosen(c.type)}
              className={`relative rounded-3xl bg-gradient-to-br ${c.color} ${c.text} p-6 text-left overflow-hidden ${
                chosen === c.type ? "ring-4 ring-brand-500 scale-[1.02]" : "hover:scale-[1.01]"
              } transition`}>
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
              <div className="relative">
                <div className="text-xs tracking-wider opacity-80 mb-1">THẺ</div>
                <div className="font-display text-4xl mb-3">{c.name}</div>
                <div className="text-3xl font-bold mb-1">{c.discount}</div>
                <div className="text-xs opacity-80 mb-4">giảm tiền sân</div>
                <div className="text-xs opacity-90 mb-4">{formatVND(c.monthly)}/tháng</div>
                <ul className="space-y-1.5 text-xs">
                  {c.perks.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check size={12} className="shrink-0 mt-0.5" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-ink-900/5 p-6">
          <h2 className="font-display text-2xl mb-4">Chọn thời hạn</h2>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {PERIODS.map((p) => {
              const off = p >= 12 ? "−20%" : p >= 6 ? "−10%" : p >= 3 ? "−5%" : null;
              return (
                <button key={p} onClick={() => setThang(p)}
                  className={`p-3 rounded-xl border-2 text-center transition ${
                    thang === p ? "border-brand-500 bg-brand-50" : "border-ink-900/10 hover:border-brand-300"
                  }`}>
                  <div className="font-display text-2xl">{p}</div>
                  <div className="text-xs text-ink-400">tháng</div>
                  {off && <div className="text-[10px] text-brand-700 font-bold mt-1">{off}</div>}
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-ink-900/[0.03] flex justify-between items-center mb-4">
            <div>
              <div className="text-xs text-ink-400">Tổng phí thẻ</div>
              <div className="font-display text-4xl text-ink-900">{formatVND(calcFee(chosen, thang))}</div>
            </div>
            <div className="text-right text-xs text-ink-400">
              {CARDS.find((c) => c.type === chosen)?.name} • {thang} tháng
            </div>
          </div>

          <button onClick={submit} disabled={submitting}
            className="w-full py-3.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl font-bold disabled:opacity-50 transition">
            {submitting ? "Đang xử lý..." : current ? "Gia hạn thẻ" : "Đăng ký ngay"}
          </button>
        </div>
      </div>
    </>
  );
}
