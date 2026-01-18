# 루트 디렉토리 미사용 파일 분석 보고서

## 📋 분석 개요

**분석 일시**: 2024년  
**분석 목적**: 루트 디렉토리 정리 및 사용하지 않는 파일 제거

---

## ❌ 사용하지 않는 파일 목록

### 1. `proxy.ts`
- **이유**: Next.js는 `middleware.ts` 또는 `middleware.js` 파일만 인식하는데, `proxy.ts`는 참조되지 않음
- **상태**: 미사용
- **조치**: 삭제 권장

### 2. `prisma.config.ts`
- **이유**: 현재 Drizzle ORM을 사용 중이며, Prisma는 더 이상 사용하지 않음
- **상태**: 미사용 (다만 `package.json`에 `@prisma/config` 패키지는 남아있음)
- **조치**: 삭제 권장 (Prisma 완전 제거 시)

### 3. `migrate-turso.sh`
- **이유**: 코드베이스에서 참조되지 않음
- **상태**: 미사용
- **조치**: 삭제 또는 `scripts/` 디렉토리로 이동 고려

### 4. `update_commit_dates.py`
- **이유**: 일회성 Git 스크립트로, 이미 `.gitignore`에 포함됨
- **상태**: 미사용 (일회성 작업용)
- **조치**: 삭제 권장 (또는 `scripts/` 디렉토리로 이동)

### 5. `dev.db`
- **이유**: 현재 Turso 데이터베이스를 사용 중이며, 로컬 SQLite 파일 불필요
- **상태**: 미사용 (`.gitignore`에 포함되어 Git에 커밋되지 않음)
- **조치**: 삭제 권장 (로컬 개발용으로 필요하다면 유지 가능)

---

## ❓ 확인 필요한 파일

### 1. `seed-product.ts`
- **용도**: 개발용 시드 데이터 생성 스크립트
- **상태**: `DATABASE_URL` 환경 변수가 없을 때 `dev.db`를 fallback으로 사용
- **조치**: 
  - 개발 환경에서 시드 데이터가 필요하다면 유지
  - Turso 사용에 맞게 수정 필요 (현재 `dev.db` 참조)
  - 또는 `scripts/` 디렉토리로 이동 권장

---

## ✅ 사용 중인 파일 (정상)

### 스크립트 파일
- `migrate-to-cloudinary.ts` - ✅ `package.json`의 `migrate:cloudinary` 스크립트에서 사용

### 설정 파일
- `drizzle.config.ts` - ✅ Drizzle Kit 설정 파일
- `next.config.ts` - ✅ Next.js 설정 파일
- `tsconfig.json` - ✅ TypeScript 설정 파일
- `eslint.config.mjs` - ✅ ESLint 설정 파일
- `postcss.config.mjs` - ✅ PostCSS 설정 파일
- `package.json` - ✅ 프로젝트 메타데이터 및 의존성

### 문서 파일
- `AGENTS.md` - ✅ AI 에이전트 가이드
- `README.md` - ✅ 프로젝트 README

### 기타
- `next-env.d.ts` - ✅ Next.js 타입 정의 (자동 생성)
- `tsconfig.tsbuildinfo` - ✅ TypeScript 빌드 정보 캐시

---

## 📊 정리 권장사항

### 즉시 삭제 가능
1. ✅ `proxy.ts`
2. ✅ `update_commit_dates.py` (이미 `.gitignore`에 포함)

### 조건부 삭제
1. ⚠️ `prisma.config.ts` - Prisma 완전 제거 시 삭제
2. ⚠️ `dev.db` - 로컬 개발 환경 정리 시 삭제

### 이동 권장
1. 📁 `migrate-turso.sh` → `scripts/` 디렉토리로 이동
2. 📁 `seed-product.ts` → `scripts/` 디렉토리로 이동 (또는 수정 후 유지)

---

## 🔍 참고사항

### Prisma 관련 파일
현재 프로젝트는 Drizzle ORM으로 마이그레이션되었지만, `prisma/` 디렉토리와 일부 Prisma 패키지가 남아있습니다:
- `prisma/schema.prisma` - 스키마 참조용으로 유지 가능
- `prisma/migrations/` - 히스토리 보존용으로 유지 가능
- `@prisma/client`, `@prisma/config` 등 - 필요시 점진적 제거

### `.gitignore` 확인
- `*.db` 파일들은 이미 `.gitignore`에 포함되어 Git에 커밋되지 않음
- `update_commit_dates.py`도 `.gitignore`에 포함됨

---

## ✅ 결론

**즉시 삭제 가능한 파일**: 2개 (`proxy.ts`, `update_commit_dates.py`)  
**조건부 삭제**: 2개 (`prisma.config.ts`, `dev.db`)  
**이동 권장**: 2개 (`migrate-turso.sh`, `seed-product.ts`)
