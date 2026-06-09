import { useCallback, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  type AdminTask,
  type ApprovalRequest,
  type BoogieState,
  type JournalEntry,
  INITIAL_STATE,
  computeMetrics,
  generateSupportDoc,
  getAiInsight,
  loadState,
  parseReceipt,
  saveState,
  verifyApprovals,
} from "./store";

type View = "landing" | "app";
type Page = "dashboard" | "accounting" | "approval" | "admin";

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "AI CFO 대시보드", icon: LayoutDashboard },
  { id: "admin", label: "스마트 행정", icon: Building2 },
  { id: "accounting", label: "스마트 장부", icon: Receipt },
  { id: "approval", label: "거래 검증", icon: ShieldCheck },
];

const featureCards: { id: Page; title: string; desc: string; icon: typeof LayoutDashboard; color: string }[] = [
  { id: "dashboard", title: "AI CFO 대시보드", desc: "실시간 자금 흐름과 런웨이를 한눈에", icon: LayoutDashboard, color: "text-blue-400" },
  { id: "admin", title: "스마트 행정", desc: "세무 일정과 지원사업 AI 큐레이션", icon: Building2, color: "text-amber-400" },
  { id: "accounting", title: "스마트 장부", desc: "영수증 업로드만으로 자동 분개", icon: Receipt, color: "text-emerald-400" },
  { id: "approval", title: "거래 검증", desc: "중복 청구와 허위 거래 AI 차단", icon: ShieldCheck, color: "text-rose-400" },
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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-emerald-500/40 bg-slate-900 px-4 py-3 text-sm text-emerald-300 shadow-xl">
      {message}
    </div>
  );
}

function DocModal({ task, onClose }: { task: AdminTask; onClose: () => void }) {
  const text = generateSupportDoc(task);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "부기_지원사업_신청서_초안.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h3 className="font-semibold text-white">AI 서류 초안</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-5 text-sm text-slate-300">{text}</pre>
        <div className="flex gap-2 border-t border-slate-800 p-4">
          <button type="button" onClick={handleCopy} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/30">
            <Copy className="h-4 w-4" /> {copied ? "복사됨!" : "클립보드 복사"}
          </button>
          <button type="button" onClick={handleDownload} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/30">
            <Download className="h-4 w-4" /> 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ state, onNavigate }: { state: BoogieState; onNavigate: (p: Page) => void }) {
  const metrics = computeMetrics(state);
  const insight = getAiInsight(state, metrics);
  const runwayWarning = metrics.runwayMonths < 14;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h2 className="text-lg font-medium text-white">대시보드</h2>
        <p className="mt-1 text-sm text-slate-500">분개 {state.journal.length}건 반영</p>
      </div>

      <div className="grid grid-cols-3 gap-8 border-b border-slate-800 pb-10">
        <div>
          <p className="text-xs text-slate-500">통장 잔고</p>
          <p className="mt-1 text-xl font-semibold text-white">{formatKRW(metrics.bankBalance)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">가용 자금</p>
          <p className="mt-1 text-xl font-semibold text-white">{formatKRW(metrics.availableFunds)}</p>
          <p className="mt-0.5 text-xs text-slate-600">선수수익 제외</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">런웨이</p>
          <p className={`mt-1 text-xl font-semibold ${runwayWarning ? "text-amber-400" : "text-white"}`}>
            {metrics.runwayMonths >= 99 ? "∞" : `${metrics.runwayMonths.toFixed(1)}개월`}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-6 text-xs text-slate-500">월별 소진율</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.burnRateData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 100}만`} width={40} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [`${v.toLocaleString()}만`, "소진"]}
              />
              <Line type="monotone" dataKey="burn" stroke="#64748b" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-8">
        <p className="text-sm text-slate-400">{insight}</p>
        <div className="mt-3 flex gap-4 text-sm">
          <button type="button" onClick={() => onNavigate("admin")} className="text-slate-400 underline-offset-2 hover:text-white hover:underline">
            지원사업
          </button>
          <button type="button" onClick={() => onNavigate("approval")} className="text-slate-400 underline-offset-2 hover:text-white hover:underline">
            거래 검증
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountingPage({
  journal,
  onAddEntry,
  onToast,
}: {
  journal: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, "id">) => void;
  onToast: (msg: string) => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [newRow, setNewRow] = useState<(JournalEntry & { flash: boolean }) | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const processFile = useCallback(
    (file: File) => {
      if (scanning) return;
      if (!file.type.startsWith("image/") && file.type !== "application/pdf" && !file.name.match(/\.(jpg|jpeg|png|pdf|heic)$/i)) {
        onToast("이미지 또는 PDF 파일만 업로드 가능합니다.");
        return;
      }
      setScanning(true);
      setTimeout(() => {
        const parsed = parseReceipt(file);
        const entry = { ...parsed, date: today };
        setScanning(false);
        setNewRow({ id: Date.now(), ...entry, flash: false });
        onToast(`${file.name} 분석 완료 — ${parsed.vendor} ${formatKRW(parsed.amount)}`);
      }, 2000);
    },
    [scanning, today, onToast]
  );

  const onTypingComplete = useCallback(() => {
    setNewRow((prev) => {
      if (prev) {
        onAddEntry({ date: prev.date, vendor: prev.vendor, amount: prev.amount, account: prev.account });
        return { ...prev, flash: true };
      }
      return null;
    });
    setTimeout(() => setNewRow(null), 1000);
  }, [onAddEntry]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">수기 없는 스마트 장부</h2>
        <p className="mt-1 text-sm text-slate-400">영수증 파일 업로드 → AI 자동 분개 → 대시보드 실시간 반영</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
            dragOver ? "border-emerald-400 bg-emerald-500/10" : "border-slate-700 bg-slate-900/40 hover:border-emerald-500/50"
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
          {scanning && <div className="scan-line absolute left-4 right-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399]" />}
          <Upload className="mb-4 h-12 w-12 text-slate-500" />
          <p className="text-lg font-medium text-slate-300">Drag & Drop 영수증/인보이스 업로드</p>
          <p className="mt-2 text-sm text-slate-500">클릭하거나 파일을 끌어다 놓으세요</p>
          <p className="mt-1 text-xs text-slate-600">파일명으로 거래처·계정과목 자동 추출</p>
          {scanning && <p className="mt-4 text-sm text-emerald-400">AI OCR 분석 중...</p>}
        </div>

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
                    <td className="py-3 pr-4"><TypingCell text={newRow.date} /></td>
                    <td className="py-3 pr-4"><TypingCell text={newRow.vendor} /></td>
                    <td className="py-3 pr-4 text-emerald-400"><TypingCell text={formatKRW(newRow.amount)} onComplete={onTypingComplete} /></td>
                    <td className="py-3"><TypingCell text={newRow.account} /></td>
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

function ApprovalPage({
  approvals,
  onVerify,
  onApprove,
  onReject,
  onReset,
}: {
  approvals: ApprovalRequest[];
  onVerify: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onReset: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const anyPending = approvals.some((a) => a.status === "pending");

  const handleVerify = () => {
    if (verifying || !anyPending) return;
    setVerifying(true);
    setExpandedId(null);
    setTimeout(() => {
      onVerify();
      setVerifying(false);
      setExpandedId(3);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">거래 진위 검증망</h2>
          <p className="mt-1 text-sm text-slate-400">분개장 데이터와 교차 대조하여 중복 청구 탐지</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onReset} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800">
            <RotateCcw className="mr-1 inline h-4 w-4" /> 초기화
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || !anyPending}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.4)] transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {verifying ? "검증 중..." : "AI 거래 진위 검증 시작"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900 text-left text-slate-400">
              <th className="w-28 px-5 py-3">상태</th>
              <th className="px-5 py-3">직원</th>
              <th className="px-5 py-3">거래처</th>
              <th className="px-5 py-3">금액</th>
              <th className="px-5 py-3">일자</th>
              <th className="px-5 py-3">액션</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((row) => {
              const isFailed = row.status === "failed";
              const isPassed = row.status === "verified" || row.status === "approved";
              const isRejected = row.status === "rejected";
              const isLoading = verifying && row.status === "pending";
              return (
                <tr key={row.id}>
                  <td colSpan={6} className="p-0">
                    <div className={`transition-colors ${isFailed ? "bg-rose-500/20" : ""}`}>
                      <div className="flex items-center">
                        <div className="w-28 px-5 py-4">
                          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                          {isPassed && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" /> 검증 완료</span>}
                          {isFailed && <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/30 px-2 py-1 text-xs text-rose-400"><AlertTriangle className="h-3 w-3" /> 검증 실패</span>}
                          {isRejected && <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/30 px-2 py-1 text-xs text-slate-400"><XCircle className="h-3 w-3" /> 반려</span>}
                          {row.status === "pending" && !verifying && <span className="text-xs text-slate-500">대기</span>}
                        </div>
                        <div className="flex-1 px-5 py-4 text-slate-300">{row.employee}</div>
                        <div className="flex-1 px-5 py-4 text-slate-300">{row.vendor}</div>
                        <div className="flex-1 px-5 py-4 text-slate-300">{formatKRW(row.amount)}</div>
                        <div className="flex-1 px-5 py-4 text-slate-400">{row.date}</div>
                        <div className="flex-1 px-5 py-4">
                          {row.status === "verified" && (
                            <div className="flex gap-1">
                              <button type="button" onClick={() => onApprove(row.id)} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/30">승인</button>
                              <button type="button" onClick={() => onReject(row.id)} className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/30">반려</button>
                            </div>
                          )}
                        </div>
                      </div>
                      {expandedId === row.id && isFailed && row.failReason && (
                        <div className="overflow-hidden border-t border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm text-rose-300 animate-[slideDown_0.4s_ease-out]">
                          🚨 검증 실패: {row.failReason}
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

function AdminPage({
  tasks,
  onComplete,
  onGenerateDoc,
}: {
  tasks: AdminTask[];
  onComplete: (id: number) => void;
  onGenerateDoc: (task: AdminTask) => void;
}) {
  const columns: { key: AdminTask["column"]; label: string }[] = [
    { key: "todo", label: "이번 달 필수 행정" },
    { key: "recommended", label: "AI 추천 지원사업" },
    { key: "done", label: "완료됨" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">스마트 행정 & 지원사업 보드</h2>
        <p className="mt-1 text-sm text-slate-400">세무 일정 관리 · 지원사업 큐레이션 · 서류 자동 생성</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">{label}</h3>
            <div className="space-y-2">
              {tasks.filter((t) => t.column === key).map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg border bg-slate-900/60 p-4 ${task.highlight ? "border-2 border-amber-400/60" : "border-slate-700"} ${key === "done" ? "opacity-60" : ""}`}
                >
                  <p className="font-medium text-white">{task.title}</p>
                  {task.subtitle && <p className={`mt-1 text-xs ${task.highlight ? "text-amber-400" : "text-amber-500"}`}>{task.subtitle}</p>}
                  {key === "todo" && (
                    <button type="button" onClick={() => onComplete(task.id)} className="mt-3 rounded bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600">
                      완료 처리
                    </button>
                  )}
                  {task.highlight && (
                    <button
                      type="button"
                      onClick={() => onGenerateDoc(task)}
                      className="gold-glow mt-4 w-full rounded-lg border border-amber-400/50 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/20"
                    >
                      <FileText className="mr-2 inline h-4 w-4" />
                      AI 원클릭 서류 초안 생성
                    </button>
                  )}
                  {key === "done" && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> 완료
                    </span>
                  )}
                </div>
              ))}
              {tasks.filter((t) => t.column === key).length === 0 && (
                <p className="text-xs text-slate-600">항목 없음</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPage({ onEnter }: { onEnter: (page: Page) => void }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="relative z-10 w-full max-w-4xl text-center">
        <p className="mb-3 text-sm font-medium tracking-widest text-blue-400">BOOGIE AI OS</p>
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-violet-300 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">환영합니다</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">스타트업의 재무·회계·행정을 대체하는 AI 통합 운영체제, 부기에 오신 것을 환영합니다.</p>
        <button type="button" onClick={() => onEnter("dashboard")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.4)] transition hover:bg-blue-400">
          대시보드 시작하기 <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      <div className="relative z-10 mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        {featureCards.map(({ id, title, desc, icon: Icon, color }) => (
          <button key={id} type="button" onClick={() => onEnter(id)} className="group rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-left transition hover:border-slate-600 hover:bg-slate-900">
            <Icon className={`mb-3 h-8 w-8 ${color}`} />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-blue-400 opacity-0 transition group-hover:opacity-100">바로가기 <ArrowRight className="h-4 w-4" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [page, setPage] = useState<Page>("dashboard");
  const [state, setState] = useState<BoogieState>(loadState);
  const [toast, setToast] = useState<string | null>(null);
  const [docTask, setDocTask] = useState<AdminTask | null>(null);

  useEffect(() => { saveState(state); }, [state]);

  const showToast = (msg: string) => setToast(msg);

  const addJournalEntry = (entry: Omit<JournalEntry, "id">) => {
    setState((s) => ({
      ...s,
      journal: [{ id: Date.now(), ...entry }, ...s.journal],
    }));
  };

  const handleVerify = () => {
    setState((s) => verifyApprovals(s));
    showToast("AI 거래 검증이 완료되었습니다.");
  };

  const handleApprove = (id: number) => {
    setState((s) => ({
      ...s,
      approvals: s.approvals.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a)),
      journal: (() => {
        const req = s.approvals.find((a) => a.id === id);
        if (!req) return s.journal;
        return [{ id: Date.now(), date: req.date, vendor: req.vendor, amount: req.amount, account: "미분류비용" }, ...s.journal];
      })(),
    }));
    showToast("청구가 승인되어 분개장에 반영되었습니다.");
  };

  const handleReject = (id: number) => {
    setState((s) => ({
      ...s,
      approvals: s.approvals.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a)),
    }));
    showToast("청구가 반려되었습니다.");
  };

  const resetApprovals = () => {
    setState((s) => ({
      ...s,
      approvals: INITIAL_STATE.approvals.map((a) => ({ ...a })),
    }));
    showToast("검증 대기열이 초기화되었습니다.");
  };

  const completeTask = (id: number) => {
    setState((s) => ({
      ...s,
      adminTasks: s.adminTasks.map((t) => (t.id === id ? { ...t, column: "done" as const } : t)),
    }));
    showToast("행정 업무가 완료 처리되었습니다.");
  };

  const resetAll = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem("boogie-mvp-state");
    showToast("데모 데이터가 초기화되었습니다.");
  };

  const enterApp = (target: Page) => { setPage(target); setView("app"); };

  if (view === "landing") return <LandingPage onEnter={enterApp} />;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/50">
        <button type="button" onClick={() => setView("landing")} className="border-b border-slate-800 px-6 py-5 text-left transition hover:bg-slate-800/50">
          <h1 className="text-xl font-bold text-white">부기</h1>
          <p className="text-xs text-slate-500">Boogie AI OS</p>
        </button>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setPage(id)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${page === id ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <button type="button" onClick={resetAll} className="flex w-full items-center gap-2 text-xs text-slate-500 hover:text-slate-300">
            <RotateCcw className="h-3 w-3" /> 데모 초기화
          </button>
          <p className="mt-2 text-xs text-slate-600">MVP v0.2</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 md:p-8">
        {page === "dashboard" && <DashboardPage state={state} onNavigate={setPage} />}
        {page === "accounting" && <AccountingPage journal={state.journal} onAddEntry={addJournalEntry} onToast={showToast} />}
        {page === "approval" && <ApprovalPage approvals={state.approvals} onVerify={handleVerify} onApprove={handleApprove} onReject={handleReject} onReset={resetApprovals} />}
        {page === "admin" && <AdminPage tasks={state.adminTasks} onComplete={completeTask} onGenerateDoc={setDocTask} />}
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {docTask && <DocModal task={docTask} onClose={() => setDocTask(null)} />}
    </div>
  );
}
