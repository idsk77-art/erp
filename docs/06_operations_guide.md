# 06. 운영 및 배포 가이드 (Operations & Deployment Guide)

이 문서는 NANO ERP 시스템의 개발 환경 설정, 배포 환경 변수 설정, 서비스 운영 및 실행 방법을 안내합니다.

## 1. 시스템 구성 요약
- **런타임**: Node.js v22 이상
- **프레임워크**: Fastify
- **데이터베이스**: SQLite (파일 기반, 기본값 `./data/nano-erp.sqlite`)
- **정적 에셋**: `/public` 폴더 (대시보드 프론트엔드)
- **업로드 경로**: 기본값 `./uploads`

---

## 2. 환경 변수 설정 (`.env`)

로컬 개발 또는 운영 환경 실행 시 루트 폴더에 `.env` 파일을 생성하고 아래 값을 설정합니다.

```ini
# --------------------------------------------------
# Application Settings
# --------------------------------------------------
NODE_ENV=production          # 실행 환경 (development, test, production)
HOST=0.0.0.0                 # 수신 바인딩 주소
PORT=3000                    # 포트 번호
APP_URL=http://localhost:3000 # 프론트엔드 접근용 앱 base URL

# --------------------------------------------------
# Database & Storage
# --------------------------------------------------
DATABASE_URL=./data/nano-erp.sqlite
UPLOAD_DIR=./uploads

# --------------------------------------------------
# Authentication (Google OAuth & JWT)
# --------------------------------------------------
# JWT_SECRET: 비워두면 안전한 기본값이 사용되나, 운영 환경에서는 임의의 긴 문자열을 명시적으로 기입해야 합니다.
JWT_SECRET=your-super-secure-random-jwt-secret-key-goes-here

# 구글 API 콘솔에서 발급한 OAuth 클라이언트 정보
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# --------------------------------------------------
# AI Integrations (Gemini API)
# --------------------------------------------------
# 명함 OCR 및 음성 녹취 STT에 실시간 Google Gemini API를 연동하려면 아래 값을 설정합니다.
GEMINI_API_KEY=your-gemini-api-key
OCR_PROVIDER=gemini
SPEECH_TO_TEXT_PROVIDER=gemini
```

---

## 3. 서버 실행 가이드

### 3.1 의존성 설치 및 빌드
```bash
# 의존성 모듈 설치
npm install

# TypeScript 코드 빌드 (dist/ 폴더 생성)
npm run build
```

### 3.2 개발 서버 기동 (tsx 감시 모드)
```bash
npm run dev
```

### 3.3 운영 실행 (컴파일된 JS 실행)
운영 환경에서는 빌드 프로세스를 실행한 후 Node.js의 최적화 모드로 구동합니다.
```bash
# 빌드 수행 후 시작
npm run build
npm run start
```

---

## 4. 백그라운드 AI 연동 동작원리

### 4.1 명함 OCR 연동
- 업로드된 이미지를 `base64` 인코딩 후 Google Gemini API (`gemini-2.5-flash`)로 전송합니다.
- Gemini 모델은 이미지 분석 후 JSON 형식의 연락처 필드(`이름`, `회사명`, `직책`, `전화번호`, `이메일`)를 구조화하여 추출합니다.
- 추출 결과를 클라이언트에서 최종 검토 및 수정한 뒤 연락처 저장이 완료됩니다.

### 4.2 녹음본 STT 및 요약 연동
- 오디오 업로드 즉시 DB에는 `status: 'processing'` 상태로 등록되며 클라이언트는 3초 단위 자동 폴링을 실행합니다.
- 음성 파일은 비동기적으로 Gemini API를 통해 전송되어 회의록 텍스트 변환 및 요약본 생성을 수행합니다.
- 백그라운드 변환이 성공적으로 완료되면 상태가 `done`으로 업데이트되며, 요약본과 텍스트가 대시보드 화면에 노출됩니다.
