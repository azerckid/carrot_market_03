# Drizzle ORM 마이그레이션 이슈 정리

## 📋 확인된 문제점

### ✅ 1. 스키마 불일치 (수정 완료)

다음 항목들을 Prisma 스키마와 일치하도록 수정했습니다:

- **Product.price**: `integer` → `real` (Prisma `Float`와 매칭)
- **Review 테이블**: `@@unique([reviewerId, productId])` 추가
- **ChatRoom 테이블**: 
  - `@@unique([buyerId, sellerId, productId])` 추가
  - `@@index([buyerId])`, `@@index([sellerId])`, `@@index([productId])` 추가
- **Message 테이블**: `@@index([chatRoomId, created_at])` 추가
- **Review 테이블**: `@@index([revieweeId])`, `@@index([productId])` 추가

### ❌ 2. API 불일치 (해결 필요)

**심각한 문제**: 코드 전체에서 여전히 **Prisma API**를 사용하고 있지만, `lib/db.ts`는 **Drizzle ORM** 인스턴스를 export하고 있습니다.

#### 영향을 받는 파일들 (71개 위치)

- `app/(auth)/create-account/actions.ts`
- `app/products/[id]/page.tsx`
- `app/users/[userId]/page.tsx`
- `app/chat/[id]/page.tsx`
- `app/(tabs)/profile/page.tsx`
- `app/profile/edit/page.tsx`, `app/profile/edit/actions.ts`
- `app/reviews/edit/[reviewId]/page.tsx`, `app/reviews/edit/[reviewId]/actions.ts`
- `app/products/[id]/actions.ts`
- `app/reviews/create/[productId]/actions.ts`, `app/reviews/create/[productId]/page.tsx`
- `app/(tabs)/chat/page.tsx`, `app/(tabs)/chat/actions.ts`
- `app/chat/[id]/actions.ts`
- `app/posts/[id]/page.tsx`, `app/posts/[id]/actions.ts`
- `app/posts/edit/[id]/actions.ts`, `app/posts/edit/[id]/page.tsx`
- `app/(tabs)/life/page.tsx`
- `app/posts/add/actions.ts`
- `app/product/add/actions.ts`
- `app/product/edit/[id]/page.tsx`, `app/product/edit/[id]/actions.ts`
- `app/(auth)/github/complete/route.ts`
- `app/(tabs)/home/page.tsx`, `app/(tabs)/home/actions.ts`
- `app/(auth)/login/actions.ts`

#### 사용 중인 Prisma API 패턴

```typescript
// ❌ 현재 코드 (작동하지 않음)
const user = await db.user.findUnique({ where: { id: 1 } });
const product = await db.product.create({ data: { ... } });
const reviews = await db.review.findMany({ where: { ... } });
```

#### 필요한 Drizzle API 패턴

```typescript
// ✅ Drizzle 방식
import { eq, and, desc } from "drizzle-orm";
import db, { users, products, reviews } from "@/lib/db";

const user = await db.select().from(users).where(eq(users.id, 1)).limit(1);
const [newProduct] = await db.insert(products).values({ ... }).returning();
const allReviews = await db.select().from(reviews).where(eq(reviews.revieweeId, userId));
```

### ⚠️ 3. Turso 연결 설정

**현재 상태**: `lib/db.ts`와 `drizzle.config.ts` 설정은 올바릅니다.

필요한 환경 변수:
- `TURSO_DATABASE_URL`: Turso 데이터베이스 URL
- `TURSO_AUTH_TOKEN`: Turso 인증 토큰

연결 테스트:
```bash
tsx scripts/test-turso.ts
```

## 🔧 해결 방법

### 옵션 1: 전체 코드베이스를 Drizzle API로 마이그레이션 (권장)

모든 Prisma API 호출을 Drizzle API로 변환:
- `db.user.findUnique()` → `db.select().from(users).where(eq(users.id, id))`
- `db.product.create()` → `db.insert(products).values(...).returning()`
- `db.review.findMany()` → `db.select().from(reviews).where(...)`

**작업 범위**: 약 71개 위치

### 옵션 2: 일시적으로 Prisma Client를 유지

`lib/db.ts`에서 Prisma Client를 export하여 기존 코드가 작동하도록 유지:
```typescript
// 임시 해결책
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
```

단, 이 경우 Drizzle 마이그레이션 목적이 달성되지 않습니다.

## 📝 진행 상황

1. ✅ **완료**: Drizzle 스키마를 Prisma 스키마와 일치하도록 수정
2. ✅ **완료**: Turso 연결 테스트 성공
3. ✅ **완료**: `drizzle.config.ts` 설정 수정 (`dialect: "turso"`로 변경)
4. ⚠️ **문제**: `drizzle-kit push` 실행 시 기존 Prisma 스키마와 충돌

### 현재 문제: 인덱스 이름 불일치

**증상**: `drizzle-kit push` 실행 시 다음 오류 발생
```
SQLite error: no such index: User_username_unique
```

**원인**: 
- Prisma는 unique constraint에 대해 `User_username_key` 형식 사용
- Drizzle Kit은 스키마 pull 과정에서 `User_username_unique` 형식을 기대
- 기존 Turso 데이터베이스는 Prisma로 생성된 스키마를 가지고 있음

**해결 방안**:

#### 옵션 A: `generate` + 수동 마이그레이션 (권장)
```bash
npx drizzle-kit generate
# 생성된 마이그레이션 파일을 확인 후
# 필요한 변경사항만 수동으로 적용
```

#### 옵션 B: 기존 인덱스 이름 변경
Turso 데이터베이스의 인덱스 이름을 Drizzle 형식에 맞게 변경 (복잡, 위험)

#### 옵션 C: Drizzle 스키마에 Prisma 인덱스 이름 매핑
스키마 파일에서 명시적으로 인덱스 이름 지정

5. ⏳ **대기**: API 마이그레이션 전략 결정 (옵션 1 vs 옵션 2)

## 🔗 참고 자료

- [Drizzle ORM SQLite 문서](https://orm.drizzle.team/docs/get-started-sqlite)
- [Drizzle 쿼리 빌더](https://orm.drizzle.team/docs/select)
- [Turso 연결 가이드](https://docs.turso.tech/sdk/libsql/client-access/javascript-typescript-sdk)
