import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";

type Page = "dashboard" | "accounting" | "approval" | "admin";

const burnRateData = [
  { month: "1월", burn: 4200 },
  { month: "2월", burn: 4500 },
  { month: "3월", burn: 4800 },
  { month: "4월", burn: 5100 },
  { month: "5월", burn: 5400 },
  { month: "6월", burn: 6200 },
];

const approvalRows = [
  { id: 1, employee: "김민수", vendor: "배달의민족", amount: 32000, date: "2026-06-08", suspicious: false },
  { id: 2, employee: "이서연", vendor: "카카오T", amount: 18500, date: "2026-06-08", suspicious: false },
  { id: 3, employee: "박지훈", vendor: "신라호텔", amount: 220000, date: "2026-06-09", suspicious: true },
  { id: 4, employee: "최유진", vendor: "AWS", amount: 890000, date: "2026-06-09", suspicious: false },
  { id: 5, employee: "정하늘", vendor: "노션", amount: 12000, date: "2026-06-09", suspicious: false },
];

const initialJournal = [
  { id: 1, date: "2026-06-07", vendor: "AWS", amount: 890000, account: "서버비" },
  { id: 2, date: "2026-06-07", vendor: "배달의민족", amount: 28000, account: "복리후생비(식대)" },
];

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "AI CFO 대시보드", icon: LayoutDashboard },
  { id: "admin", label: "스마트 행정", icon: Building2 },
  { id: "accounting", label: "스마트 장부", icon: Receipt },
  { id: "approval", label: "거래 검증", icon: ShieldCheck },
];

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function TypingCell({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 40);
    return () => clearInterval(timer);
  }, [text, onComplete]);

  return <span>{display}</span>;
}

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI CFO 메인 대시보드</h2>
        <p className="mt-1 text-sm text-slate-400">스타트업 생존 여력을 한눈에 파악하는 조종석</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">현재 통장 잔고</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{formatKRW(85000000)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">실질 가용 자금</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-400">{formatKRW(65000000)}</p>
          <p className="mt-1 text-xs text-slate-500">※ 선수수익 2,000만 원 제외</p>
        </div>
        <div className="runway-warning rounded-xl border border-amber-500/40 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">남은 런웨이 (Runway)</span>
          </div>
          <p className="mt-3 text-4xl font-bold text-amber-500">13.5개월</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium text-slate-300">월별 자금 소진율 (Burn Rate) 추이</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burnRateData}>
                <defs>
                  <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 100}만`} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(v: number) => [`${v.toLocaleString()}만 원`, "소진액"]}
                />
                <Area type="monotone" dataKey="burn" stroke="#3b82f6" fill="url(#burnGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-slate-900/60 p-5">
          <div className="mb-3 flex items-center gap-2 text-blue-500">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">AI CFO Insight</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            최근 마케팅비 지출 증가로 런웨이가 단축되었습니다. 대안 자금 조달이 필요합니다.
          </p>
          <div className="mt-4 rounded-lg bg-blue-500/10 p-3 text-xs text-blue-300">
            <Sparkles className="mb-1 inline h-3 w-3" /> AI가 3건의 지원사업을 매칭했습니다. 행정 탭에서 확인하세요.
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountingPage() {
  const [scanning, setScanning] = useState(false);
  const [journal, setJournal] = useState(initialJournal);
  const [newRow, setNewRow] = useState<{
    id: number;
    date: string;
    vendor: string;
    amount: number;
    account: string;
    flash: boolean;
    typingDone: boolean;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const handleUpload = useCallback(() => {
    if (scanning) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setNewRow({
        id: Date.now(),
        date: today,
        vendor: "스타벅스",
        amount: 15000,
        account: "복리후생비(식대)",
        flash: false,
        typingDone: false,
      });
    }, 2000);
  }, [scanning, today]);

  const onTypingComplete = useCallback(() => {
    setNewRow((prev) => (prev ? { ...prev, typingDone: true, flash: true } : null));
    setTimeout(() => {
      setNewRow((prev) => {
        if (prev) {
          setJournal((j) => [{ id: prev.id, date: prev.date, vendor: prev.vendor, amount: prev.amount, account: prev.account }, ...j]);
        }
        return null;
      });
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">수기 없는 스마트 장부</h2>
        <p className="mt-1 text-sm text-slate-400">영수증 업로드만으로 자동 분개 — Zero-Touch 회계</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <button
          type="button"
          onClick={handleUpload}
          className="relative flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-8 transition hover:border-emerald-500/50 hover:bg-slate-900/60"
        >
          {scanning && (
            <div className="scan-line absolute left-4 right-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399]" />
          )}
          <Upload className="mb-4 h-12 w-12 text-slate-500" />
          <p className="text-lg font-medium text-slate-300">Drag & Drop 영수증/인보이스 업로드</p>
          <p className="mt-2 text-sm text-slate-500">클릭하여 AI 스캔 시연</p>
          {scanning && <p className="mt-4 text-sm text-emerald-400">AI 분석 중...</p>}
        </button>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="mb-4 font-semibold text-white">실시간 자동 분개장</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="pb-3 pr-4">날짜</th>
                  <th className="pb-3 pr-4">거래처</th>
                  <th className="pb-3 pr-4">금액</th>
                  <th className="pb-3">계정과목</th>
                </tr>
              </thead>
              <tbody>
                {newRow && (
                  <tr className={`border-b border-slate-800 transition-colors ${newRow.flash ? "bg-emerald-500/20" : ""}`}>
                    <td className="py-3 pr-4 text-slate-300">
                      <TypingCell text={newRow.date} />
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      <TypingCell text={newRow.vendor} />
                    </td>
                    <td className="py-3 pr-4 text-emerald-400">
                      <TypingCell text={formatKRW(newRow.amount)} onComplete={onTypingComplete} />
                    </td>
                    <td className="py-3 text-slate-300">
                      <TypingCell text={newRow.account} />
                    </td>
                  </tr>
                )}
                {journal.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800/50">
                    <td className="py-3 pr-4 text-slate-400">{row.date}</td>
                    <td className="py-3 pr-4 text-slate-300">{row.vendor}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatKRW(row.amount)}</td>
                    <td className="py-3 text-slate-400">{row.account}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

type VerifyStatus = "idle" | "loading" | "done";

function ApprovalPage() {
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleVerify = () => {
    if (status !== "idle") return;
    setStatus("loading");
    setExpandedId(null);
    setTimeout(() => {
      setStatus("done");
      setExpandedId(3);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">거래 진위 검증망</h2>
          <p className="mt-1 text-sm text-slate-400">국세청·카드사 API 교차 검증으로 중복 청구 차단</p>
        </div>
        <button
          type="button"
          onClick={handleVerify}
          disabled={status === "loading"}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400 disabled:opacity-60"
        >
          AI 거래 진위 검증 시작
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900 text-left text-slate-400">
              <th className="px-5 py-3 w-28">상태</th>
              <th className="px-5 py-3">직원</th>
              <th className="px-5 py-3">거래처</th>
              <th className="px-5 py-3">금액</th>
              <th className="px-5 py-3">일자</th>
            </tr>
          </thead>
          <tbody>
            {approvalRows.map((row) => {
              const isFailed = status === "done" && row.suspicious;
              const isPassed = status === "done" && !row.suspicious;
              return (
                <tr key={row.id}>
                  <td colSpan={5} className="p-0">
                    <div className={`transition-colors ${isFailed ? "bg-rose-500/20" : ""}`}>
                      <div className="flex items-center">
                        <div className="w-28 px-5 py-4">
                          {status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                          {isPassed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> 검증 완료
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/30 px-2 py-1 text-xs text-rose-400">
                              <AlertTriangle className="h-3 w-3" /> 검증 실패
                            </span>
                          )}
                          {status === "idle" && <span className="text-xs text-slate-500">대기</span>}
                        </div>
                        <div className="flex-1 px-5 py-4 text-slate-300">{row.employee}</div>
                        <div className="flex-1 px-5 py-4 text-slate-300">{row.vendor}</div>
                        <div className="flex-1 px-5 py-4 text-slate-300">{formatKRW(row.amount)}</div>
                        <div className="flex-1 px-5 py-4 text-slate-400">{row.date}</div>
                      </div>
                      {expandedId === row.id && isFailed && (
                        <div className="overflow-hidden border-t border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm text-rose-300 animate-[slideDown_0.4s_ease-out]">
                          🚨 검증 실패: 중복 청구 의심 (어제 동일 금액/시간대 법인카드 승인 이력 존재)
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">스마트 행정 & 지원사업 보드</h2>
        <p className="mt-1 text-sm text-slate-400">세무 일정 관리와 AI 지원사업 큐레이션</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">이번 달 필수 행정</h3>
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <p className="font-medium text-white">6/10 원천세 신고 및 납부</p>
            <p className="mt-1 text-xs text-amber-500">D-2 마감 임박</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">AI 추천 지원사업</h3>
          <div className="rounded-lg border-2 border-amber-400/60 bg-slate-900/60 p-4">
            <p className="font-medium text-white">2026 청년창업자 월세 지원 및 사업화 자금</p>
            <p className="mt-1 text-sm text-amber-400">최대 1억 원</p>
            <button
              type="button"
              className="gold-glow mt-4 w-full rounded-lg border border-amber-400/50 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/20"
            >
              <FileText className="mr-2 inline h-4 w-4" />
              AI 원클릭 서류 초안 생성
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">완료됨</h3>
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3 opacity-60">
              <p className="text-sm text-slate-400">5/25 부가가치세 신고</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3 w-3" /> 완료
              </span>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3 opacity-60">
              <p className="text-sm text-slate-400">5/10 4대보험 납부</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3 w-3" /> 완료
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 px-6 py-5">
          <h1 className="text-xl font-bold text-white">부기</h1>
          <p className="text-xs text-slate-500">Boogie AI OS</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                page === id
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4 text-xs text-slate-600">
          MVP Demo v0.1
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 md:p-8">
        {page === "dashboard" && <DashboardPage />}
        {page === "accounting" && <AccountingPage />}
        {page === "approval" && <ApprovalPage />}
        {page === "admin" && <AdminPage />}
      </main>
    </div>
  );
}
