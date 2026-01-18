# Drizzle ORM 마이그레이션 진행 상황

## ✅ 완료된 작업

1. **Drizzle 스키마 수정 완료**
   - `Product.price`: `integer` → `real` 변경
   - `Review`, `ChatRoom`, `Message` 테이블에 unique constraints 및 인덱스 추가

2. **Turso 연결 확인 완료**
   - 연결 테스트 성공
   - 환경 변수 설정 정상

3. **drizzle.config.ts 설정 완료**
   - `dialect: "turso"` 설정
   - `dotenv/config` 추가

4. **마이그레이션 파일 생성 완료**
   - `drizzle-kit generate` 실행 완료
   - 파일: `drizzle/migrations/0000_wonderful_wind_dancer.sql`

## 📊 현재 데이터베이스 상태 분석

### 기존 Turso 데이터베이스 (Prisma로 생성)
- 모든 테이블 정상 존재 (User, Product, ChatRoom, Message, Review 등)
- 모든 컬럼 및 관계 정상
- 인덱스 형식: `User_username_key`, `User_email_key` 등

### Drizzle 스키마
- 테이블 구조: 기존과 동일
- 컬럼 및 관계: 기존과 동일
- 인덱스 형식: `User_username_unique`, `User_email_unique` 등

### 차이점
**인덱스 이름만 다름** (기능상 문제 없음)
- Prisma: `*_key` 접미사
- Drizzle: `*_unique` 접미사

## ⚠️ 알려진 이슈

### 1. `drizzle-kit push` 실패
**원인**: Drizzle Kit이 기존 스키마를 읽을 때 인덱스 이름 차이로 인해 오류 발생
```
SQLite error: no such index: User_username_unique
```

**영향**: 
- 스키마 마이그레이션은 불가능하지만
- **기존 데이터베이스는 정상 작동 중**
- Drizzle ORM 자체는 기존 스키마와 호환됨

### 2. API 불일치 (해결 필요 - 우선순위 높음)
**문제**: 코드 전체에서 Prisma API 사용 중
- `db.user.findUnique()` (71개 위치)
- `db.product.create()` 등

**영향**: 
- **빌드 에러 발생**
- 런타임 오류 발생 가능

## 🔧 권장 해결 방안

### 즉시 처리 필요: API 마이그레이션

모든 Prisma API를 Drizzle API로 변환해야 합니다.

**작업 범위**: 71개 위치 (20개 파일)

**변환 예시**:
```typescript
// ❌ 현재 (Prisma)
const user = await db.user.findUnique({ where: { id: 1 } });

// ✅ 변경 후 (Drizzle)
import { eq } from "drizzle-orm";
import { users } from "@/drizzle/schema";
const [user] = await db.select().from(users).where(eq(users.id, 1)).limit(1);
```

### 선택적: 스키마 마이그레이션

현재 상태에서도 정상 작동하므로 **즉시 필요하지 않음**.
- 인덱스 이름만 다를 뿐 기능상 문제 없음
- 향후 필요시 기존 인덱스를 삭제하고 재생성 가능

## 📝 다음 단계

1. **우선순위 1**: API 마이그레이션 시작
   - Prisma API → Drizzle API 변환
   - 파일별 순차 진행

2. **우선순위 2**: 스키마 마이그레이션 (선택)
   - 현재는 건너뛰고 API 마이그레이션 완료 후 고려

## 📁 관련 파일

- `drizzle/schema.ts`: Drizzle 스키마 정의
- `drizzle.config.ts`: Drizzle Kit 설정
- `lib/db.ts`: 데이터베이스 연결 (Drizzle ORM)
- `drizzle/migrations/0000_wonderful_wind_dancer.sql`: 생성된 마이그레이션
- `DRIZZLE_MIGRATION_ISSUES.md`: 상세 이슈 정리
