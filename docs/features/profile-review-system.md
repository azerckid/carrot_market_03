# 프로필 및 리뷰 시스템 구현 계획

## 📋 개요

이 문서는 다음 기능들을 단계별로 구현하기 위한 상세 계획입니다:

1. **프로필 페이지 확장**: 구매한 상품, 판매한 상품 목록, 받은 리뷰 표시
2. **판매 완료 및 리뷰 시스템**: 판매 완료 버튼, 상호 리뷰 작성 기능
3. **프로필 수정 및 열람**: 본인 프로필 수정, 다른 사용자 프로필 열람

---

## 🎯 구현 목표

### 1. 프로필 페이지 확장
- 구매한 상품 목록 표시
- 판매한 상품 목록 표시 (판매중/판매완료 필터링)
- 받은 리뷰 목록 표시 (평균 별점, 리뷰 개수)

### 2. 판매 완료 및 리뷰 시스템
- 상품 상세 페이지에 "판매 완료" 버튼 추가
- 판매 완료 처리 및 상태 변경
- 판매 완료 후 리뷰 작성 페이지로 이동
- 구매자와 판매자가 서로 리뷰 작성
- 리뷰 작성/수정/삭제 기능

### 3. 프로필 수정 및 열람
- 본인 프로필 수정 페이지
- 다른 사용자 프로필 열람 페이지
- 프로필 접근 권한 관리

---

## 📝 단계별 구현 계획

### Step 1: 데이터베이스 스키마 확장

#### 📝 구현 내용

**목표**: 상품 상태 관리 및 리뷰 시스템을 위한 데이터베이스 스키마 확장

**파일 수정/생성**:
- `prisma/schema.prisma` - 스키마 수정

**구현 사항**:

1. **Product 모델 확장**
   ```prisma
   model Product {
     // ... 기존 필드
     status    String   @default("판매중") // "판매중", "판매완료", "예약중"
     soldTo    Int?     // 구매자 ID (판매 완료 시)
     soldAt    DateTime? // 판매 완료 시간
     soldToUser User?   @relation("PurchasedProducts", fields: [soldTo], references: [id])
     reviews   Review[] // 이 상품에 대한 리뷰들
   }
   ```

2. **Review 모델 생성**
   ```prisma
   model Review {
     id         Int       @id @default(autoincrement())
     rating     Int       // 1-5점
     content    String?   // 리뷰 텍스트 (선택사항)
     created_at DateTime  @default(now())
     updated_at DateTime  @updatedAt
     
     reviewer   User      @relation("ReviewerReviews", fields: [reviewerId], references: [id], onDelete: Cascade)
     reviewerId Int       // 리뷰 작성자 ID
     
     reviewee   User      @relation("RevieweeReviews", fields: [revieweeId], references: [id], onDelete: Cascade)
     revieweeId Int       // 리뷰 대상자 ID
     
     product    Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
     productId  Int       // 어떤 상품에 대한 리뷰인지
     
     @@unique([reviewerId, productId]) // 한 상품당 한 번만 리뷰 가능
     @@index([revieweeId]) // 리뷰 대상자로 검색 최적화
     @@index([productId]) // 상품별 리뷰 조회 최적화
   }
   ```

3. **User 모델 확장**
   ```prisma
   model User {
     // ... 기존 필드
     purchasedProducts Product[] @relation("PurchasedProducts") // 구매한 상품들
     reviewerReviews   Review[]  @relation("ReviewerReviews")   // 내가 작성한 리뷰들
     revieweeReviews   Review[]  @relation("RevieweeReviews")  // 나에게 작성된 리뷰들
   }
   ```

**마이그레이션**:
```bash
npx prisma migrate dev --name add_product_status_and_review_system
```

#### ✅ 테스트 체크리스트

- [ ] 스키마 파일 수정 완료
- [ ] 마이그레이션 실행 성공
- [ ] 데이터베이스에 새로운 필드와 테이블 생성 확인
- [ ] 기존 데이터에 영향 없음 확인

#### 💬 커밋 메시지

```
feat(db): 상품 상태 관리 및 리뷰 시스템을 위한 스키마 확장

- Product 모델에 status, soldTo, soldAt 필드 추가
- Review 모델 생성 (별점, 리뷰 내용, 작성자/대상자 관계)
- User 모델에 리뷰 관계 추가
- 한 상품당 한 번만 리뷰 가능하도록 unique 제약조건 추가
```

---

### Step 2: 프로필 페이지 - 판매한 상품 목록 표시

#### 📝 구현 내용

**목표**: 프로필 페이지에 판매한 상품 목록을 표시하고, 판매중/판매완료 필터링 기능 추가

**파일 수정/생성**:
- `app/(tabs)/profile/page.tsx` - 판매한 상품 목록 추가
- `components/product-list.tsx` (선택사항) - 재사용 가능한 상품 리스트 컴포넌트

**구현 사항**:

1. **판매한 상품 조회 함수**
   ```typescript
   async function getSoldProducts(userId: number) {
     const products = await db.product.findMany({
       where: { userId },
       orderBy: { created_at: "desc" },
       include: {
         _count: {
           select: { chatRooms: true }
         }
       }
     });
     return products;
   }
   ```

2. **프로필 페이지에 판매한 상품 섹션 추가**
   - 판매중/판매완료 탭 또는 필터 추가
   - 상품 카드 표시 (이미지, 제목, 가격, 상태)
   - 상품 클릭 시 상세 페이지로 이동

3. **상품 상태 표시**
   - "판매중" - 주황색 배지
   - "판매완료" - 회색 배지
   - "예약중" - 파란색 배지 (선택사항)

#### ✅ 테스트 체크리스트

- [ ] 프로필 페이지에 "판매한 상품" 섹션 표시
- [ ] 판매한 상품 목록이 올바르게 표시되는지 확인
- [ ] 상품 상태(판매중/판매완료)가 올바르게 표시되는지 확인
- [ ] 필터링 기능이 정상 작동하는지 확인 (판매중/판매완료)
- [ ] 상품 클릭 시 상세 페이지로 이동하는지 확인
- [ ] 판매한 상품이 없을 때 적절한 메시지 표시

#### 💬 커밋 메시지

```
feat(profile): 프로필 페이지에 판매한 상품 목록 표시 기능 추가

- 판매한 상품 조회 함수 구현
- 판매중/판매완료 필터링 기능 추가
- 상품 상태별 배지 표시 (판매중/판매완료)
- 상품 클릭 시 상세 페이지로 이동 기능
```

---

### Step 3: 프로필 페이지 - 구매한 상품 목록 표시

#### 📝 구현 내용

**목표**: 프로필 페이지에 구매한 상품 목록 표시

**파일 수정/생성**:
- `app/(tabs)/profile/page.tsx` - 구매한 상품 목록 추가

**구현 사항**:

1. **구매한 상품 조회 함수**
   ```typescript
   async function getPurchasedProducts(userId: number) {
     const products = await db.product.findMany({
       where: { soldTo: userId },
       orderBy: { soldAt: "desc" },
       include: {
         user: {
           select: {
             id: true,
             username: true,
             avatar: true
           }
         }
       }
     });
     return products;
   }
   ```

2. **프로필 페이지에 구매한 상품 섹션 추가**
   - 구매한 상품 카드 표시
   - 판매자 정보 표시
   - 구매 날짜 표시
   - 상품 클릭 시 상세 페이지로 이동

**주의사항**:
- 현재는 `soldTo` 필드가 없으므로, Step 1의 마이그레이션이 완료된 후에만 작동합니다.
- 초기에는 빈 목록이 표시될 수 있습니다.

#### ✅ 테스트 체크리스트

- [ ] 프로필 페이지에 "구매한 상품" 섹션 표시
- [ ] 구매한 상품 목록이 올바르게 표시되는지 확인
- [ ] 판매자 정보가 올바르게 표시되는지 확인
- [ ] 구매 날짜가 올바르게 표시되는지 확인
- [ ] 상품 클릭 시 상세 페이지로 이동하는지 확인
- [ ] 구매한 상품이 없을 때 적절한 메시지 표시

#### 💬 커밋 메시지

```
feat(profile): 프로필 페이지에 구매한 상품 목록 표시 기능 추가

- 구매한 상품 조회 함수 구현
- 판매자 정보 및 구매 날짜 표시
- 상품 클릭 시 상세 페이지로 이동 기능
```

---

### Step 4: 판매 완료 버튼 및 기능 구현

#### 📝 구현 내용

**목표**: 상품 상세 페이지에 "판매 완료" 버튼 추가 및 판매 완료 처리

**파일 수정/생성**:
- `app/products/[id]/page.tsx` - 판매 완료 버튼 추가
- `app/products/[id]/actions.ts` - `markAsSold` Server Action 추가

**구현 사항**:

1. **판매 완료 Server Action**
   ```typescript
   export async function markAsSold(productId: number, buyerId: number) {
     const session = await getSession();
     
     if (!session.id) {
       return { error: "로그인이 필요합니다." };
     }
     
     const product = await db.product.findUnique({
       where: { id: productId },
       select: { userId: true }
     });
     
     if (!product) {
       return { error: "상품을 찾을 수 없습니다." };
     }
     
     if (product.userId !== session.id) {
       return { error: "판매자만 판매 완료 처리할 수 있습니다." };
     }
     
     await db.product.update({
       where: { id: productId },
       data: {
         status: "판매완료",
         soldTo: buyerId,
         soldAt: new Date()
       }
     });
     
     revalidatePath(`/products/${productId}`);
     revalidatePath("/profile");
     
     return { success: true };
   }
   ```

2. **상품 상세 페이지에 판매 완료 버튼 추가**
   - 판매자만 볼 수 있도록 조건부 렌더링
   - 상품 상태가 "판매중"일 때만 표시
   - 채팅방이 있는 경우 구매자 선택 가능
   - 확인 모달 추가 (선택사항)

3. **구매자 선택 UI** (선택사항)
   - 채팅방 목록에서 구매자 선택
   - 또는 직접 구매자 ID 입력

#### ✅ 테스트 체크리스트

- [ ] 상품 상세 페이지에 "판매 완료" 버튼 표시 (판매자만)
- [ ] 비판매자가 접근 시 버튼이 보이지 않는지 확인
- [ ] 판매 완료 버튼 클릭 시 상품 상태가 "판매완료"로 변경되는지 확인
- [ ] 판매 완료 후 상품 상세 페이지가 업데이트되는지 확인
- [ ] 판매 완료 후 프로필 페이지가 업데이트되는지 확인
- [ ] 이미 판매 완료된 상품에는 버튼이 표시되지 않는지 확인

#### 💬 커밋 메시지

```
feat(product): 상품 판매 완료 기능 구현

- markAsSold Server Action 추가
- 상품 상세 페이지에 판매 완료 버튼 추가
- 판매자 권한 확인 및 구매자 정보 저장
- 판매 완료 후 상태 업데이트 및 캐시 무효화
```

---

### Step 5: 리뷰 작성 페이지 구현

#### 📝 구현 내용

**목표**: 판매 완료 후 구매자와 판매자가 서로 리뷰를 작성할 수 있는 페이지 생성

**파일 수정/생성**:
- `app/reviews/create/[productId]/page.tsx` - 리뷰 작성 페이지
- `app/reviews/create/[productId]/actions.ts` - `createReview` Server Action
- `components/review-form.tsx` - 리뷰 작성 폼 컴포넌트

**구현 사항**:

1. **리뷰 작성 Server Action**
   ```typescript
   export async function createReview(
     productId: number,
     revieweeId: number,
     rating: number,
     content?: string
   ) {
     const session = await getSession();
     
     if (!session.id) {
       return { error: "로그인이 필요합니다." };
     }
     
     // 이미 리뷰를 작성했는지 확인
     const existingReview = await db.review.findUnique({
       where: {
         reviewerId_productId: {
           reviewerId: session.id,
           productId
         }
       }
     });
     
     if (existingReview) {
       return { error: "이미 리뷰를 작성하셨습니다." };
     }
     
     // 상품 정보 확인
     const product = await db.product.findUnique({
       where: { id: productId }
     });
     
     if (!product) {
       return { error: "상품을 찾을 수 없습니다." };
     }
     
     // 권한 확인: 구매자 또는 판매자만 리뷰 작성 가능
     const canReview = 
       (product.userId === session.id && product.soldTo === revieweeId) ||
       (product.soldTo === session.id && product.userId === revieweeId);
     
     if (!canReview) {
       return { error: "리뷰 작성 권한이 없습니다." };
     }
     
     await db.review.create({
       data: {
         rating,
         content: content?.trim(),
         reviewerId: session.id,
         revieweeId,
         productId
       }
     });
     
     revalidatePath(`/products/${productId}`);
     revalidatePath(`/profile/${revieweeId}`);
     revalidatePath("/profile");
     
     return { success: true };
   }
   ```

2. **리뷰 작성 페이지**
   - 상품 정보 표시
   - 리뷰 대상자 정보 표시
   - 별점 선택 (1-5점)
   - 리뷰 내용 입력 (선택사항)
   - 제출 버튼

3. **판매 완료 후 리뷰 작성 페이지로 리다이렉트**
   - 판매 완료 시 리뷰 작성 페이지로 이동
   - 또는 별도 링크 제공

#### ✅ 테스트 체크리스트

- [ ] 리뷰 작성 페이지 접근 가능
- [ ] 상품 정보가 올바르게 표시되는지 확인
- [ ] 리뷰 대상자 정보가 올바르게 표시되는지 확인
- [ ] 별점 선택 기능이 정상 작동하는지 확인
- [ ] 리뷰 내용 입력이 정상 작동하는지 확인
- [ ] 리뷰 제출 시 데이터베이스에 저장되는지 확인
- [ ] 중복 리뷰 작성 방지 기능 확인
- [ ] 권한 없는 사용자 접근 차단 확인

#### 💬 커밋 메시지

```
feat(review): 리뷰 작성 페이지 및 기능 구현

- createReview Server Action 추가
- 리뷰 작성 페이지 및 폼 컴포넌트 생성
- 별점 선택 및 리뷰 내용 입력 기능
- 중복 리뷰 작성 방지 및 권한 확인
- 판매 완료 후 리뷰 작성 페이지로 리다이렉트
```

---

### Step 6: 프로필 페이지 - 받은 리뷰 목록 표시

#### 📝 구현 내용

**목표**: 프로필 페이지에 받은 리뷰 목록 및 평균 별점 표시

**파일 수정/생성**:
- `app/(tabs)/profile/page.tsx` - 받은 리뷰 섹션 추가
- `components/review-list.tsx` (선택사항) - 리뷰 리스트 컴포넌트

**구현 사항**:

1. **받은 리뷰 조회 함수**
   ```typescript
   async function getReceivedReviews(userId: number) {
     const reviews = await db.review.findMany({
       where: { revieweeId: userId },
       include: {
         reviewer: {
           select: {
             id: true,
             username: true,
             avatar: true
           }
         },
         product: {
           select: {
             id: true,
             title: true,
             photo: true
           }
         }
       },
       orderBy: { created_at: "desc" }
     });
     
     // 평균 별점 계산
     const avgRating = reviews.length > 0
       ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
       : 0;
     
     return { reviews, avgRating };
   }
   ```

2. **프로필 페이지에 받은 리뷰 섹션 추가**
   - 평균 별점 표시 (별 아이콘 사용)
   - 리뷰 개수 표시
   - 리뷰 목록 표시 (작성자, 별점, 내용, 작성일)
   - 상품 정보 링크

#### ✅ 테스트 체크리스트

- [ ] 프로필 페이지에 "받은 리뷰" 섹션 표시
- [ ] 평균 별점이 올바르게 계산되어 표시되는지 확인
- [ ] 리뷰 개수가 올바르게 표시되는지 확인
- [ ] 리뷰 목록이 올바르게 표시되는지 확인
- [ ] 리뷰 작성자 정보가 올바르게 표시되는지 확인
- [ ] 상품 정보 링크가 정상 작동하는지 확인
- [ ] 리뷰가 없을 때 적절한 메시지 표시

#### 💬 커밋 메시지

```
feat(profile): 프로필 페이지에 받은 리뷰 목록 표시 기능 추가

- 받은 리뷰 조회 함수 구현
- 평균 별점 계산 및 표시
- 리뷰 목록 표시 (작성자, 별점, 내용, 작성일)
- 상품 정보 링크 추가
```

---

### Step 7: 리뷰 수정 및 삭제 기능 구현

#### 📝 구현 내용

**목표**: 작성한 리뷰를 수정하거나 삭제할 수 있는 기능 추가

**파일 수정/생성**:
- `app/reviews/edit/[reviewId]/page.tsx` - 리뷰 수정 페이지
- `app/reviews/edit/[reviewId]/actions.ts` - `updateReview`, `deleteReview` Server Actions

**구현 사항**:

1. **리뷰 수정 Server Action**
   ```typescript
   export async function updateReview(
     reviewId: number,
     rating: number,
     content?: string
   ) {
     const session = await getSession();
     
     if (!session.id) {
       return { error: "로그인이 필요합니다." };
     }
     
     const review = await db.review.findUnique({
       where: { id: reviewId }
     });
     
     if (!review) {
       return { error: "리뷰를 찾을 수 없습니다." };
     }
     
     if (review.reviewerId !== session.id) {
       return { error: "수정 권한이 없습니다." };
     }
     
     await db.review.update({
       where: { id: reviewId },
       data: {
         rating,
         content: content?.trim()
       }
     });
     
     revalidatePath(`/products/${review.productId}`);
     revalidatePath(`/profile/${review.revieweeId}`);
     revalidatePath("/profile");
     
     return { success: true };
   }
   ```

2. **리뷰 삭제 Server Action**
   ```typescript
   export async function deleteReview(reviewId: number) {
     const session = await getSession();
     
     if (!session.id) {
       return { error: "로그인이 필요합니다." };
     }
     
     const review = await db.review.findUnique({
       where: { id: reviewId }
     });
     
     if (!review) {
       return { error: "리뷰를 찾을 수 없습니다." };
     }
     
     if (review.reviewerId !== session.id) {
       return { error: "삭제 권한이 없습니다." };
     }
     
     await db.review.delete({
       where: { id: reviewId }
     });
     
     revalidatePath(`/products/${review.productId}`);
     revalidatePath(`/profile/${review.revieweeId}`);
     revalidatePath("/profile");
     
     return { success: true };
   }
   ```

3. **리뷰 수정/삭제 UI**
   - 리뷰 목록에 수정/삭제 버튼 추가 (본인이 작성한 리뷰만)
   - 수정 페이지에서 기존 리뷰 내용 불러오기
   - 삭제 확인 모달 추가

#### ✅ 테스트 체크리스트

- [ ] 리뷰 수정 페이지 접근 가능
- [ ] 기존 리뷰 내용이 올바르게 불러와지는지 확인
- [ ] 리뷰 수정 시 데이터베이스에 업데이트되는지 확인
- [ ] 리뷰 삭제 시 데이터베이스에서 삭제되는지 확인
- [ ] 권한 없는 사용자 접근 차단 확인
- [ ] 수정/삭제 후 관련 페이지가 업데이트되는지 확인

#### 💬 커밋 메시지

```
feat(review): 리뷰 수정 및 삭제 기능 구현

- updateReview Server Action 추가
- deleteReview Server Action 추가
- 리뷰 수정 페이지 및 폼 컴포넌트 생성
- 리뷰 삭제 확인 모달 추가
- 권한 확인 및 캐시 무효화 처리
```

---

### Step 8: 프로필 수정 기능 구현

#### 📝 구현 내용

**목표**: 사용자가 본인의 프로필 정보를 수정할 수 있는 기능 추가

**파일 수정/생성**:
- `app/profile/edit/page.tsx` - 프로필 수정 페이지
- `app/profile/edit/actions.ts` - `updateProfile` Server Action
- `components/edit-profile-form.tsx` - 프로필 수정 폼 컴포넌트

**구현 사항**:

1. **프로필 수정 Server Action**
   ```typescript
   export async function updateProfile(formData: FormData) {
     const session = await getSession();
     
     if (!session.id) {
       return { error: "로그인이 필요합니다." };
     }
     
     const username = formData.get("username");
     const email = formData.get("email");
     const phone = formData.get("phone");
     const avatar = formData.get("avatar"); // 파일 업로드 처리 필요
     
     // 유효성 검사
     if (!username || typeof username !== "string") {
       return { error: "사용자명을 입력해주세요." };
     }
     
     // 중복 확인
     const existingUser = await db.user.findUnique({
       where: { username }
     });
     
     if (existingUser && existingUser.id !== session.id) {
       return { error: "이미 사용 중인 사용자명입니다." };
     }
     
     // 프로필 업데이트
     await db.user.update({
       where: { id: session.id },
       data: {
         username: username.trim(),
         email: email && typeof email === "string" ? email.trim() : null,
         phone: phone && typeof phone === "string" ? phone.trim() : null,
         // avatar 업로드 처리 (Cloudinary 사용)
       }
     });
     
     revalidatePath("/profile");
     redirect("/profile");
   }
   ```

2. **프로필 수정 페이지**
   - 현재 프로필 정보 불러오기
   - 사용자명, 이메일, 전화번호, 아바타 수정 폼
   - 제출 버튼

3. **프로필 페이지에 수정 버튼 추가**
   - 본인 프로필일 때만 "프로필 수정" 버튼 표시

#### ✅ 테스트 체크리스트

- [ ] 프로필 수정 페이지 접근 가능
- [ ] 현재 프로필 정보가 올바르게 불러와지는지 확인
- [ ] 사용자명 수정이 정상 작동하는지 확인
- [ ] 이메일 수정이 정상 작동하는지 확인
- [ ] 전화번호 수정이 정상 작동하는지 확인
- [ ] 아바타 이미지 업로드가 정상 작동하는지 확인
- [ ] 중복 사용자명 검증이 정상 작동하는지 확인
- [ ] 수정 후 프로필 페이지로 리다이렉트되는지 확인

#### 💬 커밋 메시지

```
feat(profile): 프로필 수정 기능 구현

- updateProfile Server Action 추가
- 프로필 수정 페이지 및 폼 컴포넌트 생성
- 사용자명, 이메일, 전화번호, 아바타 수정 기능
- 중복 사용자명 검증 및 권한 확인
- 프로필 페이지에 수정 버튼 추가
```

---

### Step 9: 다른 사용자 프로필 열람 기능 구현

#### 📝 구현 내용

**목표**: 다른 사용자의 프로필을 열람할 수 있는 페이지 생성

**파일 수정/생성**:
- `app/users/[userId]/page.tsx` - 다른 사용자 프로필 페이지
- `components/user-profile.tsx` (선택사항) - 재사용 가능한 프로필 컴포넌트

**구현 사항**:

1. **다른 사용자 프로필 조회 함수**
   ```typescript
   async function getUserProfile(userId: number) {
     const user = await db.user.findUnique({
       where: { id: userId },
       select: {
         id: true,
         username: true,
         email: true,
         avatar: true,
         created_at: true,
         products: {
           where: { status: "판매중" }, // 판매중인 상품만 표시
           orderBy: { created_at: "desc" },
           take: 10
         },
         _count: {
           select: {
             products: true,
             revieweeReviews: true
           }
         }
       }
     });
     
     if (!user) {
       return null;
     }
     
     // 받은 리뷰 평균 별점 계산
     const reviews = await db.review.findMany({
       where: { revieweeId: userId },
       select: { rating: true }
     });
     
     const avgRating = reviews.length > 0
       ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
       : 0;
     
     return { ...user, avgRating };
   }
   ```

2. **다른 사용자 프로필 페이지**
   - 기본 정보 표시 (사용자명, 아바타, 가입일)
   - 판매중인 상품 목록 표시
   - 받은 리뷰 목록 표시
   - 평균 별점 표시
   - 본인 프로필과 구분 (수정 버튼 없음)

3. **프로필 링크 추가**
   - 상품 상세 페이지의 판매자 정보에 링크 추가
   - 채팅방의 상대방 정보에 링크 추가
   - 리뷰 작성자 정보에 링크 추가

#### ✅ 테스트 체크리스트

- [ ] 다른 사용자 프로필 페이지 접근 가능
- [ ] 사용자 정보가 올바르게 표시되는지 확인
- [ ] 판매중인 상품 목록이 올바르게 표시되는지 확인
- [ ] 받은 리뷰 목록이 올바르게 표시되는지 확인
- [ ] 평균 별점이 올바르게 계산되어 표시되는지 확인
- [ ] 본인 프로필과 구분되는지 확인 (수정 버튼 없음)
- [ ] 존재하지 않는 사용자 접근 시 404 처리 확인
- [ ] 프로필 링크가 정상 작동하는지 확인

#### 💬 커밋 메시지

```
feat(profile): 다른 사용자 프로필 열람 기능 구현

- getUserProfile 함수 구현
- 다른 사용자 프로필 페이지 생성
- 판매중인 상품 목록 및 받은 리뷰 표시
- 평균 별점 계산 및 표시
- 프로필 링크 추가 (상품 상세, 채팅방, 리뷰)
```

---

## 📊 전체 구현 순서 요약

1. ✅ **Step 1**: 데이터베이스 스키마 확장
2. ✅ **Step 2**: 프로필 페이지 - 판매한 상품 목록 표시
3. ✅ **Step 3**: 프로필 페이지 - 구매한 상품 목록 표시
4. ✅ **Step 4**: 판매 완료 버튼 및 기능 구현
5. ✅ **Step 5**: 리뷰 작성 페이지 구현
6. ✅ **Step 6**: 프로필 페이지 - 받은 리뷰 목록 표시
7. ✅ **Step 7**: 리뷰 수정 및 삭제 기능 구현
8. ✅ **Step 8**: 프로필 수정 기능 구현
9. ✅ **Step 9**: 다른 사용자 프로필 열람 기능 구현

---

## 🔍 주의사항

1. **데이터 마이그레이션**: Step 1의 마이그레이션은 기존 데이터에 영향을 줄 수 있으므로 주의가 필요합니다.
2. **권한 관리**: 각 기능에서 적절한 권한 확인이 필요합니다.
3. **캐시 무효화**: 데이터 변경 시 관련 페이지의 캐시를 적절히 무효화해야 합니다.
4. **이미지 업로드**: 프로필 아바타 수정 시 Cloudinary 업로드 로직이 필요합니다.
5. **구매자 선택**: 판매 완료 시 구매자 선택 UI는 채팅방 목록을 기반으로 구현하는 것이 좋습니다.

---

## 📝 추가 고려사항

### 선택적 기능
- 리뷰 신고 기능
- 리뷰 좋아요 기능
- 프로필 공개/비공개 설정
- 판매 통계 (총 판매액, 판매 건수 등)
- 구매 통계 (총 구매액, 구매 건수 등)

### 성능 최적화
- 리뷰 목록 페이지네이션
- 상품 목록 무한 스크롤
- 이미지 lazy loading

---

이 계획서를 따라 단계별로 구현을 진행하시면 됩니다. 각 단계 완료 후 테스트를 진행하고, 문제가 없으면 커밋한 후 다음 단계로 진행하시면 됩니다.

