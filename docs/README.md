# NANO ERP

NANO ERP는 소규모 업무 관리를 위한 TypeScript 기반 ERP 프로젝트입니다.

## 핵심 기능

1. 구글 로그인
2. 캘린더 / 투두리스트 관리
3. 명함 스캔 후 연락처 업데이트
4. 문서 사진 촬영 후 스캔본 저장
5. 녹음파일 업로드 후 텍스트 변환 및 보고서 리스트 관리

## 개발 환경

- Node.js 22 이상
- npm 11 이상
- TypeScript

## 시작하기

```bash
npm install
npm run typecheck
npm run build
```

빌드 후 실행:

```bash
npm start
```

## 문서

- `docs/AGENTS.md`: 개발 원칙
- `docs/CODEX_PROMPT.md`: Codex 작업 지시문
- `docs/01_overall_plan.md`: 전체 기획서
- `docs/02_design_plan.md`: 디자인 기획서
- `docs/03_functional_plan.md`: 기능 기획서
- `docs/04_technical_architecture.md`: 기술 구조 및 서버 설계
- `docs/05_folder_structure.md`: 폴더 구조 문서
- `docs/progress.md`: 진행 기록

## 스크립트

- `npm run build`: TypeScript 빌드
- `npm run typecheck`: 타입 검사
- `npm run start`: 빌드 결과 실행
- `npm run format`: 전체 파일 포맷
- `npm run format:check`: 포맷 상태 확인
