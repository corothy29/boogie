export type JournalEntry = {
  id: number;
  date: string;
  vendor: string;
  amount: number;
  account: string;
};

export type ApprovalStatus = "pending" | "verifying" | "verified" | "failed" | "approved" | "rejected";

export type ApprovalRequest = {
  id: number;
  employee: string;
  vendor: string;
  amount: number;
  date: string;
  status: ApprovalStatus;
  failReason?: string;
};

export type AdminTask = {
  id: number;
  title: string;
  subtitle?: string;
  column: "todo" | "recommended" | "done";
  highlight?: boolean;
};

export type BoogieState = {
  journal: JournalEntry[];
  approvals: ApprovalRequest[];
  adminTasks: AdminTask[];
  prepaidRevenue: number;
  initialBalance: number;
};

const STORAGE_KEY = "boogie-mvp-state";

export const INITIAL_STATE: BoogieState = {
  initialBalance: 85_000_000,
  prepaidRevenue: 20_000_000,
  journal: [
    { id: 1, date: "2026-06-07", vendor: "AWS", amount: 890_000, account: "서버비" },
    { id: 2, date: "2026-06-07", vendor: "배달의민족", amount: 28_000, account: "복리후생비(식대)" },
  ],
  approvals: [
    { id: 1, employee: "김민수", vendor: "배달의민족", amount: 32_000, date: "2026-06-08", status: "pending" },
    { id: 2, employee: "이서연", vendor: "카카오T", amount: 18_500, date: "2026-06-08", status: "pending" },
    { id: 3, employee: "박지훈", vendor: "신라호텔", amount: 220_000, date: "2026-06-09", status: "pending" },
    { id: 4, employee: "최유진", vendor: "AWS", amount: 890_000, date: "2026-06-09", status: "pending" },
    { id: 5, employee: "정하늘", vendor: "노션", amount: 12_000, date: "2026-06-09", status: "pending" },
  ],
  adminTasks: [
    { id: 1, title: "6/10 원천세 신고 및 납부", subtitle: "D-2 마감 임박", column: "todo" },
    {
      id: 2,
      title: "2026 청년창업자 월세 지원 및 사업화 자금",
      subtitle: "최대 1억 원",
      column: "recommended",
      highlight: true,
    },
    { id: 3, title: "5/25 부가가치세 신고", column: "done" },
    { id: 4, title: "5/10 4대보험 납부", column: "done" },
  ],
};

export function loadState(): BoogieState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...JSON.parse(raw) } as BoogieState;
  } catch {
    return INITIAL_STATE;
  }
}

export function saveState(state: BoogieState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function computeMetrics(state: BoogieState) {
  const totalExpenses = state.journal.reduce((s, e) => s + e.amount, 0);
  const bankBalance = state.initialBalance - totalExpenses;
  const availableFunds = bankBalance - state.prepaidRevenue;
  const monthlyBurn = state.journal
    .filter((e) => e.date.startsWith("2026-06"))
    .reduce((s, e) => s + e.amount, 0);
  const runwayMonths = monthlyBurn > 0 ? availableFunds / monthlyBurn : 99;
  const burnRateData = [
    { month: "1월", burn: 4200 },
    { month: "2월", burn: 4500 },
    { month: "3월", burn: 4800 },
    { month: "4월", burn: 5100 },
    { month: "5월", burn: 5400 },
    { month: "6월", burn: Math.round(monthlyBurn / 10_000) || 6200 },
  ];

  return { bankBalance, availableFunds, runwayMonths, monthlyBurn, burnRateData };
}

const RECEIPT_RULES: { keywords: string[]; vendor: string; amount: number; account: string }[] = [
  { keywords: ["starbucks", "스타벅스", "coffee", "카페"], vendor: "스타벅스", amount: 15_000, account: "복리후생비(식대)" },
  { keywords: ["배달", "baemin", "요기요", "쿠팡이츠"], vendor: "배달의민족", amount: 28_000, account: "복리후생비(식대)" },
  { keywords: ["택시", "카카오t", "kakao", "uber"], vendor: "카카오T", amount: 18_500, account: "여비교통비" },
  { keywords: ["호텔", "hotel", "신라"], vendor: "신라호텔", amount: 220_000, account: "접대비" },
  { keywords: ["aws", "amazon", "서버"], vendor: "AWS", amount: 890_000, account: "서버비" },
  { keywords: ["notion", "노션", "saas"], vendor: "노션", amount: 12_000, account: "소프트웨어 이용료" },
  { keywords: ["마케팅", "google", "meta", "광고"], vendor: "구글 애즈", amount: 350_000, account: "광고선전비" },
];

export function parseReceipt(file: File): Omit<JournalEntry, "id" | "date"> {
  const hint = `${file.name} ${file.type}`.toLowerCase();
  for (const rule of RECEIPT_RULES) {
    if (rule.keywords.some((k) => hint.includes(k))) {
      return { vendor: rule.vendor, amount: rule.amount, account: rule.account };
    }
  }
  const sizeMod = file.size % 50_000;
  const vendors = ["이마트", "다이소", "CU편의점", "교보문고"];
  return {
    vendor: vendors[sizeMod % vendors.length],
    amount: 5_000 + (sizeMod % 45_000),
    account: "소모품비",
  };
}

export function findDuplicate(
  journal: JournalEntry[],
  vendor: string,
  amount: number,
  date: string
): JournalEntry | undefined {
  const target = new Date(date);
  return journal.find((e) => {
    if (e.vendor !== vendor || e.amount !== amount) return false;
    const diff = Math.abs(new Date(e.date).getTime() - target.getTime());
    return diff <= 2 * 24 * 60 * 60 * 1000;
  });
}

export function verifyApprovals(state: BoogieState): BoogieState {
  const approvals = state.approvals.map((req) => {
    if (req.status !== "pending") return req;

    if (req.vendor === "신라호텔" && req.amount === 220_000) {
      return {
        ...req,
        status: "failed" as const,
        failReason: "중복 청구 의심 (어제 동일 금액/시간대 법인카드 승인 이력 존재)",
      };
    }

    const dup = findDuplicate(state.journal, req.vendor, req.amount, req.date);
    if (dup) {
      return {
        ...req,
        status: "failed" as const,
        failReason: "중복 청구 의심 (동일 거래처·금액의 최근 분개 이력 존재)",
      };
    }
    return { ...req, status: "verified" as const };
  });
  return { ...state, approvals };
}

export function generateSupportDoc(task: AdminTask): string {
  return `【지원사업 신청서 초안】

신청 프로그램: ${task.title}
신청 기업: (주)부기데모
대표자: 홍길동
사업자등록번호: 123-45-67890

1. 사업 개요
스타트업 재무·회계 통합 관리 시스템 '부기(Boogie)'를 개발·운영 중이며,
회계 업무 자동화를 통해 초기 스타트업의 행정 비용을 절감합니다.

2. 자금 사용 계획
- 인건비: 40%
- 서버 인프라: 25%
- 마케팅: 20%
- 운영비: 15%

3. 기대 효과
런웨이 연장 및 핵심 R&D 집중을 통한 성장 가속

※ 본 문서는 시스템이 생성한 초안입니다. 검토 후 제출하세요.`;
}

export function getAiInsight(state: BoogieState, metrics: ReturnType<typeof computeMetrics>): string {
  const failed = state.approvals.filter((a) => a.status === "failed").length;
  const pending = state.approvals.filter((a) => a.status === "pending").length;
  if (failed > 0) {
    return `검증 실패 건 ${failed}건이 있습니다. 거래 검증 탭에서 확인하세요.`;
  }
  if (metrics.runwayMonths < 14) {
    return "최근 지출 증가로 런웨이가 단축되었습니다. 행정 탭의 지원사업을 검토하세요.";
  }
  if (pending > 0) {
    return `승인 대기 청구 ${pending}건이 있습니다. 거래 검증을 실행하세요.`;
  }
  return "재무 상태가 안정적입니다. 이번 달 소진율을 확인하세요.";
}
