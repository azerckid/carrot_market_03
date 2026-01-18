# 문서 관리 계획 (Document Management Plan)

## 1. 개요
이 문서는 프로젝트의 문서화 체계, 폴더 구조, 작성 규칙 및 관리 가이드라인을 정의합니다. 모든 팀원과 AI 에이전트는 이 규칙을 준수하여 프로젝트 문서를 일관성 있게 유지해야 합니다.

## 2. 문서 폴더 구조 (`docs/`)

프로젝트의 모든 기술 문서는 `docs/` 디렉토리 하위에 위치하며, 다음의 계층 구조를 따릅니다. Root 디렉토리에는 개별 `.md` 파일을 두지 않는 것을 원칙으로 합니다.

### 📂 `docs/core/` (핵심 토대)
- **Role**: 시스템 전반에 적용되는 핵심 규칙, 아키텍처 정의, 공통 데이터 구조 등을 관리합니다.
- **Contents**:
  - `DOCUMENT_MANAGEMENT_PLAN.md` (본 문서)
  - `SYSTEM_ARCHITECTURE.md` (시스템 아키텍처 개요)
  - `DB_SCHEMA.md` (데이터베이스 스키마 설명)
  - `UI_DESIGN_SYSTEM.md` (공통 UI/UX 디자인 가이드)

### 📂 `docs/features/` (기능 명세)
- **Role**: 개별 기능(Feature) 단위의 기획, 요구사항, 구현 상세 계획을 관리합니다.
- **Contents**:
  - `chat-system.md` (채팅 기능)
  - `community-board.md` (동네생활 게시판)
  - `product-management.md` (상품 등록/수정)
  - `profile-review-system.md` (프로필 및 리뷰)
  - `authentication.md` (로그인/회원가입 - *예정*)

### 📂 `docs/guides/` (개발 가이드)
- **Role**: 개발자를 위한 튜토리얼, 트러블슈팅 가이드, 워크플로우 설명서를 관리합니다.
- **Contents**:
  - `community-implementation-guide.md` (구현 단계별 가이드)
  - `deployment-guide.md` (배포 가이드 - *예정*)
  - `setup-guide.md` (환경 설정 가이드 - *예정*)

### 📂 `docs/reports/` (보고서 및 기록)
- **Role**: 테스트 결과 보고서, 마일스톤 완료 보고서, 성능 분석 레포트 등 시점이 고정된 기록물을 관리합니다.
- **Contents**:
  - `phase5-product-edit-test.md` (상품 수정 기능 테스트 리포트)

### 📂 `docs/archive/` (아카이브)
- **Role**: 더 이상 유효하지 않거나 폐기된 계획, 구버전 문서들을 보관합니다. 삭제 대신 이곳으로 이동시켜 히스토리를 보존합니다.

## 3. 문서 작성 이름 규칙 (Naming Convention)

1.  **언어**: 파일명은 **영문 소문자**를 사용합니다.
2.  **구분자**: 단어 사이에는 **하이픈(`-`)**을 사용합니다. 케밥 케이스(kebab-case).
3.  **명확성**: 약어 사용을 지양하고, 내용이 명확히 드러나도록 작성합니다.
    - Bad: `chat.md`, `impl-plan.md`
    - Good: `chat-system-architecture.md`, `implementation-plan-v1.md`

## 4. 문서 관리 및 업데이트 수칙

1.  **[Strict Document Integrity Rule]**: 기존 문서를 수정할 때는 내용을 전면 덮어쓰기(Overwrite) 하지 말고, 기존 맥락을 유지하면서 증분(Incremental) 업데이트해야 합니다.
2.  **동기화**: 코드 변경 사항이 발생하면, 관련된 문서(`docs/features/`)를 반드시 최신 상태로 업데이트해야 합니다. "구현 후 문서 업데이트" 원칙을 준수합니다.
3.  **참조**: 다른 문서를 참조할 때는 상대 경로 링크를 사용하여 연결성을 강화합니다. (예: `[참고 문서](../core/SYSTEM_ARCHITECTURE.md)`)

## 5. 승인 및 검토
모든 주요 기획 문서(`core/`, `features/`)의 생성 및 주요 변경은 반드시 PM(User)의 승인을 거쳐야 합니다.
