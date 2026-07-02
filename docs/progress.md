# progress.md

## 2026-07-02

### 이번 단계 완료

- 업로드 파일 경로 누락 오류 수정 (Relative Upload Path -> Absolute Path Resolution)을 통해 실 API 연동 정상화
- 전체 대시보드 기능(캘린더 일정, 연락처 추가/삭제, 문서 삭제, 보고서 삭제) E2E 시나리오 브라우저 종합 검증 완료
- GET/DELETE 등 본문(body)이 없는 API 호출 시 Content-Type 헤더가 붙어 서버(Fastify) JSON 파서가 500 에러를 던지던 오류 해결
- Gemini API 호출 응답 JSON 마크다운 블록 스트립 기능 구현 및 실 연동 파싱 오류 수정
- 명함 스캔 및 파일 업로드 시 파일 미선택에 대한 사용자 검증 알림 추가
- 참고 시안에 맞춘 프리미엄 글래스모피즘(Glassmorphism) 및 창가 조명 배경 테마 적용
- 구글 계정 로그인 화면 UI 구현 및 프론트엔드 연동 완료
- `/api/me` 사용자 인증 프로필 확인 API 구현
- 미인증 시 대시보드 접근 통제 및 로그인 세션 쿠키 검증 연동
- 구글 OAuth 미설정 시 로컬 개발 사용자 mock 로그인 기능 지원
- JWT 인증 보강 (Bearer 토큰 및 HttpOnly 쿠키 지원)
- 비즈니스 카드 OCR 스캔 서비스 (`src/services/ocr.ts`) 구현 및 업로드 API 연동
- 녹음본 STT 변환 서비스 (`src/services/stt.ts`) 구현 및 비동기 처리 적용
- 연락처 패널에 명함 스캔 등록 및 OCR 결과 검토 모달 UI 추가
- 녹음본 변환 비동기 상태 폴링 추가
- 서버 프레임워크를 Fastify로 선택
- 초기 데이터베이스 방향을 SQLite로 선택
- 환경 변수 검증 모듈 `src/config/env.ts` 추가
- Fastify 서버 골격 `src/server/app.ts` 추가
- `/health` 상태 확인 API 추가
- NANO ERP 핵심 도메인 타입 초안 추가
- `.env.example`을 NANO ERP 서버 설정 기준으로 정리
- `AGENTS.md`, `CODEX_PROMPT.md`, `README.md`를 `docs/` 폴더로 이동
- Node 내장 `node:sqlite` 기반 DB 연결 추가
- 사용자, 캘린더 이벤트, 투두 SQLite 테이블 마이그레이션 추가
- 사용자, 캘린더 이벤트, 투두 저장소 클래스 추가
- `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id/completion` API 추가
- `GET /api/calendar/events`, `POST /api/calendar/events` API 추가
- 개발 단계 임시 사용자 식별 방식으로 `x-user-id` 헤더 사용
- Zod 요청 검증 실패 시 400 응답 처리 추가
- 로컬 SQLite 파일이 Git에 포함되지 않도록 `.gitignore` 업데이트
- Google OAuth 인가 URL 생성 API `GET /auth/google/url` 추가
- 연락처 SQLite 테이블과 저장소 추가
- 문서 스캔 SQLite 테이블과 저장소 추가
- 오디오 보고서 SQLite 테이블과 저장소 추가
- `GET /api/contacts`, `POST /api/contacts`, `POST /api/contacts/business-card-scan` API 추가
- `GET /api/documents`, `POST /api/documents/scan` API 추가
- `GET /api/reports`, `POST /api/reports/audio` API 추가
- 연락처, 문서, 보고서 API 저장/조회 스모크 테스트 완료
- `@fastify/multipart`, `@fastify/static` 추가
- 로컬 파일 저장소 `src/storage/file-storage.ts` 추가
- 명함, 문서, 오디오 multipart 업로드 API 추가
- Google OAuth 콜백 토큰 교환 및 사용자 저장 흐름 추가
- 정적 MVP 대시보드 `public/index.html`, `public/styles.css`, `public/app.js` 추가
- 서버에서 정적 대시보드 서빙 연결
- HTML 200 응답과 문서 업로드 저장/조회 스모크 테스트 완료
- 투두 상세 조회, 수정, 완료 토글, 삭제 API 보강
- 캘린더 이벤트 상세 조회, 수정, 삭제 API 보강
- 연락처 상세 조회, 수정, 삭제 API 보강
- 문서 스캔 상세 조회, 수정, 삭제 API 보강
- 오디오 보고서 상세 조회, 수정, 삭제 API 보강
- 대시보드 목록에 완료/삭제 액션 추가
- CRUD 수정/삭제 스모크 테스트 완료

### 완료

- TypeScript 기본 프로젝트 설정 추가
- `tsconfig.json` 생성
- `src/index.ts` 엔트리포인트 생성
- NANO ERP 기준 개발 문서 세트 생성
- README를 NANO ERP 기준으로 정리
- 목표 폴더 구조 생성

### 진행 중

- 1차 MVP 작업 순서 수립

### 다음 작업

1. 배포 환경 변수와 운영 실행 가이드 정리
2. 외부 Vision API 및 Speech-to-Text API 실제 키 연동 지원

