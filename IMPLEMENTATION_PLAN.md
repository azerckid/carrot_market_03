# 상품 수정 기능 및 캐싱 전략 개선 구현 계획

## 작업 흐름

**각 Phase는 독립적으로 완료하며, 완료 후 확인 및 커밋을 진행합니다.**

1. Phase 완료 → 코드 검토 → 테스트 → 커밋
2. 다음 Phase로 진행
3. 모든 Phase 완료 후 최종 검증

---

## 목차
1. [현재 상태 분석](#현재-상태-분석)
2. [캐싱 전략 개선](#캐싱-전략-개선)
3. [상품 수정 기능 구현](#상품-수정-기능-구현)
4. [구현 단계별 상세 계획](#구현-단계별-상세-계획)
5. [파일 구조](#파일-구조)
6. [주의사항 및 고려사항](#주의사항-및-고려사항)

---

## 현재 상태 분석

### 1.1 현재 캐싱 구조

#### 캐시 태그
- `"products"`: 홈 페이지 제품 목록 (`app/(tabs)/home/page.tsx`)
- `"product-detail"`: 제품 상세 정보 (`app/products/[id]/page.tsx`)
- `"product-title"`: 제품 제목 (메타데이터용, `app/products/[id]/page.tsx`)

#### 현재 revalidate 상태
- **업로드** (`app/product/add/actions.ts`):
  - ✅ `revalidateTag("products", "max")`
  - ✅ `revalidatePath("/home")`
  - ✅ `revalidatePath(`/products/${product.id}`)`
  - ❌ `revalidateTag("product-detail")` 누락
  - ❌ `revalidateTag("product-title")` 누락

- **삭제** (`app/products/[id]/actions.ts`):
  - ✅ `revalidateTag("products", "max")`
  - ✅ `revalidatePath("/home")`
  - ❌ `revalidateTag("product-detail")` 누락
  - ❌ `revalidateTag("product-title")` 누락
  - ❌ 삭제된 제품의 상세 페이지 경로 revalidate 누락

- **수정**: ❌ 구현되지 않음

### 1.2 현재 파일 구조
```
app/
├── product/
│   └── add/
│       ├── page.tsx          # 상품 추가 페이지
│       ├── actions.ts        # 업로드 액션
│       ├── schema.ts         # 클라이언트 스키마
│       └── server-schema.ts  # 서버 스키마
└── products/
    └── [id]/
        ├── page.tsx          # 상품 상세 페이지
        └── actions.ts        # 삭제 액션
```

---

## 캐싱 전략 개선

### 2.1 통합 캐싱 전략

모든 제품 관련 작업(업로드/수정/삭제)에서 일관된 캐시 무효화 전략을 적용합니다.

#### 2.1.1 업로드 시 (Create)
```typescript
// app/product/add/actions.ts
revalidateTag("products", "max");           // 홈 페이지 목록 갱신
revalidateTag("product-detail", "max");      // 제품 상세 페이지 캐시 갱신
revalidateTag("product-title", "max");       // 메타데이터 캐시 갱신
revalidatePath("/home");                     // 홈 페이지 경로 갱신
revalidatePath(`/products/${product.id}`);  // 새 제품 상세 페이지 갱신
```

#### 2.1.2 수정 시 (Update)
```typescript
// app/product/edit/[id]/actions.ts
revalidateTag("products", "max");           // 홈 페이지 목록 갱신 (가격/제목 변경 가능)
revalidateTag("product-detail", "max");      // 해당 제품 상세 페이지 갱신
revalidateTag("product-title", "max");       // 메타데이터 갱신
revalidatePath("/home");                     // 홈 페이지 경로 갱신
revalidatePath(`/products/${productId}`);    // 수정된 제품 상세 페이지 갱신
```

#### 2.1.3 삭제 시 (Delete)
```typescript
// app/products/[id]/actions.ts
revalidateTag("products", "max");           // 홈 페이지 목록 갱신
revalidateTag("product-detail", "max");      // 삭제된 제품 상세 페이지 캐시 무효화
revalidateTag("product-title", "max");       // 메타데이터 캐시 무효화
revalidatePath("/home");                     // 홈 페이지 경로 갱신
revalidatePath(`/products/${productId}`);    // 삭제된 제품 상세 페이지 경로 갱신
```

### 2.2 캐시 태그 매핑

| 태그 | 용도 | 영향 범위 |
|------|------|----------|
| `"products"` | 홈 페이지 제품 목록 | `/home` 페이지 |
| `"product-detail"` | 제품 상세 정보 | `/products/[id]` 페이지 |
| `"product-title"` | 제품 제목 (메타데이터) | `generateMetadata` 함수 |

---

## 상품 수정 기능 구현

### 3.1 기능 요구사항

#### 3.1.1 권한 관리
- ✅ 소유자만 수정 가능
- ✅ 비소유자 접근 시 `notFound()` 반환
- ✅ 로그인하지 않은 사용자 접근 시 리다이렉트

#### 3.1.2 데이터 처리
- ✅ 기존 제품 데이터를 불러와 폼에 채우기
- ✅ 기존 이미지 미리보기 표시
- ✅ 새 이미지 선택 시 기존 이미지 삭제 후 새 이미지 업로드
- ✅ 이미지 미선택 시 기존 이미지 유지

#### 3.1.3 폼 검증
- ✅ 제목, 가격, 설명 필수 검증
- ✅ 이미지는 선택적 (기존 이미지 유지 가능)
- ✅ 새 이미지 선택 시: 파일 타입, 크기 검증

#### 3.1.4 사용자 경험
- ✅ 수정 완료 시 제품 상세 페이지로 리다이렉트
- ✅ 에러 발생 시 폼에 에러 표시
- ✅ 로딩 상태 표시

### 3.2 파일 구조

```
app/product/edit/[id]/
├── page.tsx          # 수정 페이지 컴포넌트
├── actions.ts        # 수정 서버 액션
└── schema.ts         # 수정용 스키마 (선택적)
```

### 3.3 스키마 설계

#### 3.3.1 클라이언트 스키마 (수정용)
```typescript
// app/product/edit/[id]/schema.ts
// 이미지 선택을 optional로 변경
export const editProductSchema = z.object({
  photo: z.instanceof(FileList).optional()
    .refine(
      (files) => !files || files.length === 0 || files[0]?.type.startsWith("image/"),
      "이미지 파일만 업로드 가능합니다."
    )
    .refine(
      (files) => !files || files.length === 0 || files[0]?.size <= 1 * 1024 * 1024,
      "파일 크기는 최대 1MB까지 가능합니다."
    ),
  title: z.string({
    required_error: "Title is required",
  }),
  description: z.string({
    required_error: "Description is required",
  }),
  price: z.coerce.number({
    required_error: "Price is required",
  }),
});
```

#### 3.3.2 서버 스키마
- 기존 `server-schema.ts` 재사용 가능
- `photo`는 string (URL)이므로 그대로 사용

### 3.4 이미지 처리 로직

```typescript
// 수정 액션에서의 이미지 처리 흐름
1. FormData에서 photo 파일 확인
2. 새 이미지가 선택되었는지 확인
   - 선택됨:
     a. 기존 이미지의 Cloudinary public_id 추출
     b. Cloudinary에서 기존 이미지 삭제 (extractPublicIdFromUrl 함수 사용)
     c. 새 이미지를 Cloudinary에 업로드
     d. 새 이미지 URL 사용
   - 선택되지 않음:
     a. 기존 이미지 URL 유지
3. DB 업데이트
```

---

## 구현 단계별 상세 계획

### Phase 1: 캐싱 전략 통합 (기존 코드 개선)

#### Step 1.1: 업로드 액션 개선
**파일**: `app/product/add/actions.ts`

**작업 내용**:
- `revalidateTag("product-detail", "max")` 추가
- `revalidateTag("product-title", "max")` 추가
- 기존 revalidate 로직 유지

**변경 전**:
```typescript
revalidateTag("products", "max");
revalidatePath("/home");
revalidatePath(`/products/${product.id}`);
```

**변경 후**:
```typescript
revalidateTag("products", "max");
revalidateTag("product-detail", "max");
revalidateTag("product-title", "max");
revalidatePath("/home");
revalidatePath(`/products/${product.id}`);
```

#### Step 1.2: 삭제 액션 개선
**파일**: `app/products/[id]/actions.ts`

**작업 내용**:
- `revalidateTag("product-detail", "max")` 추가
- `revalidateTag("product-title", "max")` 추가
- `revalidatePath(`/products/${productId}`)` 추가

**변경 전**:
```typescript
revalidateTag("products", "max");
revalidatePath("/home");
redirect("/home");
```

**변경 후**:
```typescript
revalidateTag("products", "max");
revalidateTag("product-detail", "max");
revalidateTag("product-title", "max");
revalidatePath("/home");
revalidatePath(`/products/${productId}`);
redirect("/home");
```

---

### Phase 2: 수정 액션 생성

#### Step 2.1: 수정 액션 파일 생성
**파일**: `app/product/edit/[id]/actions.ts`

**기능**:
1. 권한 확인
   - 세션 확인
   - 제품 소유자 확인
   - 비소유자 접근 시 에러 반환

2. 이미지 처리
   - 새 이미지 선택 여부 확인
   - 선택 시: 기존 이미지 삭제 + 새 이미지 업로드
   - 미선택 시: 기존 이미지 URL 유지

3. 데이터 검증
   - `serverProductSchema`로 검증

4. DB 업데이트
   - Prisma `update` 사용

5. 캐시 무효화
   - 통합 캐싱 전략 적용

**함수 시그니처**:
```typescript
export async function updateProduct(
  productId: number,
  formData: FormData
): Promise<{ error?: string } | { fieldErrors?: {...} } | void>
```

**에러 처리**:
- 로그인 필요
- 제품 없음
- 권한 없음
- 검증 실패
- Cloudinary 업로드 실패

---

### Phase 3: 수정 페이지 UI 구현

#### Step 3.1: 수정 페이지 컴포넌트 생성
**파일**: `app/product/edit/[id]/page.tsx`

**기능**:
1. 제품 데이터 로딩
   - `getCachedProduct` 사용하여 제품 정보 가져오기
   - 제품이 없으면 `notFound()`

2. 소유자 확인
   - `getIsOwner` 함수 사용
   - 비소유자 접근 시 `notFound()`

3. 폼 초기화
   - 기존 제품 데이터로 폼 필드 채우기
   - 기존 이미지 미리보기 표시

4. 폼 제출
   - `updateProduct` 액션 호출
   - 에러 처리 및 표시

**UI 구성**:
- BackButton (제품 상세 페이지로)
- 이미지 업로드 영역 (기존 이미지 표시 + 변경 가능)
- 제목 입력 필드 (기존 값으로 채움)
- 가격 입력 필드 (기존 값으로 채움)
- 설명 입력 필드 (기존 값으로 채움)
- 수정 완료 버튼

**기존 이미지 처리**:
- 초기 상태: 기존 이미지 URL을 `preview` state에 설정
- 새 이미지 선택 시: 새 이미지로 교체
- 이미지 제거 시: 빈 상태로 변경 (기존 이미지 유지)

#### Step 3.2: 스키마 파일 생성 (선택적)
**파일**: `app/product/edit/[id]/schema.ts`

**내용**:
- 이미지 선택을 optional로 한 수정용 스키마
- 또는 기존 `schema.ts`를 수정하여 재사용

---

### Phase 4: 수정 버튼 추가

#### Step 4.1: 제품 상세 페이지에 수정 버튼 추가
**파일**: `app/products/[id]/page.tsx`

**작업 내용**:
- 소유자에게만 수정 버튼 표시
- `isOwner`가 true일 때만 표시
- 삭제 버튼 옆에 배치

**UI 위치**:
```typescript
{isOwner ? (
  <>
    <Link href={`/product/edit/${productId}`}>
      수정
    </Link>
    <DeleteProductButton productId={productId} />
  </>
) : null}
```

---

### Phase 5: 테스트 및 검증

#### Step 5.1: 기능 테스트
- [ ] 제품 업로드 후 캐시 무효화 확인
- [ ] 제품 수정 후 캐시 무효화 확인
- [ ] 제품 삭제 후 캐시 무효화 확인
- [ ] 소유자만 수정 가능 확인
- [ ] 비소유자 접근 시 404 확인
- [ ] 이미지 변경 시 기존 이미지 삭제 확인
- [ ] 이미지 미변경 시 기존 이미지 유지 확인

#### Step 5.2: 에러 처리 테스트
- [ ] 로그인하지 않은 사용자 접근
- [ ] 존재하지 않는 제품 ID 접근
- [ ] 권한 없는 사용자 접근
- [ ] 폼 검증 실패
- [ ] Cloudinary 업로드 실패

---

## 파일 구조

### 최종 파일 구조
```
app/
├── product/
│   ├── add/
│   │   ├── page.tsx
│   │   ├── actions.ts          # [개선] 캐싱 전략 추가
│   │   ├── schema.ts
│   │   └── server-schema.ts
│   └── edit/
│       └── [id]/
│           ├── page.tsx        # [신규] 수정 페이지
│           ├── actions.ts       # [신규] 수정 액션
│           └── schema.ts        # [신규] 수정용 스키마 (선택적)
└── products/
    └── [id]/
        ├── page.tsx             # [수정] 수정 버튼 추가
        └── actions.ts           # [개선] 캐싱 전략 추가
```

---

## 주의사항 및 고려사항

### 6.1 이미지 처리 주의사항

1. **기존 이미지 삭제**
   - 새 이미지 업로드 전에 기존 이미지 삭제
   - Cloudinary 삭제 실패해도 DB 업데이트는 진행 (에러 로그만 기록)

2. **이미지 URL 유지**
   - 이미지를 변경하지 않으면 기존 URL 그대로 사용
   - FormData에서 photo가 없거나 빈 값이면 기존 이미지 유지

3. **에러 처리**
   - Cloudinary 업로드 실패 시 사용자에게 에러 표시
   - DB 업데이트는 Cloudinary 업로드 성공 후에만 진행

### 6.2 권한 관리

1. **이중 확인**
   - 페이지 로딩 시 소유자 확인
   - 액션 실행 시 다시 소유자 확인 (보안 강화)

2. **에러 메시지**
   - 권한 없음: "수정 권한이 없습니다."
   - 제품 없음: "제품을 찾을 수 없습니다."
   - 로그인 필요: "로그인이 필요합니다."

### 6.3 캐싱 전략

1. **일관성 유지**
   - 모든 CRUD 작업에서 동일한 태그 사용
   - `revalidateTag`와 `revalidatePath` 함께 사용

2. **성능 고려**
   - `revalidateTag`는 태그 기반으로 선택적 무효화
   - `revalidatePath`는 경로 기반으로 확실한 갱신

### 6.4 사용자 경험

1. **로딩 상태**
   - 폼 제출 중 버튼 비활성화
   - 로딩 인디케이터 표시

2. **에러 표시**
   - 필드별 에러 메시지 표시
   - 서버 에러를 폼 필드에 연결

3. **성공 처리**
   - 수정 완료 시 제품 상세 페이지로 리다이렉트
   - 사용자가 수정된 내용을 바로 확인 가능

---

## 구현 체크리스트

### Phase 1: 캐싱 전략 통합 ⏸️ (현재 단계)
**목표**: 기존 업로드/삭제 액션의 캐싱 전략 개선

**작업 항목**:
- [ ] `app/product/add/actions.ts` 개선
  - [ ] `revalidateTag("product-detail", "max")` 추가
  - [ ] `revalidateTag("product-title", "max")` 추가
- [ ] `app/products/[id]/actions.ts` 개선
  - [ ] `revalidateTag("product-detail", "max")` 추가
  - [ ] `revalidateTag("product-title", "max")` 추가
  - [ ] `revalidatePath(`/products/${productId}`)` 추가
- [ ] 캐싱 전략 테스트
  - [ ] 업로드 후 캐시 무효화 확인
  - [ ] 삭제 후 캐시 무효화 확인

**완료 후**: 코드 검토 → 테스트 → 커밋 → Phase 2로 진행

---

### Phase 2: 수정 액션 생성 ⏸️
**목표**: 상품 수정을 위한 서버 액션 구현

**작업 항목**:
- [ ] `app/product/edit/[id]/actions.ts` 생성
- [ ] 권한 확인 로직 구현
  - [ ] 세션 확인
  - [ ] 제품 소유자 확인
- [ ] 이미지 처리 로직 구현
  - [ ] 새 이미지 선택 여부 확인
  - [ ] 기존 이미지 삭제 로직
  - [ ] 새 이미지 업로드 로직
- [ ] DB 업데이트 로직 구현
- [ ] 캐시 무효화 로직 구현 (통합 캐싱 전략 적용)
- [ ] 에러 처리 구현

**완료 후**: 코드 검토 → 테스트 → 커밋 → Phase 3으로 진행

---

### Phase 3: 수정 페이지 UI ⏸️
**목표**: 상품 수정을 위한 UI 페이지 구현

**작업 항목**:
- [ ] `app/product/edit/[id]/page.tsx` 생성
- [ ] 제품 데이터 로딩 구현
- [ ] 소유자 확인 구현
- [ ] 폼 초기화 구현
  - [ ] 기존 데이터로 필드 채우기
- [ ] 기존 이미지 미리보기 구현
- [ ] 폼 제출 처리 구현
- [ ] 에러 표시 구현
- [ ] `app/product/edit/[id]/schema.ts` 생성 (선택적)

**완료 후**: 코드 검토 → 테스트 → 커밋 → Phase 4로 진행

---

### Phase 4: 수정 버튼 추가 ⏸️
**목표**: 제품 상세 페이지에 수정 버튼 추가

**작업 항목**:
- [ ] `app/products/[id]/page.tsx`에 수정 버튼 추가
- [ ] 소유자에게만 표시되도록 구현
- [ ] UI 스타일링
- [ ] 수정 페이지로 이동하는 링크 구현

**완료 후**: 코드 검토 → 테스트 → 커밋 → Phase 5로 진행

---

### Phase 5: 테스트 및 검증 ⏸️
**목표**: 전체 기능 통합 테스트 및 최종 검증

**작업 항목**:
- [ ] 기능 테스트
  - [ ] 제품 업로드 후 캐시 무효화 확인
  - [ ] 제품 수정 후 캐시 무효화 확인
  - [ ] 제품 삭제 후 캐시 무효화 확인
  - [ ] 소유자만 수정 가능 확인
  - [ ] 비소유자 접근 시 404 확인
  - [ ] 이미지 변경 시 기존 이미지 삭제 확인
  - [ ] 이미지 미변경 시 기존 이미지 유지 확인
- [ ] 에러 처리 테스트
  - [ ] 로그인하지 않은 사용자 접근
  - [ ] 존재하지 않는 제품 ID 접근
  - [ ] 권한 없는 사용자 접근
  - [ ] 폼 검증 실패
  - [ ] Cloudinary 업로드 실패
- [ ] 캐싱 동작 확인
- [ ] 사용자 경험 확인

**완료 후**: 최종 검토 → 커밋 → 프로젝트 완료

---

## 예상 소요 시간

- Phase 1: 30분 (기존 코드 개선)
- Phase 2: 1-2시간 (수정 액션 구현)
- Phase 3: 1-2시간 (수정 페이지 UI)
- Phase 4: 30분 (수정 버튼 추가)
- Phase 5: 1시간 (테스트 및 검증)

**총 예상 시간**: 4-6시간

---

## 다음 단계

문서 검토 후 코딩을 시작하겠습니다.
각 Phase별로 완료 후 테스트를 진행하며, 문제가 발생하면 즉시 수정하겠습니다.

