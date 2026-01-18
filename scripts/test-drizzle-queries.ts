import "dotenv/config";
import db, { schema } from "../lib/db";
import { eq, desc } from "drizzle-orm";

const { users, products, posts, chatRooms, messages, reviews } = schema;

async function testDrizzleQueries() {
    console.log("=== Drizzle ORM 쿼리 테스트 ===\n");

    try {
        // 1. 사용자 조회 테스트
        console.log("1. 사용자 조회 테스트...");
        const [user] = await db.select({
            id: users.id,
            username: users.username,
            email: users.email,
        })
        .from(users)
        .limit(1);
        
        if (user) {
            console.log(`✅ 사용자 조회 성공: ${user.username} (ID: ${user.id})`);
        } else {
            console.log("⚠️  사용자가 없습니다.");
        }

        // 2. 상품 조회 테스트
        console.log("\n2. 상품 조회 테스트...");
        const productList = await db.select({
            id: products.id,
            title: products.title,
            price: products.price,
            status: products.status,
        })
        .from(products)
        .orderBy(desc(products.created_at))
        .limit(5);
        
        console.log(`✅ 상품 조회 성공: ${productList.length}개`);
        if (productList.length > 0) {
            console.log(`   첫 번째 상품: ${productList[0].title} (${productList[0].price}원)`);
        }

        // 3. 게시글 조회 테스트
        console.log("\n3. 게시글 조회 테스트...");
        const postList = await db.select({
            id: posts.id,
            title: posts.title,
            views: posts.views,
        })
        .from(posts)
        .orderBy(desc(posts.created_at))
        .limit(3);
        
        console.log(`✅ 게시글 조회 성공: ${postList.length}개`);

        // 4. 채팅방 조회 테스트
        console.log("\n4. 채팅방 조회 테스트...");
        const chatRoomCount = await db.select({
            count: schema.chatRooms.id,
        })
        .from(chatRooms);
        
        console.log(`✅ 채팅방 조회 성공: ${chatRoomCount.length}개`);

        // 5. 리뷰 조회 테스트
        console.log("\n5. 리뷰 조회 테스트...");
        const reviewList = await db.select({
            id: reviews.id,
            rating: reviews.rating,
        })
        .from(reviews)
        .limit(3);
        
        console.log(`✅ 리뷰 조회 성공: ${reviewList.length}개`);

        // 6. 관계형 쿼리 테스트 (Drizzle Relational Query)
        console.log("\n6. 관계형 쿼리 테스트 (db.query)...");
        if (user) {
            const userWithProducts = await db.query.users.findFirst({
                where: eq(users.id, user.id),
                with: {
                    products: {
                        limit: 3,
                        columns: {
                            id: true,
                            title: true,
                        },
                    },
                },
                columns: {
                    id: true,
                    username: true,
                },
            });
            
            if (userWithProducts) {
                console.log(`✅ 관계형 쿼리 성공: ${userWithProducts.username}의 상품 ${userWithProducts.products?.length || 0}개`);
            }
        }

        console.log("\n=== 모든 테스트 완료 ===");
        console.log("✅ Drizzle ORM이 정상적으로 작동합니다!");

    } catch (error) {
        console.error("❌ 테스트 실패:", error);
        if (error instanceof Error) {
            console.error("에러 메시지:", error.message);
            console.error("스택:", error.stack);
        }
        process.exit(1);
    }
}

testDrizzleQueries();
