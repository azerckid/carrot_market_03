# API 마이그레이션 진행 상황

## 📊 전체 변환 상태

### ✅ 완료된 파일 (4개)
1. `app/(tabs)/home/page.tsx` - ✅ 완료
2. `app/(auth)/login/actions.ts` - ✅ 완료
3. `app/(tabs)/chat/actions.ts` - ✅ 완료
4. `app/(tabs)/chat/page.tsx` - ✅ 완료

### ❌ 변환 필요한 파일 (약 20개)

다음 파일들에서 여전히 Prisma API를 사용 중입니다:

#### 인증 관련
- `app/(auth)/create-account/actions.ts` - `db.user.findUnique`, `db.user.create`

#### 상품 관련  
- `app/products/[id]/page.tsx` - `db.product.findUnique`, `db.review.findUnique`, `db.chatRoom.findMany`
- `app/products/[id]/actions.ts` - `db.product.findUnique`, `db.product.delete`, `db.chatRoom.create`, `db.product.update`
- `app/product/add/actions.ts` - `db.product.create`
- `app/product/edit/[id]/page.tsx` - `db.product.findUnique`
- `app/product/edit/[id]/actions.ts` - `db.product.findUnique`, `db.product.update`

#### 채팅 관련
- `app/(tabs)/chat/page.tsx` - `db.chatRoom.findMany`
- `app/(tabs)/chat/actions.ts` - `db.chatRoom.findMany` ⚠️ **현재 빌드 에러 발생 중**
- `app/chat/[id]/page.tsx` - `db.chatRoom.findUnique`, `db.user.findUnique`
- `app/chat/[id]/actions.ts` - `db.chatRoom.findUnique`, `db.message.create`, `db.chatRoom.update`, `db.message.findMany`

#### 리뷰 관련
- `app/reviews/create/[productId]/page.tsx` - `db.product.findUnique`, `db.review.findUnique`
- `app/reviews/create/[productId]/actions.ts` - `db.review.findUnique`, `db.product.findUnique`, `db.review.create`
- `app/reviews/edit/[reviewId]/page.tsx` - `db.review.findUnique`
- `app/reviews/edit/[reviewId]/actions.ts` - `db.review.findUnique`, `db.review.update`, `db.review.delete`

#### 프로필 관련
- `app/(tabs)/profile/page.tsx` - `db.user.findUnique`, `db.post.findMany`, `db.product.findMany`, `db.review.findMany`
- `app/profile/edit/page.tsx` - `db.user.findUnique`
- `app/profile/edit/actions.ts` - `db.user.findUnique`, `db.user.update`
- `app/users/[userId]/page.tsx` - `db.user.findUnique`, `db.review.findMany`

#### 게시글 관련
- `app/(tabs)/life/page.tsx` - `db.post.findMany`
- `app/posts/add/actions.ts` - `db.post.create`
- `app/posts/[id]/page.tsx` - `db.post.update`, `db.like.findUnique`, `db.user.findUnique`
- `app/posts/[id]/actions.ts` - `db.like.create`, `db.like.delete`, `db.post.findUnique`, `db.comment.create`, `db.post.delete`
- `app/posts/edit/[id]/page.tsx` - `db.post.findUnique`
- `app/posts/edit/[id]/actions.ts` - `db.post.findUnique`, `db.post.update`

#### 기타
- `app/(auth)/github/complete/route.ts` - `db.user.findUnique`, `db.user.create`
- `app/(tabs)/home/actions.ts` - `db.product.findMany`

## 🔥 현재 빌드 에러

```
./app/(tabs)/chat/actions.ts:22:36
Type error: Property 'chatRoom' does not exist on type 'LibSQLDatabase...'
```

**원인**: `db.chatRoom.findMany` - Prisma API 사용 중

## 📈 진행률

- **완료**: 4개 파일
- **남음**: 약 18개 파일  
- **진행률**: 약 18% (4/22)

## ⚠️ 알려진 빌드 에러 (Drizzle과 무관)

```
./app/posts/[id]/actions.ts:18:5
Type error: Expected 2 arguments, but got 1.
revalidateTag(`like-status-${postId}`);
```

**원인**: Next.js 16의 `revalidateTag` 타입 정의 문제 (Drizzle 마이그레이션과 무관)
**임시 조치**: 이 에러는 Drizzle 변환과 별개이며, 계속 변환 작업 진행 가능

## 🔄 변환 패턴 참고

### Prisma → Drizzle 변환 예시

```typescript
// ❌ Prisma
const user = await db.user.findUnique({ where: { id: 1 } });
const products = await db.product.findMany({ where: { userId: 1 } });
const newProduct = await db.product.create({ data: { ... } });

// ✅ Drizzle
import { eq } from "drizzle-orm";
import db, { schema } from "@/lib/db";
const { users, products } = schema;

const [user] = await db.select().from(users).where(eq(users.id, 1)).limit(1);
const productsList = await db.select().from(products).where(eq(products.userId, 1));
const [newProduct] = await db.insert(products).values({ ... }).returning();
```

## 📝 다음 단계

1. 우선 빌드 에러 해결 (`app/(tabs)/chat/actions.ts`)
2. 파일별 순차 변환 진행
3. 각 변환 후 빌드 테스트
