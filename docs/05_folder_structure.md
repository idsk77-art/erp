# 05. 폴더 구조 문서

## 현재 구조

```text
erp
├─ docs
│  ├─ AGENTS.md
│  ├─ CODEX_PROMPT.md
│  ├─ README.md
│  ├─ 01_overall_plan.md
│  ├─ 02_design_plan.md
│  ├─ 03_functional_plan.md
│  ├─ 04_technical_architecture.md
│  ├─ 05_folder_structure.md
│  └─ progress.md
├─ app
│  ├─ auth
│  ├─ calendar
│  ├─ contacts
│  ├─ documents
│  ├─ reports
│  └─ todos
├─ public
│  ├─ app.js
│  ├─ index.html
│  ├─ styles.css
│  └─ assets
├─ src
│  ├─ config
│  │  └─ env.ts
│  ├─ domain
│  │  ├─ auth.ts
│  │  ├─ calendar.ts
│  │  ├─ common.ts
│  │  ├─ contacts.ts
│  │  ├─ documents.ts
│  │  ├─ index.ts
│  │  ├─ reports.ts
│  │  └─ todos.ts
│  ├─ server
│  │  ├─ app.ts
│  │  ├─ request-context.ts
│  │  └─ routes
│  │     ├─ auth.ts
│  │     ├─ calendar-events.ts
│  │     ├─ contacts.ts
│  │     ├─ documents.ts
│  │     ├─ reports.ts
│  │     └─ todos.ts
│  ├─ services
│  │  └─ google-oauth.ts
│  ├─ storage
│  │  ├─ database.ts
│  │  ├─ file-storage.ts
│  │  ├─ index.ts
│  │  ├─ migrations.ts
│  │  └─ repositories
│  │     ├─ calendar-events.ts
│  │     ├─ contacts.ts
│  │     ├─ documents.ts
│  │     ├─ index.ts
│  │     ├─ reports.ts
│  │     ├─ todos.ts
│  │     └─ users.ts
│  └─ index.ts
├─ package.json
└─ tsconfig.json
```

## 역할

- `docs`: 기획, 설계, 지시문, 진행 기록
- `app`: 향후 웹 화면 또는 라우트 단위 기능 영역
- `public`: 정적 파일과 공개 에셋
- `src/config`: 환경 변수와 앱 설정
- `src/domain`: 핵심 타입, 엔티티, 비즈니스 규칙
- `src/server`: HTTP 서버, 라우팅, 미들웨어
- `src/services`: OAuth, OCR, STT, 보고서 생성 같은 외부 연동 서비스
- `src/storage`: 파일 저장소와 데이터 저장소 추상화
- `uploads`: 로컬 업로드 파일 저장소이며 Git에는 포함하지 않는다.

## 작업 순서

1. 문서 기준 확정
2. 서버 프레임워크 선택
3. 데이터베이스 선택
4. 인증 골격 구현
5. 캘린더 / 투두 MVP 구현
6. 업로드 저장소 구현
7. 명함 OCR 플로우 구현
8. 문서 스캔 저장 구현
9. 녹음 변환 및 보고서 리스트 구현
