# 게시글 및 댓글 기능 구현 계획서

## 📋 목차
1. [댓글 섹션 구현](#1-댓글-섹션-구현)
2. [게시글 CRUD 기능 구현](#2-게시글-crud-기능-구현)
3. [구현 순서 및 우선순위](#3-구현-순서-및-우선순위)

---

## 1. 댓글 섹션 구현

### 1.1 댓글 작성 폼 추가
**파일**: `app/posts/[id]/page.tsx` 수정

**구현 내용**:
- 댓글 입력 폼 컴포넌트 추가
- `textarea` 또는 `input`으로 댓글 내용 입력
- 작성 버튼 추가
- 로그인 상태 확인 (세션 필요)

**기술 스택**:
- React Hook Form (선택사항, 간단한 폼이면 useState로도 가능)
- Server Actions 사용

**UI/UX**:
- 하단 고정 또는 게시글 하단에 배치
- 입력 필드 + 제출 버튼
- 로딩 상태 표시

---

### 1.2 댓글 리스트 표시
**파일**: `app/posts/[id]/page.tsx` 수정

**구현 내용**:
- `getPost` 함수에서 댓글 데이터 포함하도록 수정
  ```typescript
  include: {
    comments: {
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc', // 최신순
      },
    },
  }
  ```
- 댓글 리스트 컴포넌트 생성
- 각 댓글에 작성자 정보, 작성 시간, 내용 표시

**컴포넌트 구조**:
```
CommentList
  └── CommentItem (각 댓글)
      ├── User Avatar
      ├── Username
      ├── Created Time
      └── Payload (댓글 내용)
```

**파일 생성**:
- `components/comment-list.tsx` (선택사항)
- `components/comment-item.tsx` (선택사항)
- 또는 `page.tsx`에 직접 구현

---

### 1.3 댓글 작성 Server Action
**파일**: `app/posts/[id]/actions.ts` 수정

**함수명**: `createComment(postId: number, payload: string)`

**구현 내용**:
```typescript
export async function createComment(postId: number, payload: string) {
  const session = await getSession();
  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }
  
  // 입력 검증
  if (!payload.trim()) {
    return { error: "댓글 내용을 입력해주세요." };
  }
  
  await db.comment.create({
    data: {
      payload: payload.trim(),
      postId,
      userId: session.id,
    },
  });
  
  revalidatePath(`/posts/${postId}`);
  // 또는 revalidateTag 사용
}
```

**에러 처리**:
- 세션 없음
- 빈 댓글
- 존재하지 않는 게시글
- 데이터베이스 오류

---

### 1.4 낙관적 업데이트 (Optimistic Update)
**파일**: `components/comment-form.tsx` (새로 생성) 또는 `app/posts/[id]/page.tsx`

**구현 내용**:
- `useOptimistic` 훅 사용 (LikeButton 패턴 참고)
- 댓글 작성 즉시 UI에 표시
- 서버 응답 후 실제 데이터로 교체

**예시 코드 구조**:
```typescript
const [optimisticComments, addOptimisticComment] = useOptimistic(
  comments,
  (state, newComment) => [
    {
      id: Date.now(), // 임시 ID
      payload: newComment.payload,
      created_at: new Date(),
      user: { username: session.username, avatar: session.avatar },
    },
    ...state,
  ]
);
```

**주의사항**:
- 임시 댓글과 실제 댓글 구분
- 서버 에러 시 롤백 처리
- 로딩 상태 관리

---

## 2. 게시글 CRUD 기능 구현

### 2.1 게시글 추가하기
**파일**: `app/posts/add/page.tsx` (새로 생성)
**파일**: `app/posts/add/actions.ts` (새로 생성)
**파일**: `app/posts/add/schema.ts` (새로 생성, 선택사항)

**구현 내용**:
- 게시글 작성 페이지 생성
- 제목(title), 설명(description) 입력 폼
- Product 추가 페이지 패턴 참고 (`app/product/add/page.tsx`)

**Server Action**:
```typescript
export async function createPost(formData: FormData) {
  const session = await getSession();
  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }
  
  const title = formData.get("title");
  const description = formData.get("description");
  
  // 검증 로직
  // ...
  
  const post = await db.post.create({
    data: {
      title,
      description,
      userId: session.id,
    },
  });
  
  revalidatePath("/life");
  revalidateTag("posts");
  redirect(`/posts/${post.id}`);
}
```

**UI 구성**:
- 제목 입력 필드
- 설명 입력 필드 (textarea)
- 작성 완료 버튼
- 뒤로가기 버튼

**검증**:
- 제목 필수, 최소/최대 길이
- 설명 선택사항

---

### 2.2 게시글 수정하기
**파일**: `app/posts/edit/[id]/page.tsx` (새로 생성)
**파일**: `app/posts/edit/[id]/actions.ts` (새로 생성)
**파일**: `app/posts/edit/[id]/edit-post-form.tsx` (새로 생성, 선택사항)

**구현 내용**:
- 게시글 수정 페이지 생성
- 기존 데이터 로드 및 폼에 표시
- 소유자 확인 (본인만 수정 가능)
- Product 수정 페이지 패턴 참고 (`app/product/edit/[id]/page.tsx`)

**Server Action**:
```typescript
export async function updatePost(postId: number, formData: FormData) {
  const session = await getSession();
  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }
  
  // 게시글 조회 및 소유자 확인
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  
  if (!post) {
    return { error: "게시글을 찾을 수 없습니다." };
  }
  
  if (post.userId !== session.id) {
    return { error: "수정 권한이 없습니다." };
  }
  
  // 업데이트 로직
  await db.post.update({
    where: { id: postId },
    data: {
      title: formData.get("title"),
      description: formData.get("description"),
    },
  });
  
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/life");
  redirect(`/posts/${postId}`);
}
```

**UI 구성**:
- 기존 제목/설명 표시
- 수정 폼
- 저장 버튼
- 취소 버튼

---

### 2.3 게시글 삭제하기
**파일**: `app/posts/[id]/actions.ts` 수정
**파일**: `components/delete-post-button.tsx` (새로 생성)

**구현 내용**:
- 게시글 삭제 Server Action
- 삭제 확인 모달 (기존 `DeleteConfirmModal` 재사용 가능)
- 소유자 확인
- 삭제 후 리스트 페이지로 리다이렉트

**Server Action**:
```typescript
export async function deletePost(postId: number) {
  const session = await getSession();
  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }
  
  // 게시글 조회 및 소유자 확인
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  
  if (!post) {
    return { error: "게시글을 찾을 수 없습니다." };
  }
  
  if (post.userId !== session.id) {
    return { error: "삭제 권한이 없습니다." };
  }
  
  // 게시글 삭제 (CASCADE로 댓글도 자동 삭제됨)
  await db.post.delete({
    where: { id: postId },
  });
  
  revalidatePath("/life");
  redirect("/life");
}
```

**컴포넌트**:
- `DeletePostButton` 생성
- `DeleteConfirmModal` 재사용 또는 새로 생성
- 게시글 상세 페이지에 삭제 버튼 추가 (소유자만 보이도록)

**UI 위치**:
- 게시글 상세 페이지 상단 또는 하단
- 소유자만 보이도록 조건부 렌더링

---

### 2.4 게시글 리스트 업데이트
**파일**: `app/(tabs)/life/page.tsx` 수정

**구현 내용**:
- 게시글 추가/수정/삭제 후 리스트 자동 업데이트
- `revalidatePath` 또는 `revalidateTag` 사용
- 캐시 무효화 전략

**캐시 전략**:
```typescript
// actions.ts에서
revalidatePath("/life");
revalidateTag("posts"); // 태그 사용 시
```

**리스트 페이지 개선**:
- 무한 스크롤 (선택사항)
- 정렬 옵션 (최신순, 인기순)
- 검색 기능 (선택사항)

---

### 2.5 게시글 삭제 시 댓글 삭제 확인
**파일**: `components/delete-post-button.tsx` 또는 `components/delete-confirm-modal.tsx` 수정

**구현 내용**:
- 게시글 삭제 전 댓글 개수 확인
- 댓글이 있으면 경고 메시지 표시
- 사용자에게 확인 요청

**Server Action 수정**:
```typescript
export async function deletePost(postId: number) {
  // ... 소유자 확인 ...
  
  // 댓글 개수 확인
  const commentCount = await db.comment.count({
    where: { postId },
  });
  
  // 삭제 진행 (CASCADE로 자동 삭제됨)
  await db.post.delete({
    where: { id: postId },
  });
  
  // 경고 메시지는 클라이언트에서 표시
}
```

**UI 개선**:
- 삭제 확인 모달에 댓글 개수 표시
- "이 게시글과 함께 X개의 댓글이 삭제됩니다" 메시지
- 확인/취소 버튼

---

## 3. 구현 순서 및 우선순위

### Phase 1: 댓글 섹션 (필수)
1. ✅ 댓글 작성 Server Action (`app/posts/[id]/actions.ts`)
2. ✅ 댓글 리스트 표시 (`app/posts/[id]/page.tsx`)
3. ✅ 댓글 작성 폼 추가 (`app/posts/[id]/page.tsx`)
4. ✅ 낙관적 업데이트 구현

**예상 소요 시간**: 2-3시간

---

### Phase 2: 게시글 CRUD 기본 기능 (필수)
1. ✅ 게시글 추가 페이지 (`app/posts/add/`)
2. ✅ 게시글 수정 페이지 (`app/posts/edit/[id]/`)
3. ✅ 게시글 삭제 기능 (`app/posts/[id]/actions.ts`)
4. ✅ 삭제 버튼 컴포넌트 (`components/delete-post-button.tsx`)

**예상 소요 시간**: 3-4시간

---

### Phase 3: 리스트 업데이트 및 개선 (추가)
1. ✅ 게시글 리스트 자동 업데이트
2. ✅ 게시글 삭제 시 댓글 개수 확인
3. ✅ UI/UX 개선
4. ✅ 에러 처리 강화

**예상 소요 시간**: 1-2시간

---

## 4. 파일 구조

### 새로 생성할 파일들

```
app/
  posts/
    [id]/
      actions.ts (수정 - 댓글 관련 함수 추가)
      page.tsx (수정 - 댓글 섹션 추가)
    add/
      page.tsx (새로 생성)
      actions.ts (새로 생성)
      schema.ts (선택사항)
    edit/
      [id]/
        page.tsx (새로 생성)
        actions.ts (새로 생성)
        edit-post-form.tsx (선택사항)

components/
  comment-form.tsx (새로 생성, 선택사항)
  comment-list.tsx (새로 생성, 선택사항)
  comment-item.tsx (새로 생성, 선택사항)
  delete-post-button.tsx (새로 생성)
```

---

## 5. 기술 스택 및 패턴

### 사용할 기술
- **Server Actions**: 서버 사이드 로직 처리
- **React Hook Form**: 폼 관리 (선택사항)
- **Zod**: 데이터 검증 (선택사항)
- **useOptimistic**: 낙관적 업데이트
- **revalidatePath/revalidateTag**: 캐시 무효화

### 참고할 기존 패턴
- `app/product/add/`: 게시글 추가 패턴
- `app/product/edit/[id]/`: 게시글 수정 패턴
- `components/like-button.tsx`: 낙관적 업데이트 패턴
- `components/delete-product-button.tsx`: 삭제 버튼 패턴

---

## 6. 주의사항 및 고려사항

### 보안
- ✅ 모든 Server Action에서 세션 확인
- ✅ 게시글 수정/삭제 시 소유자 확인
- ✅ 입력 데이터 검증 및 sanitization

### 성능
- ✅ 댓글 리스트 페이지네이션 (선택사항)
- ✅ 적절한 캐시 전략 사용
- ✅ 불필요한 리렌더링 방지

### UX
- ✅ 로딩 상태 표시
- ✅ 에러 메시지 명확히 표시
- ✅ 낙관적 업데이트로 즉각적인 피드백
- ✅ 삭제 전 확인 모달

### 데이터베이스
- ✅ CASCADE 삭제 확인 (댓글 자동 삭제)
- ✅ 인덱스 최적화 (필요시)

---

## 7. 테스트 체크리스트

### 댓글 기능
- [ ] 댓글 작성 성공
- [ ] 댓글 작성 실패 (로그인 안 함)
- [ ] 댓글 작성 실패 (빈 내용)
- [ ] 댓글 리스트 표시
- [ ] 낙관적 업데이트 동작 확인
- [ ] 댓글 작성 후 리스트 업데이트

### 게시글 CRUD
- [ ] 게시글 추가 성공
- [ ] 게시글 추가 실패 (로그인 안 함)
- [ ] 게시글 수정 성공
- [ ] 게시글 수정 실패 (권한 없음)
- [ ] 게시글 삭제 성공
- [ ] 게시글 삭제 실패 (권한 없음)
- [ ] 게시글 삭제 시 댓글도 삭제되는지 확인
- [ ] 리스트 페이지 자동 업데이트 확인

---

## 8. 다음 단계 (선택사항)

- 댓글 수정/삭제 기능
- 댓글 좋아요 기능
- 대댓글 (답글) 기능
- 게시글 이미지 업로드
- 게시글 카테고리/태그
- 게시글 검색 기능
- 무한 스크롤
- 실시간 댓글 업데이트 (WebSocket)

---

**작성일**: 2024-12-10
**작성자**: AI Assistant
**프로젝트**: Carrot Market - 게시글 및 댓글 기능

