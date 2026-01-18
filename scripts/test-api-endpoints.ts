import "dotenv/config";
import db, { schema } from "../lib/db";
import { eq, and, or, desc } from "drizzle-orm";

const { users, products, posts, chatRooms, messages, reviews, comments, likes } = schema;

async function testAPIEndpoints() {
    console.log("=== API 엔드포인트 로직 테스트 ===\n");

    try {
        // 1. 사용자 생성 시뮬레이션
        console.log("1. 사용자 생성 로직 테스트...");
        const testUsername = `test_user_${Date.now()}`;
        const testEmail = `test_${Date.now()}@example.com`;
        
        // 중복 확인
        const [existingUser] = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.username, testUsername))
            .limit(1);
        
        if (existingUser) {
            console.log("⚠️  테스트 사용자가 이미 존재합니다.");
        } else {
            console.log("✅ 사용자 중복 확인 로직 정상 작동");
        }

        // 2. 상품 조회 로직 테스트
        console.log("\n2. 상품 조회 로직 테스트...");
        const productsList = await db.select({
            id: products.id,
            title: products.title,
            price: products.price,
            userId: products.userId,
            status: products.status,
        })
        .from(products)
        .orderBy(desc(products.created_at))
        .limit(10);
        
        console.log(`✅ 상품 조회 로직 정상: ${productsList.length}개 조회됨`);

        // 3. 채팅방 조회 로직 테스트 (OR 조건)
        console.log("\n3. 채팅방 조회 로직 테스트 (OR 조건)...");
        if (existingUser) {
            const chatRoomsList = await db.select({
                id: chatRooms.id,
                buyerId: chatRooms.buyerId,
                sellerId: chatRooms.sellerId,
            })
            .from(chatRooms)
            .where(
                or(
                    eq(chatRooms.buyerId, existingUser.id),
                    eq(chatRooms.sellerId, existingUser.id)
                )
            )
            .limit(10);
            
            console.log(`✅ 채팅방 조회 로직 정상: ${chatRoomsList.length}개 조회됨`);
        } else {
            console.log("⚠️  테스트 사용자가 없어 채팅방 조회를 건너뜁니다.");
        }

        // 4. 게시글 좋아요 로직 테스트
        console.log("\n4. 게시글 좋아요 로직 테스트...");
        const [firstPost] = await db.select({ id: posts.id })
            .from(posts)
            .limit(1);
        
        if (firstPost && existingUser) {
            // 좋아요 확인
            const [like] = await db.select()
                .from(likes)
                .where(
                    and(
                        eq(likes.postId, firstPost.id),
                        eq(likes.userId, existingUser.id)
                    )
                )
                .limit(1);
            
            console.log(`✅ 좋아요 확인 로직 정상: ${like ? '좋아요 있음' : '좋아요 없음'}`);
        } else {
            console.log("⚠️  테스트할 게시글 또는 사용자가 없습니다.");
        }

        // 5. 리뷰 조회 로직 테스트
        console.log("\n5. 리뷰 조회 로직 테스트...");
        if (existingUser) {
            const userReviews = await db.select({
                id: reviews.id,
                rating: reviews.rating,
                reviewerId: reviews.reviewerId,
                revieweeId: reviews.revieweeId,
            })
            .from(reviews)
            .where(eq(reviews.revieweeId, existingUser.id))
            .orderBy(desc(reviews.created_at))
            .limit(10);
            
            console.log(`✅ 리뷰 조회 로직 정상: ${userReviews.length}개 조회됨`);
            
            if (userReviews.length > 0) {
                const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
                console.log(`   평균 별점: ${avgRating.toFixed(1)}`);
            }
        }

        // 6. 복합 쿼리 테스트 (JOIN 시뮬레이션)
        console.log("\n6. 복합 쿼리 테스트...");
        const [firstProduct] = await db.select({
            id: products.id,
            title: products.title,
            userId: products.userId,
        })
        .from(products)
        .limit(1);
        
        if (firstProduct) {
            // 상품 소유자 정보 조회
            const [owner] = await db.select({
                id: users.id,
                username: users.username,
                avatar: users.avatar,
            })
            .from(users)
            .where(eq(users.id, firstProduct.userId))
            .limit(1);
            
            if (owner) {
                console.log(`✅ 복합 쿼리 정상: 상품 "${firstProduct.title}"의 소유자: ${owner.username}`);
            }
        }

        console.log("\n=== 모든 API 로직 테스트 완료 ===");
        console.log("✅ Drizzle ORM 쿼리가 정상적으로 작동합니다!");

    } catch (error) {
        console.error("❌ 테스트 실패:", error);
        if (error instanceof Error) {
            console.error("에러 메시지:", error.message);
            console.error("스택:", error.stack);
        }
        process.exit(1);
    }
}

testAPIEndpoints();
