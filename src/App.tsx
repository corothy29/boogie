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
import { Loader2, X } from "lucide-react";
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

const navItems: { id: Page; label: string }[] = [
  { id: "dashboard", label: "재무 대시보드" },
  { id: "accounting", label: "회계 장부" },
  { id: "approval", label: "결제 검증" },
  { id: "admin", label: "행정 관리" },
];

const featureLinks: { id: Page; title: string }[] = [
  { id: "dashboard", title: "재무 대시보드" },
  { id: "accounting", title: "회계 장부" },
  { id: "approval", title: "결제 검증" },
  { id: "admin", title: "행정 관리" },
];

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {desc && <p className="mt-1 text-sm text-gray-600">{desc}</p>}
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? "border border-slate-700 bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
          : "border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-block border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
      {label}
    </span>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-md">
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
    a.download = "지원사업_신청서_초안.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden border border-gray-300 bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">서류 초안</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="h-4 w-4" /></button>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-5 text-sm text-gray-700">{text}</pre>
        <div className="flex gap-2 border-t border-gray-200 bg-gray-50 p-4">
          <Btn onClick={handleCopy}>{copied ? "복사됨" : "복사"}</Btn>
          <Btn onClick={handleDownload}>다운로드</Btn>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ state, onNavigate }: { state: BoogieState; onNavigate: (p: Page) => void }) {
  const metrics = computeMetrics(state);
  const insight = getAiInsight(state, metrics);

  return (
    <div>
      <PageTitle title="재무 대시보드" desc={`분개 ${state.journal.length}건 반영`} />

      <table className="mb-8 w-full border-collapse text-sm">
        <tbody>
          <tr className="border-b border-gray-200">
            <th className="w-40 bg-gray-50 px-4 py-3 text-left font-normal text-gray-600">통장 잔고</th>
            <td className="px-4 py-3 font-medium text-gray-900">{formatKRW(metrics.bankBalance)}</td>
            <th className="w-40 bg-gray-50 px-4 py-3 text-left font-normal text-gray-600">가용 자금</th>
            <td className="px-4 py-3 font-medium text-gray-900">{formatKRW(metrics.availableFunds)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="bg-gray-50 px-4 py-3 text-left font-normal text-gray-600">런웨이</th>
            <td className="px-4 py-3 font-medium text-gray-900">
              {metrics.runwayMonths >= 99 ? "-" : `${metrics.runwayMonths.toFixed(1)}개월`}
            </td>
            <th className="bg-gray-50 px-4 py-3 text-left font-normal text-gray-600">비고</th>
            <td className="px-4 py-3 text-gray-600">선수수익 {formatKRW(state.prepaidRevenue)} 제외</td>
          </tr>
        </tbody>
      </table>

      <h3 className="mb-3 text-sm font-semibold text-gray-800">월별 소진율</h3>
      <div className="mb-8 h-44 border border-gray-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics.burnRateData}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 100}만`} width={36} />
            <Tooltip contentStyle={{ border: "1px solid #d1d5db", fontSize: 12 }} formatter={(v: number) => [`${v.toLocaleString()}만`, "소진"]} />
            <Line type="monotone" dataKey="burn" stroke="#4b5563" strokeWidth={1.5} dot={{ r: 2, fill: "#4b5563" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <span className="font-medium text-gray-800">안내 </span>
        {insight}
        <span className="ml-3">
          <button type="button" onClick={() => onNavigate("admin")} className="text-gray-700 underline hover:text-gray-900">행정 관리</button>
          <span className="mx-2 text-gray-400">|</span>
          <button type="button" onClick={() => onNavigate("approval")} className="text-gray-700 underline hover:text-gray-900">결제 검증</button>
        </span>
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
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const processFile = useCallback(
    (file: File) => {
      if (processing) return;
      if (!file.type.startsWith("image/") && file.type !== "application/pdf" && !file.name.match(/\.(jpg|jpeg|png|pdf|heic)$/i)) {
        onToast("이미지 또는 PDF 파일만 업로드할 수 있습니다.");
        return;
      }
      setProcessing(true);
      setTimeout(() => {
        const parsed = parseReceipt(file);
        onAddEntry({ ...parsed, date: today });
        setProcessing(false);
        onToast(`${file.name} 처리 완료 (${parsed.vendor}, ${formatKRW(parsed.amount)})`);
      }, 1500);
    },
    [processing, today, onAddEntry, onToast]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <PageTitle title="회계 장부" desc="영수증·인보이스 업로드 후 자동 분개" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center border border-dashed p-8 ${
            dragOver ? "border-gray-500 bg-gray-100" : "border-gray-300 bg-white hover:bg-gray-50"
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
          <p className="text-sm font-medium text-gray-800">영수증·인보이스 업로드</p>
          <p className="mt-2 text-xs text-gray-500">파일을 선택하거나 이 영역에 끌어다 놓으세요</p>
          {processing && <p className="mt-4 text-sm text-gray-600">처리 중...</p>}
        </div>

        <div className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-800">분개장</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-2 font-normal">날짜</th>
                  <th className="px-4 py-2 font-normal">거래처</th>
                  <th className="px-4 py-2 font-normal">금액</th>
                  <th className="px-4 py-2 font-normal">계정과목</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 text-gray-600">{row.date}</td>
                    <td className="px-4 py-2 text-gray-900">{row.vendor}</td>
                    <td className="px-4 py-2 text-gray-900">{formatKRW(row.amount)}</td>
                    <td className="px-4 py-2 text-gray-600">{row.account}</td>
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

  const statusLabel = (row: ApprovalRequest, loading: boolean) => {
    if (loading) return "확인 중";
    if (row.status === "verified" || row.status === "approved") return "검증 완료";
    if (row.status === "failed") return "검증 실패";
    if (row.status === "rejected") return "반려";
    return "대기";
  };

  return (
    <div>
      <PageTitle title="결제 검증" desc="분개장과 교차 대조하여 중복 청구를 확인합니다" />

      <div className="mb-4 flex gap-2">
        <Btn onClick={onReset}>초기화</Btn>
        <Btn primary onClick={handleVerify} disabled={verifying || !anyPending}>
          {verifying ? "검증 중" : "검증 실행"}
        </Btn>
      </div>

      <div className="border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-2 font-normal">상태</th>
              <th className="px-4 py-2 font-normal">직원</th>
              <th className="px-4 py-2 font-normal">거래처</th>
              <th className="px-4 py-2 font-normal">금액</th>
              <th className="px-4 py-2 font-normal">일자</th>
              <th className="px-4 py-2 font-normal">처리</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((row) => {
              const loading = verifying && row.status === "pending";
              const isFailed = row.status === "failed";
              return (
                <tr key={row.id} className={`border-b border-gray-100 ${isFailed ? "bg-gray-100" : ""}`}>
                  <td className="px-4 py-3 text-gray-700">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <StatusBadge label={statusLabel(row, loading)} />}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{row.employee}</td>
                  <td className="px-4 py-3 text-gray-900">{row.vendor}</td>
                  <td className="px-4 py-3 text-gray-900">{formatKRW(row.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{row.date}</td>
                  <td className="px-4 py-3">
                    {row.status === "verified" && (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => onApprove(row.id)} className="border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50">승인</button>
                        <button type="button" onClick={() => onReject(row.id)} className="border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50">반려</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {expandedId && approvals.find((a) => a.id === expandedId && a.status === "failed")?.failReason && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {approvals.find((a) => a.id === expandedId)?.failReason}
          </div>
        )}
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
    { key: "todo", label: "이번 달 행정" },
    { key: "recommended", label: "지원사업" },
    { key: "done", label: "완료" },
  ];

  return (
    <div>
      <PageTitle title="행정 관리" desc="세무 일정 및 지원사업 관리" />

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map(({ key, label }) => (
          <div key={key} className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-800">{label}</div>
            <div className="space-y-0 divide-y divide-gray-100">
              {tasks.filter((t) => t.column === key).map((task) => (
                <div key={task.id} className="px-4 py-3">
                  <p className="text-sm text-gray-900">{task.title}</p>
                  {task.subtitle && <p className="mt-1 text-xs text-gray-500">{task.subtitle}</p>}
                  {key === "todo" && (
                    <button type="button" onClick={() => onComplete(task.id)} className="mt-2 border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50">
                      완료
                    </button>
                  )}
                  {task.highlight && (
                    <button type="button" onClick={() => onGenerateDoc(task)} className="mt-2 border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50">
                      서류 초안 생성
                    </button>
                  )}
                  {key === "done" && <p className="mt-1 text-xs text-gray-500">처리 완료</p>}
                </div>
              ))}
              {tasks.filter((t) => t.column === key).length === 0 && (
                <p className="px-4 py-3 text-xs text-gray-500">항목 없음</p>
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-slate-800 px-6 py-4 text-white">
        <p className="text-sm">부기(Boogie)</p>
        <p className="text-xs text-gray-300">재무·회계·행정 통합 관리 시스템</p>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-gray-900">환영합니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          부기는 스타트업의 재무, 회계, 행정 업무를 통합 관리하는 시스템입니다.
        </p>

        <div className="mt-8">
          <Btn primary onClick={() => onEnter("dashboard")}>시작하기</Btn>
        </div>

        <div className="mt-12 border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-800">메뉴</div>
          <ul className="divide-y divide-gray-100">
            {featureLinks.map(({ id, title }) => (
              <li key={id}>
                <button type="button" onClick={() => onEnter(id)} className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50">
                  {title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
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
    showToast("검증이 완료되었습니다.");
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
    showToast("승인되어 분개장에 반영되었습니다.");
  };

  const handleReject = (id: number) => {
    setState((s) => ({
      ...s,
      approvals: s.approvals.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a)),
    }));
    showToast("반려 처리되었습니다.");
  };

  const resetApprovals = () => {
    setState((s) => ({
      ...s,
      approvals: INITIAL_STATE.approvals.map((a) => ({ ...a })),
    }));
    showToast("대기열이 초기화되었습니다.");
  };

  const completeTask = (id: number) => {
    setState((s) => ({
      ...s,
      adminTasks: s.adminTasks.map((t) => (t.id === id ? { ...t, column: "done" as const } : t)),
    }));
    showToast("완료 처리되었습니다.");
  };

  const resetAll = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem("boogie-mvp-state");
    showToast("데이터가 초기화되었습니다.");
  };

  const enterApp = (target: Page) => { setPage(target); setView("app"); };

  if (view === "landing") return <LandingPage onEnter={enterApp} />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-52 shrink-0 flex-col border-r border-gray-200 bg-white">
        <button type="button" onClick={() => setView("landing")} className="border-b border-gray-200 px-5 py-4 text-left hover:bg-gray-50">
          <p className="text-sm font-semibold text-gray-900">부기</p>
          <p className="text-xs text-gray-500">통합 관리 시스템</p>
        </button>
        <nav className="flex-1 py-2">
          {navItems.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={`block w-full px-5 py-2.5 text-left text-sm ${
                page === id ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-700">
            데이터 초기화
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-6 py-3">
          <p className="text-sm text-gray-600">{navItems.find((n) => n.id === page)?.label}</p>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl border border-gray-200 bg-white p-6">
            {page === "dashboard" && <DashboardPage state={state} onNavigate={setPage} />}
            {page === "accounting" && <AccountingPage journal={state.journal} onAddEntry={addJournalEntry} onToast={showToast} />}
            {page === "approval" && <ApprovalPage approvals={state.approvals} onVerify={handleVerify} onApprove={handleApprove} onReject={handleReject} onReset={resetApprovals} />}
            {page === "admin" && <AdminPage tasks={state.adminTasks} onComplete={completeTask} onGenerateDoc={setDocTask} />}
          </div>
        </main>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {docTask && <DocModal task={docTask} onClose={() => setDocTask(null)} />}
    </div>
  );
}
