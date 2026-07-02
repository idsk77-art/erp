# 04. 기술 구조 및 서버 설계

## 현재 상태

- TypeScript 기반 Node.js 프로젝트
- 빌드 도구: `tsc`
- 패키지 매니저: npm

## 1차 기술 선택

- 서버 프레임워크: Fastify
- 환경 변수 검증: Zod
- 환경 변수 로딩: dotenv
- CORS 처리: `@fastify/cors`
- 파일 업로드: `@fastify/multipart`
- 정적 대시보드 서빙: `@fastify/static`
- 초기 데이터베이스 방향: SQLite
- SQLite 선택 이유: 로컬 개발과 MVP 검증 속도를 우선하기 위해 파일 기반 DB로 시작한다.
- 확장 방향: 배포와 동시 사용 규모가 커지면 PostgreSQL로 이전할 수 있도록 저장소 계층을 분리한다.
- SQLite 구현: Node.js 내장 `node:sqlite`의 `DatabaseSync`를 사용한다.
- 로컬 DB 기본 경로: `./data/nano-erp.sqlite`
- Google OAuth 1차 구현 방향: `/auth/google/url`에서 인가 URL을 생성하고, 실제 콜백 토큰 교환은 OAuth 설정 확정 후 연결한다.
- OCR/STT 1차 구현 방향: 외부 처리 전 단계로 요청 메타데이터와 처리 상태를 먼저 DB에 저장한다.
- 파일 업로드 기본 경로: `./uploads`

## 권장 목표 구조

1차 구현은 TypeScript 기반 서버와 웹 클라이언트를 한 저장소에서 관리하는 방식으로 시작합니다.

## 서버 모듈

- `auth`: Google OAuth 로그인과 세션 관리
- `calendar`: 일정 관리
- `todos`: 할 일 관리
- `contacts`: 연락처 관리
- `scans`: 명함 및 문서 스캔 파일 관리
- `reports`: 녹음파일, 텍스트 변환, 보고서 관리
- `storage`: 업로드 파일 저장소 추상화
- `ocr`: 이미지 OCR 처리 추상화
- `speech`: 음성 텍스트 변환 추상화

## 데이터 저장소

초기 개발 단계에서는 SQLite 또는 PostgreSQL 중 하나를 선택합니다.

- 로컬 개발과 빠른 시작이 중요하면 SQLite
- 배포와 확장성을 우선하면 PostgreSQL

## 외부 연동 후보

- 인증: Google OAuth
- OCR: Google Cloud Vision API 또는 대체 OCR 엔진
- Speech-to-text: OpenAI API, Google Speech-to-Text, 또는 대체 엔진
- 파일 저장: 로컬 파일 시스템으로 시작 후 S3 호환 스토리지로 확장 가능

## 보안 원칙

- OAuth client secret, API key, storage credential은 `.env`에 둔다.
- 업로드 파일은 사용자 소유권을 검증한 뒤 접근시킨다.
- OCR 및 음성 변환 전 원본 파일 형식과 크기를 제한한다.
- 보고서와 연락처는 사용자별로 격리한다.

## API 설계 초안

- `POST /auth/google`
- `GET /me`
- `GET /calendar/events`
- `POST /calendar/events`
- `PATCH /calendar/events/:id`
- `DELETE /calendar/events/:id`
- `GET /todos`
- `POST /todos`
- `PATCH /todos/:id/completion`
- `PATCH /todos/:id`
- `DELETE /todos/:id`
- `GET /contacts`
- `POST /contacts`
- `PATCH /contacts/:id`
- `POST /contacts/business-card-scan`
- `GET /documents`
- `POST /documents/scan`
- `GET /reports`
- `POST /reports/audio`
- `GET /reports/:id`

## 현재 구현된 API

- `GET /health`
- `GET /auth/google/url`
- `GET /api/todos`
- `POST /api/todos`
- `GET /api/todos/:id`
- `PATCH /api/todos/:id`
- `PATCH /api/todos/:id/completion`
- `DELETE /api/todos/:id`
- `GET /api/calendar/events`
- `POST /api/calendar/events`
- `GET /api/calendar/events/:id`
- `PATCH /api/calendar/events/:id`
- `DELETE /api/calendar/events/:id`
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/:id`
- `PATCH /api/contacts/:id`
- `DELETE /api/contacts/:id`
- `POST /api/contacts/business-card-scan`
- `GET /api/documents`
- `POST /api/documents/scan`
- `GET /api/documents/:id`
- `PATCH /api/documents/:id`
- `DELETE /api/documents/:id`
- `GET /api/reports`
- `POST /api/reports/audio`
- `GET /api/reports/:id`
- `PATCH /api/reports/:id`
- `DELETE /api/reports/:id`
- `POST /api/uploads/business-card`
- `POST /api/uploads/document`
- `POST /api/uploads/audio`
