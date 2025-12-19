# 채팅 기능 구현 계획서 (Polling + Server Actions)

## 📋 목차
1. [전체 개요](#전체-개요)
2. [데이터베이스 스키마 설계](#데이터베이스-스키마-설계)
3. [단계별 구현 계획](#단계별-구현-계획)
4. [기술 스택 및 패턴](#기술-스택-및-패턴)
5. [주의사항 및 고려사항](#주의사항-및-고려사항)

---

## 전체 개요

### 채팅 구조 이해

**핵심 개념**: 
- **구매자가 판매자(오너)에게 말을 걸기 위한 채팅 기능**
- **판매자 1명 ↔ 구매자 여러 명** 구조
- 같은 상품에 대해 여러 구매자들이 각각 별도의 채팅방을 생성할 수 있음

**예시**:
- 상품 ID 9 (판매자: Alice)
  - 구매자 Bob → 채팅방 1 생성 (Bob ↔ Alice)
  - 구매자 Charlie → 채팅방 2 생성 (Charlie ↔ Alice)
  - 구매자 David → 채팅방 3 생성 (David ↔ Alice)
  - **총 3개의 채팅방이 같은 상품(productId=9)에 대해 존재**

**채팅방 목록에서**:
- **판매자 입장**: 자신의 상품에 대한 여러 채팅방을 볼 수 있음
  - 예: 상품 9에 대한 채팅방 3개 (구매자 A, B, C와의 채팅방)
- **구매자 입장**: 자신이 구매한 상품에 대한 채팅방을 볼 수 있음
  - 예: 구매자 Bob은 상품 9에 대한 채팅방 1개만 보임

**중복 방지**:
- `@@unique([buyerId, sellerId, productId])` 제약조건으로
- 같은 구매자와 판매자가 같은 상품에 대해 여러 채팅방을 만들 수 없도록 방지
- 하지만 다른 구매자들은 같은 상품에 대해 각각 채팅방을 만들 수 있음

### 구현 목표
- 상품 판매자와 구매자 간의 1:1 채팅 기능 구현
- **하나의 상품에 대해 여러 채팅방이 존재할 수 있는 구조 지원**
- Polling 방식으로 새 메시지 확인 (2초 간격)
- Server Actions를 통한 메시지 전송 및 조회
- 채팅방 목록 및 채팅방 상세 페이지 구현

### 기능 요구사항
1. **채팅방 생성**: 상품 상세 페이지에서 "채팅하기" 버튼 클릭 시 채팅방 생성
   - 구매자가 판매자에게 채팅을 시작하는 방식
   - 같은 구매자-판매자-상품 조합에 대해서는 기존 채팅방으로 이동
2. **채팅방 목록**: 내가 참여한 모든 채팅방 목록 표시
   - 판매자: 자신의 상품에 대한 여러 채팅방 목록 (여러 구매자와의 채팅)
   - 구매자: 자신이 구매한 상품에 대한 채팅방 목록
3. **메시지 전송**: 텍스트 메시지 전송 및 즉시 화면에 표시 (낙관적 업데이트)
4. **메시지 조회**: Polling을 통한 새 메시지 자동 조회
5. **상대방 정보**: 채팅방에서 상대방 프로필 정보 표시

### 예상 소요 시간
- **Step 1**: 데이터베이스 스키마 설계 및 마이그레이션 (30분)
- **Step 2**: 채팅방 목록 페이지 구현 (1-2시간)
- **Step 3**: 채팅방 상세 페이지 기본 구조 (1-2시간)
- **Step 4**: 메시지 전송 기능 구현 (1시간)
- **Step 5**: Polling 로직 구현 (1-2시간)
- **Step 6**: 채팅방 생성 기능 및 UI/UX 개선 (1-2시간)
- **Step 7**: 채팅 알림 뱃지 기능 구현 (1시간)

**총 예상 시간**: 7-11시간

---

## 데이터베이스 스키마 설계

### ChatRoom 모델
```prisma
model ChatRoom {
  id         Int       @id @default(autoincrement())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  product    Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId  Int
  buyer      User      @relation("BuyerChatRooms", fields: [buyerId], references: [id], onDelete: Cascade)
  buyerId    Int
  seller     User      @relation("SellerChatRooms", fields: [sellerId], references: [id], onDelete: Cascade)
  sellerId   Int
  messages   Message[]

  @@unique([buyerId, sellerId, productId]) // 같은 구매자-판매자-상품 조합에 대한 중복 방지
  // 주의: 같은 상품(productId)에 대해 여러 구매자들이 각각 채팅방을 만들 수 있음
  // 예: 상품 9에 대해 구매자 A, B, C가 각각 채팅방을 만들면 총 3개의 채팅방이 존재
  @@index([buyerId])
  @@index([sellerId])
  @@index([productId])
}
```

### Message 모델
```prisma
model Message {
  id         Int       @id @default(autoincrement())
  payload    String
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     Int
  chatRoom   ChatRoom  @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  chatRoomId Int

  @@index([chatRoomId, created_at]) // 채팅방별 메시지 조회 최적화
}
```

### User 모델 수정
```prisma
model User {
  // ... 기존 필드들
  buyerChatRooms  ChatRoom[] @relation("BuyerChatRooms")
  sellerChatRooms ChatRoom[] @relation("SellerChatRooms")
  messages        Message[]
}
```

### Product 모델 수정
```prisma
model Product {
  // ... 기존 필드들
  chatRooms ChatRoom[]
}
```

---

## 단계별 구현 계획

### Step 1: 데이터베이스 스키마 설계 및 마이그레이션

#### 📝 구현 내용

**목표**: 채팅 기능에 필요한 데이터베이스 모델 생성

**작업 내용**:
1. `prisma/schema.prisma` 파일 수정
   - `ChatRoom` 모델 추가
   - `Message` 모델 추가
   - `User` 모델에 관계 추가
   - `Product` 모델에 관계 추가

2. 마이그레이션 실행
   ```bash
   npx prisma migrate dev --name add_chat_models
   ```

3. Prisma Client 재생성
   ```bash
   npx prisma generate
   ```

**파일 수정**:
- `prisma/schema.prisma`

---

#### ✅ 테스트 체크리스트

- [ ] **스키마 파일 수정 확인**
  - `ChatRoom` 모델이 올바르게 정의되었는지 확인
  - `Message` 모델이 올바르게 정의되었는지 확인
  - 관계(relations)가 올바르게 설정되었는지 확인

- [ ] **마이그레이션 실행 확인**
  - 마이그레이션이 성공적으로 실행되었는지 확인
  - 데이터베이스에 테이블이 생성되었는지 확인 (Prisma Studio 사용)

- [ ] **Prisma Client 재생성 확인**
  - 타입스크립트 에러가 없는지 확인
  - IDE에서 자동완성이 정상 작동하는지 확인

---

#### 💬 커밋 메시지 제안

```
feat(db): 채팅 기능을 위한 데이터베이스 스키마 추가

- ChatRoom 모델 추가 (구매자, 판매자, 상품 관계)
- Message 모델 추가 (메시지 내용, 작성자, 채팅방 관계)
- User 및 Product 모델에 채팅 관련 관계 추가
- 중복 채팅방 방지를 위한 unique 제약조건 추가
```

---

### Step 2: 채팅방 목록 페이지 구현

#### 📝 구현 내용

**목표**: 사용자가 참여한 모든 채팅방 목록을 표시하는 페이지 구현

**파일 생성/수정**:
- `app/(tabs)/chat/page.tsx` - 채팅방 목록 페이지
- `app/chat/[id]/page.tsx` - 채팅방 상세 페이지 (다음 단계에서 구현)

**구현 사항**:
1. **데이터 조회 함수** (`getChatRooms`)
   - 현재 사용자가 참여한 채팅방 조회 (buyer 또는 seller)
   - **판매자 입장**: 자신의 상품에 대한 여러 채팅방 조회 (여러 구매자와의 채팅)
   - **구매자 입장**: 자신이 구매한 상품에 대한 채팅방 조회
   - 각 채팅방의 최신 메시지 1개 포함
   - 상대방 정보 포함 (판매자면 구매자 정보, 구매자면 판매자 정보)
   - 상품 정보 포함
   - 최신 메시지 기준 정렬

2. **UI 구성**
   - 채팅방 목록 표시
   - 각 채팅방 카드에 표시할 정보:
     - 상대방 프로필 이미지 및 이름
     - 상품 이미지 및 제목
     - 최신 메시지 미리보기
     - 최신 메시지 시간
     - 읽지 않은 메시지 수 (선택사항)

3. **빈 상태 처리**
   - 채팅방이 없을 때 안내 메시지 표시

**데이터 조회 예시**:
```typescript
async function getChatRooms(userId: number) {
  const chatRooms = await db.chatRoom.findMany({
    where: {
      OR: [
        { buyerId: userId },   // 구매자로 참여한 채팅방
        { sellerId: userId },   // 판매자로 참여한 채팅방
      ],
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          photo: true,
        },
      },
      buyer: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      messages: {
        take: 1,
        orderBy: {
          created_at: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
    orderBy: {
      updated_at: "desc",
    },
  });
  
  // 주의: 채팅방 목록에서 상대방 정보를 표시할 때:
  // - 현재 사용자가 buyer면 → seller 정보 표시
  // - 현재 사용자가 seller면 → buyer 정보 표시
  // UI에서 chatRoom.buyerId === userId ? chatRoom.seller : chatRoom.buyer 로 처리
  
  return chatRooms;
}
```

---

#### ✅ 테스트 체크리스트

- [ ] **채팅방 목록 페이지 접속**
  - `/chat` 페이지 접속
  - 로그인 상태 확인

- [ ] **채팅방 목록 표시 확인**
  - 내가 참여한 채팅방이 표시되는지 확인
  - **판매자 테스트**: 같은 상품에 대한 여러 채팅방이 모두 표시되는지 확인
  - **구매자 테스트**: 자신이 구매한 상품에 대한 채팅방만 표시되는지 확인
  - 상대방 정보가 올바르게 표시되는지 확인 (판매자면 구매자 정보, 구매자면 판매자 정보)
  - 상품 정보가 올바르게 표시되는지 확인
  - 최신 메시지가 표시되는지 확인

- [ ] **빈 상태 확인**
  - 채팅방이 없을 때 안내 메시지가 표시되는지 확인

- [ ] **정렬 확인**
  - 최신 메시지가 있는 채팅방이 상단에 표시되는지 확인

---

#### 💬 커밋 메시지 제안

```
feat(chat): 채팅방 목록 페이지 구현

- 사용자가 참여한 채팅방 목록 조회 기능 추가
- 채팅방 카드 UI 구현 (상대방 정보, 상품 정보, 최신 메시지 표시)
- 빈 상태 메시지 추가
- 최신 메시지 기준 정렬 기능 추가
```

---

### Step 3: 채팅방 상세 페이지 기본 구조

#### 📝 구현 내용

**목표**: 채팅방 상세 페이지의 기본 구조 및 메시지 표시 구현

**파일 생성**:
- `app/chat/[id]/page.tsx` - 채팅방 상세 페이지
- `app/chat/[id]/actions.ts` - 채팅 관련 Server Actions
- `components/chat-message-list.tsx` - 메시지 리스트 컴포넌트 (선택사항)
- `components/chat-input.tsx` - 메시지 입력 컴포넌트 (선택사항)

**구현 사항**:
1. **데이터 조회 함수** (`getChatRoom`)
   - 채팅방 정보 조회
   - 권한 확인 (현재 사용자가 참여한 채팅방인지)
   - 상대방 정보 조회
   - 상품 정보 조회
   - 메시지 목록 조회 (최신순, 페이지네이션 고려)

2. **UI 구성**
   - 상단 헤더: 상대방 정보, 상품 정보
   - 메시지 리스트 영역
   - 하단 입력 영역 (다음 단계에서 구현)

3. **메시지 표시**
   - 내 메시지와 상대방 메시지 구분
   - 메시지 시간 표시
   - 사용자 아바타 표시

**데이터 조회 예시**:
```typescript
async function getChatRoom(chatRoomId: number, userId: number) {
  const chatRoom = await db.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          photo: true,
          price: true,
        },
      },
      buyer: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      messages: {
        orderBy: {
          created_at: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!chatRoom) {
    return null;
  }

  // 권한 확인
  if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
    return null;
  }

  return chatRoom;
}
```

---

#### ✅ 테스트 체크리스트

- [ ] **채팅방 상세 페이지 접속**
  - `/chat/[id]` 페이지 접속
  - 올바른 채팅방 ID로 접속 확인

- [ ] **권한 확인**
  - 참여하지 않은 채팅방 접속 시 `notFound()` 처리 확인
  - 존재하지 않는 채팅방 접속 시 `notFound()` 처리 확인

- [ ] **데이터 표시 확인**
  - 상대방 정보가 올바르게 표시되는지 확인
  - 상품 정보가 올바르게 표시되는지 확인
  - 메시지 목록이 올바르게 표시되는지 확인
  - 내 메시지와 상대방 메시지가 구분되어 표시되는지 확인

- [ ] **메시지 시간 표시 확인**
  - 메시지 시간이 올바르게 표시되는지 확인
  - `formatToTimeAgo` 함수 사용 확인

---

#### 💬 커밋 메시지 제안

```
feat(chat): 채팅방 상세 페이지 기본 구조 구현

- 채팅방 정보 조회 및 권한 확인 기능 추가
- 메시지 리스트 표시 기능 구현
- 내 메시지와 상대방 메시지 구분 UI 구현
- 상대방 정보 및 상품 정보 표시 기능 추가
```

---

### Step 4: 메시지 전송 기능 구현

#### 📝 구현 내용

**목표**: 메시지 전송 Server Action 및 UI 구현

**파일 수정**:
- `app/chat/[id]/actions.ts` - `sendMessage` 함수 추가
- `app/chat/[id]/page.tsx` - 메시지 입력 폼 추가
- `components/chat-input.tsx` - 메시지 입력 컴포넌트 (선택사항)

**구현 사항**:
1. **Server Action** (`sendMessage`)
   - 세션 확인
   - 채팅방 권한 확인
   - 입력 데이터 검증 (빈 메시지 체크)
   - 메시지 저장
   - 채팅방 `updated_at` 업데이트
   - 캐시 무효화 (`revalidatePath`)

2. **낙관적 업데이트**
   - `useOptimistic` 훅 사용
   - 메시지 전송 즉시 화면에 표시
   - 서버 응답 후 실제 데이터로 교체

3. **UI 구성**
   - 텍스트 입력 필드
   - 전송 버튼
   - 로딩 상태 표시

**Server Action 예시**:
```typescript
export async function sendMessage(chatRoomId: number, payload: string) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  if (!payload || !payload.trim()) {
    return { error: "메시지를 입력해주세요." };
  }

  // 채팅방 권한 확인
  const chatRoom = await db.chatRoom.findUnique({
    where: { id: chatRoomId },
    select: {
      buyerId: true,
      sellerId: true,
    },
  });

  if (!chatRoom) {
    return { error: "채팅방을 찾을 수 없습니다." };
  }

  if (chatRoom.buyerId !== session.id && chatRoom.sellerId !== session.id) {
    return { error: "권한이 없습니다." };
  }

  // 메시지 저장
  await db.message.create({
    data: {
      payload: payload.trim(),
      chatRoomId,
      userId: session.id,
    },
  });

  // 채팅방 업데이트 시간 갱신
  await db.chatRoom.update({
    where: { id: chatRoomId },
    data: {
      updated_at: new Date(),
    },
  });

  revalidatePath(`/chat/${chatRoomId}`);
  revalidatePath("/chat");

  return { success: true };
}
```

---

#### ✅ 테스트 체크리스트

- [ ] **메시지 전송 기능**
  - 메시지 입력 후 전송 버튼 클릭
  - 메시지가 즉시 화면에 표시되는지 확인 (낙관적 업데이트)
  - 서버 응답 후 메시지가 정상적으로 저장되었는지 확인

- [ ] **에러 처리**
  - 로그인하지 않은 상태에서 메시지 전송 시도
  - 빈 메시지 전송 시도
  - 권한이 없는 채팅방에서 메시지 전송 시도

- [ ] **입력 필드 초기화**
  - 메시지 전송 후 입력 필드가 초기화되는지 확인

- [ ] **캐시 무효화 확인**
  - 메시지 전송 후 채팅방 목록이 업데이트되는지 확인
  - 새로고침 후 메시지가 유지되는지 확인

---

#### 💬 커밋 메시지 제안

```
feat(chat): 메시지 전송 기능 구현

- sendMessage Server Action 추가 (권한 확인, 데이터 검증 포함)
- 낙관적 업데이트를 통한 즉시 메시지 표시 기능 구현
- 메시지 입력 폼 UI 구현
- 채팅방 목록 자동 업데이트 기능 추가
```

---

### Step 5: Polling 로직 구현

#### 📝 구현 내용

**목표**: 주기적으로 새 메시지를 조회하는 Polling 기능 구현

**파일 수정**:
- `app/chat/[id]/actions.ts` - `getNewMessages` 함수 추가
- `app/chat/[id]/page.tsx` - Polling 로직 추가 (또는 별도 클라이언트 컴포넌트)

**구현 사항**:
1. **Server Action** (`getNewMessages`)
   - 마지막 메시지 ID 또는 타임스탬프를 받아서
   - 그 이후의 새 메시지만 조회
   - 권한 확인 포함

2. **Polling 로직**
   - `useEffect`와 `setInterval` 사용
   - 2초 간격으로 새 메시지 확인
   - 컴포넌트 언마운트 시 interval 정리
   - 페이지가 포커스되지 않았을 때는 polling 중지 (선택사항)

3. **상태 관리**
   - 마지막 메시지 ID 또는 타임스탬프 저장
   - 새 메시지가 있으면 메시지 리스트에 추가

**Polling 로직 예시**:
```typescript
"use client";

import { useEffect, useState, useRef } from "react";
import { getNewMessages } from "./actions";

export default function ChatMessageList({
  initialMessages,
  chatRoomId,
}: {
  initialMessages: Message[];
  chatRoomId: number;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const lastMessageIdRef = useRef<number | null>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      const newMessages = await getNewMessages(
        chatRoomId,
        lastMessageIdRef.current
      );

      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);
        lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
      }
    }, 2000); // 2초마다 확인

    return () => clearInterval(interval);
  }, [chatRoomId]);

  // ... 메시지 렌더링
}
```

**Server Action 예시**:
```typescript
export async function getNewMessages(
  chatRoomId: number,
  lastMessageId: number | null
) {
  const session = await getSession();

  if (!session.id) {
    return [];
  }

  // 권한 확인
  const chatRoom = await db.chatRoom.findUnique({
    where: { id: chatRoomId },
    select: {
      buyerId: true,
      sellerId: true,
    },
  });

  if (!chatRoom) {
    return [];
  }

  if (chatRoom.buyerId !== session.id && chatRoom.sellerId !== session.id) {
    return [];
  }

  // 새 메시지 조회
  const where: any = {
    chatRoomId,
  };

  if (lastMessageId) {
    where.id = {
      gt: lastMessageId,
    };
  }

  const newMessages = await db.message.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return newMessages;
}
```

---

#### ✅ 테스트 체크리스트

- [ ] **Polling 동작 확인**
  - 채팅방 페이지 접속 후 2초마다 새 메시지 확인 요청이 발생하는지 확인
  - 개발자 도구 Network 탭에서 확인 가능

- [ ] **새 메시지 수신 확인**
  - 다른 사용자가 메시지를 보냈을 때
  - 2초 이내에 새 메시지가 화면에 표시되는지 확인

- [ ] **중복 메시지 방지 확인**
  - 같은 메시지가 중복으로 표시되지 않는지 확인
  - 마지막 메시지 ID가 올바르게 업데이트되는지 확인

- [ ] **메모리 누수 방지 확인**
  - 페이지를 떠날 때 interval이 정리되는지 확인
  - 컴포넌트 언마운트 시 정리 함수가 호출되는지 확인

- [ ] **권한 확인**
  - 권한이 없는 사용자가 polling을 시도해도 에러가 발생하지 않는지 확인

---

#### 💬 커밋 메시지 제안

```
feat(chat): Polling을 통한 실시간 메시지 수신 기능 구현

- getNewMessages Server Action 추가 (마지막 메시지 ID 기반 조회)
- 2초 간격 Polling 로직 구현
- 새 메시지 자동 추가 기능 구현
- 메모리 누수 방지를 위한 cleanup 로직 추가
```

---

### Step 6: 채팅방 생성 기능 및 UI/UX 개선

#### 📝 구현 내용

**목표**: 상품 상세 페이지(`/products/[id]`)에서 "채팅하기" 버튼을 통해 채팅방 생성 기능 구현 및 UI/UX 개선

**현재 상태**:
- `app/products/[id]/page.tsx`에 "채팅하기" 버튼이 이미 존재하지만 `href`가 비어있음 (132-137줄)
- 버튼 클릭 시 동작하지 않는 상태

**파일 수정**:
- `app/products/[id]/page.tsx` - "채팅하기" 버튼에 Server Action 연결
- `app/products/[id]/actions.ts` - `createChatRoom` 함수 추가 (새 파일 생성)
- `app/chat/[id]/page.tsx` - UI/UX 개선

**구현 사항**:
1. **채팅방 생성 Server Action** (`createChatRoom`)
   - 상품 ID를 받아서 채팅방 생성
   - 현재 사용자 = buyer, 상품 판매자 = seller로 설정
   - 이미 채팅방이 있으면 기존 채팅방 반환
   - 채팅방 상세 페이지(`/chat/[id]`)로 리다이렉트

2. **상품 상세 페이지 "채팅하기" 버튼 연결**
   - 현재 상태:
     - 버튼이 있지만 `href={``}`로 비어있어 동작하지 않음 (132-137줄)
     - `isOwner` 조건 밖에 있어서 판매자에게도 표시됨 (수정 필요)
   - 수정 사항:
     - Server Action을 호출하는 form 또는 버튼으로 변경
     - `!isOwner` 조건 추가하여 판매자에게는 버튼 표시 안 함
     - 로그인하지 않은 사용자도 버튼 표시 안 함 (세션 체크 필요)
     - 버튼 클릭 시 `createChatRoom` Server Action 호출 → 채팅방 생성 또는 기존 채팅방으로 이동
   
   **수정 예시**:
   ```typescript
   // 현재 코드 (132-137줄)
   <Link
     className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold"
     href={``}
   >
     채팅하기
   </Link>
   
   // 수정 후
   {!isOwner && (
     <form action={createChatRoom.bind(null, productId)}>
       <button
         type="submit"
         className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold"
       >
         채팅하기
       </button>
     </form>
   )}
   ```

3. **UI/UX 개선**
   - 메시지 입력 시 자동 스크롤 (최신 메시지로)
   - 메시지 전송 중 로딩 상태 표시
   - 메시지 시간 포맷 개선
   - 반응형 디자인 개선

**파일 생성**: `app/products/[id]/actions.ts`

**Server Action 예시**:
```typescript
"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createChatRoom(productId: number) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  // 상품 정보 조회
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      userId: true, // 판매자 ID
    },
  });

  if (!product) {
    return { error: "상품을 찾을 수 없습니다." };
  }

  // 자신의 상품인지 확인 (이중 체크)
  if (product.userId === session.id) {
    return { error: "자신의 상품에는 채팅할 수 없습니다." };
  }

  // 기존 채팅방 확인
  const existingChatRoom = await db.chatRoom.findFirst({
    where: {
      productId,
      buyerId: session.id,
      sellerId: product.userId,
    },
    select: {
      id: true,
    },
  });

  if (existingChatRoom) {
    revalidatePath("/chat");
    redirect(`/chat/${existingChatRoom.id}`);
    return;
  }

  // 새 채팅방 생성
  const chatRoom = await db.chatRoom.create({
    data: {
      productId,
      buyerId: session.id,
      sellerId: product.userId,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/chat");
  redirect(`/chat/${chatRoom.id}`);
}
```

**파일 수정**: `app/products/[id]/page.tsx`

**수정 예시**:
```typescript
// 파일 상단에 import 추가
import { createChatRoom } from "./actions";

// 기존 코드 (132-137줄) 수정
{!isOwner ? (
  <form action={createChatRoom.bind(null, productId)}>
    <button
      type="submit"
      className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold hover:bg-orange-600 transition-colors"
    >
      채팅하기
    </button>
  </form>
) : null}
```

---

#### ✅ 테스트 체크리스트

- [ ] **채팅방 생성 기능**
  - 상품 상세 페이지에서 "채팅하기" 버튼 클릭
  - 새 채팅방이 생성되고 채팅방 상세 페이지로 이동하는지 확인
  - 이미 채팅방이 있는 경우 기존 채팅방으로 이동하는지 확인

- [ ] **권한 확인**
  - 로그인하지 않은 사용자는 버튼이 표시되지 않는지 확인
  - 자신의 상품에는 버튼이 표시되지 않는지 확인 (또는 적절한 메시지 표시)

- [ ] **UI/UX 개선 확인**
  - 메시지 전송 시 자동 스크롤이 동작하는지 확인
  - 메시지 전송 중 로딩 상태가 표시되는지 확인
  - 메시지 시간 포맷이 읽기 쉽게 표시되는지 확인

- [ ] **채팅방 목록 업데이트 확인**
  - 채팅방 생성 후 채팅방 목록에 새 채팅방이 표시되는지 확인

---

#### 💬 커밋 메시지 제안

```
feat(chat): 채팅방 생성 기능 및 UI/UX 개선

- 상품 상세 페이지에 채팅하기 버튼 추가
- createChatRoom Server Action 구현 (중복 방지 포함)
- 메시지 자동 스크롤 기능 추가
- 메시지 전송 로딩 상태 표시 개선
- 메시지 시간 포맷 개선
```

---

## 기술 스택 및 패턴

### 사용할 기술
- **Server Actions**: 메시지 전송, 조회, 채팅방 생성
- **React Hooks**: `useEffect`, `useState`, `useOptimistic`, `useRef`
- **Next.js**: `revalidatePath`를 통한 캐시 무효화
- **Prisma**: 데이터베이스 쿼리 및 관계 관리
- **Tailwind CSS**: 스타일링

### 참고할 기존 패턴
- `app/posts/[id]/actions.ts`: `createComment` 함수 패턴
- `components/comment-section.tsx`: 낙관적 업데이트 패턴
- `app/posts/add/actions.ts`: Server Action 에러 처리 패턴

---

## 주의사항 및 고려사항

### 보안
- ✅ 모든 Server Action에서 세션 확인
- ✅ 채팅방 접근 권한 확인 (buyer 또는 seller만 접근 가능)
- ✅ 메시지 입력 데이터 검증 및 sanitization
- ✅ SQL Injection 방지 (Prisma 사용으로 자동 방지)

### 성능
- ✅ Polling 간격 조정 가능 (2초는 기본값, 필요시 변경)
- ✅ 메시지 조회 시 인덱스 활용 (`@@index`)
- ✅ 페이지네이션 고려 (메시지가 많을 경우)
- ✅ 불필요한 revalidation 최소화

### 사용자 경험
- ✅ 낙관적 업데이트로 즉각적인 피드백 제공
- ✅ 메시지 전송 중 로딩 상태 표시
- ✅ 자동 스크롤로 최신 메시지 확인 용이
- ✅ 빈 상태 메시지로 사용자 안내

### 확장 가능성
- ✅ 향후 읽음 상태(read/unread) 기능 추가 가능
- ✅ 이미지/파일 전송 기능 추가 가능
- ✅ WebSocket으로 전환 가능 (구조 유지)
- ✅ 채팅방 검색 기능 추가 가능

---

### Step 7: 채팅 알림 뱃지 기능 구현

#### 📝 구현 내용

**목표**: 하단 탭바의 채팅 아이콘에 새로운 채팅이 있을 때 빨간 뱃지 표시

**요구사항**:
- **판매자 입장**: 구매자가 채팅을 시작하면 채팅 아이콘에 빨간 뱃지 표시
- **구매자 입장**: 판매자가 메시지를 보내면 채팅 아이콘에 빨간 뱃지 표시
- 채팅방을 열면 뱃지가 사라짐 (선택사항, 또는 읽지 않은 메시지 수 표시)

**파일 수정/생성**:
- `components/tab-bar.tsx` - 채팅 뱃지 표시 추가
- `components/chat-badge.tsx` - 채팅 뱃지 서버 컴포넌트 (새로 생성)
- `app/(tabs)/layout.tsx` 또는 적절한 레이아웃 파일 - 뱃지 데이터 전달

**구현 사항**:
1. **읽지 않은 채팅방 수 조회 함수** (`getUnreadChatRoomCount`)
   - 현재 사용자가 참여한 채팅방 중 읽지 않은 채팅방 수 조회
   - 판매자 입장: 구매자가 메시지를 보낸 채팅방 수
   - 구매자 입장: 판매자가 메시지를 보낸 채팅방 수
   - 마지막 확인 시간 또는 읽음 상태를 기준으로 판단 (간단한 방법: 채팅방을 열었는지 여부)

2. **간단한 구현 방법 (초기 버전)**:
   - 채팅방 목록 페이지를 방문했는지 여부로 판단
   - 또는 채팅방의 `updated_at`이 사용자의 마지막 확인 시간보다 최신인지 확인
   - 또는 별도의 읽음 상태 테이블 추가 (복잡하므로 초기에는 생략 가능)

3. **뱃지 UI 구현**:
   - 채팅 아이콘 위에 빨간 원형 뱃지 표시
   - 읽지 않은 채팅방 수가 0보다 크면 표시
   - 숫자 표시 (예: "3") 또는 빨간 점만 표시

**데이터 조회 함수 예시 (간단한 버전)**:
```typescript
// app/(tabs)/chat/actions.ts 또는 lib/chat.ts
async function getUnreadChatRoomCount(userId: number) {
  // 방법 1: 채팅방 목록 페이지를 방문했는지 여부로 판단 (쿠키/세션 사용)
  // 방법 2: 채팅방의 updated_at이 최근인지 확인 (예: 1시간 이내)
  // 방법 3: 사용자의 마지막 채팅방 목록 방문 시간 저장 (별도 테이블 필요)
  
  // 간단한 구현: 채팅방이 있고 최근에 업데이트되었으면 알림 표시
  const recentChatRooms = await db.chatRoom.findMany({
    where: {
      OR: [
        { buyerId: userId },
        { sellerId: userId },
      ],
      updated_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24시간 이내
      },
    },
    select: {
      id: true,
      updated_at: true,
      messages: {
        take: 1,
        orderBy: {
          created_at: "desc",
        },
        select: {
          userId: true,
          created_at: true,
        },
      },
    },
  });

  // 자신이 보낸 메시지가 아닌 채팅방만 카운트
  const unreadCount = recentChatRooms.filter((room) => {
    const lastMessage = room.messages[0];
    if (!lastMessage) return false;
    // 마지막 메시지가 상대방이 보낸 것이고, 최근 24시간 이내면 읽지 않은 것으로 간주
    return lastMessage.userId !== userId;
  }).length;

  return unreadCount;
}
```

**뱃지 컴포넌트 예시**:
```typescript
// components/chat-badge.tsx
import { getUnreadChatRoomCount } from "@/app/(tabs)/chat/actions";
import getSession from "@/lib/session";

export default async function ChatBadge() {
  const session = await getSession();
  
  if (!session.id) {
    return null;
  }

  const unreadCount = await getUnreadChatRoomCount(session.id);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
```

**탭바 수정 예시**:
```typescript
// components/tab-bar.tsx
import ChatBadge from "./chat-badge";

export default function TabBar() {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-0 w-full max-w-screen-sm mx-auto bg-neutral-800 border-t border-neutral-700">
      <div className="flex justify-around items-center py-3 *:text-white">
        {/* ... 다른 탭들 ... */}
        <Link href="/chat" className="flex flex-col items-center gap-1 relative">
          {pathname === "/chat" ? (
            <SolidChatIcon className="w-7 h-7" />
          ) : (
            <OutlineChatIcon className="w-7 h-7 text-gray-400" />
          )}
          <ChatBadge />
          <span className={`text-xs ${pathname !== "/chat" && "text-gray-400"}`}>채팅</span>
        </Link>
        {/* ... 다른 탭들 ... */}
      </div>
    </div>
  );
}
```

**더 정교한 구현 (선택사항)**:
- 사용자의 마지막 채팅방 목록 방문 시간을 저장하는 테이블 추가
- 채팅방을 열면 해당 시간 업데이트
- 마지막 방문 시간 이후에 업데이트된 채팅방만 알림 표시

---

#### ✅ 테스트 체크리스트

- [ ] **뱃지 표시 확인**
  - 판매자 계정으로 로그인
  - 구매자가 채팅을 시작하면 채팅 아이콘에 빨간 뱃지가 표시되는지 확인
  - 뱃지에 읽지 않은 채팅방 수가 표시되는지 확인

- [ ] **뱃지 사라짐 확인**
  - 채팅방 목록 페이지를 방문하면 뱃지가 사라지는지 확인
  - 또는 채팅방을 열면 뱃지가 사라지는지 확인 (구현 방법에 따라)

- [ ] **구매자 입장 확인**
  - 구매자 계정으로 로그인
  - 판매자가 메시지를 보내면 뱃지가 표시되는지 확인

- [ ] **빈 상태 확인**
  - 읽지 않은 채팅이 없을 때 뱃지가 표시되지 않는지 확인

---

#### 💬 커밋 메시지 제안

```
feat(chat): 채팅 알림 뱃지 기능 구현

- 하단 탭바 채팅 아이콘에 읽지 않은 채팅방 수 표시
- 판매자 입장에서 구매자 채팅 시작 시 알림 표시
- 구매자 입장에서 판매자 메시지 수신 시 알림 표시
- ChatBadge 서버 컴포넌트 추가
- 읽지 않은 채팅방 수 조회 함수 추가
```

---

## 다음 단계 (선택사항)

구현 완료 후 추가로 고려할 수 있는 기능들:

1. **읽음 상태 기능**
   - 메시지 읽음/안 읽음 표시
   - 읽지 않은 메시지 수 표시

2. **이미지 전송 기능**
   - Cloudinary를 통한 이미지 업로드
   - 이미지 미리보기

3. **채팅방 검색 기능**
   - 상품명 또는 상대방 이름으로 검색

4. **알림 기능**
   - 새 메시지 알림 (브라우저 알림)

5. **메시지 삭제 기능**
   - 자신이 보낸 메시지 삭제

---

## 구현 순서 요약

1. ✅ **Step 1**: 데이터베이스 스키마 설계 및 마이그레이션
2. ✅ **Step 2**: 채팅방 목록 페이지 구현
3. ✅ **Step 3**: 채팅방 상세 페이지 기본 구조
4. ✅ **Step 4**: 메시지 전송 기능 구현
5. ✅ **Step 5**: Polling 로직 구현
6. ✅ **Step 6**: 채팅방 생성 기능 및 UI/UX 개선
7. ✅ **Step 7**: 채팅 알림 뱃지 기능 구현 (하단 탭바)

각 단계마다 테스트를 완료한 후 커밋하고, 다음 단계로 진행하세요.

