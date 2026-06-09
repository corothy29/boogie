# 부기 (Boogie)

스타트업 통합 운영체제 — AI CFO 기반 재무·회계·행정 MVP 데모

**사이트:** https://corothy29.github.io/boogie/

## 제품 개요

| 항목 | 내용 |
|------|------|
| 제품명 | 부기 (Boogie) |
| 비전 | 스타트업의 재무·회계·행정을 대체하는 AI 통합 운영체제 |
| 핵심 가치 | Zero-Touch 회계, 실시간 자금 인사이트, 거래 진위 검증 |

## MVP 화면 구성 (4페이지)

| 페이지 | 경로 | 핵심 기능 |
|--------|------|-----------|
| AI CFO 대시보드 | `/dashboard` | 통장 잔고, 실질 가용 자금, 런웨이, Burn Rate 차트, AI 인사이트 |
| 스마트 장부 | `/accounting` | 영수증 업로드 → AI 스캔 → 자동 분개 (타이핑 효과) |
| 거래 검증 | `/approval` | 결제 청구 대기열 AI 교차 검증, 중복 청구 적발 |
| 스마트 행정 | `/admin` | 세무 일정 칸반, AI 지원사업 추천, 서류 초안 생성 |

## 시연 시나리오 (피칭 플로우)

1. **Dashboard** — 런웨이 경고등으로 자금 위기감 조성
2. **Admin** — AI 매칭 지원사업(최대 1억) 발견, 원클릭 서류 생성
3. **Accounting** — 영수증 드래그 → 1초 만에 계정과목 자동 분개
4. **Approval** — AI 검증으로 중복 청구 건 적발로 마무리

## 디자인 시스템

- **테마:** B2B SaaS 다크 모드 (`bg-slate-950`)
- **Primary:** 에메랄드 (`emerald-400`) — 정상/완료
- **Secondary:** 일렉트릭 블루 (`blue-500`) — AI 동작
- **Warning:** 앰버/로즈 — 경고/적발

## 기술 스택

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Lucide React (아이콘)
- Recharts (Burn Rate 차트)
- 단일 파일: `src/App.tsx`

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173/boogie/ 접속

## 빌드 및 배포

```bash
npm run build
```

`main` 브랜치 push 시 GitHub Actions가 `dist/`를 GitHub Pages에 자동 배포합니다.

## 프로젝트 구조

```
boogie/
├── src/
│   ├── App.tsx      # MVP 전체 UI (단일 파일)
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts   # base: /boogie/
└── .github/workflows/pages.yml
```
