import "dotenv/config";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import path from "path";

// 로컬 SQLite DB 연결 (읽기 전용)
const localDbPath = path.join(process.cwd(), "dev.db");
const localDb = new Database(localDbPath, { readonly: true });

// Turso DB 연결
const tursoUrl = process.env.TURSO_DATABASE_URL!;
const tursoToken = process.env.TURSO_AUTH_TOKEN!;

if (!tursoUrl || !tursoToken) {
    console.error("❌ TURSO_DATABASE_URL 또는 TURSO_AUTH_TOKEN이 설정되지 않았습니다.");
    process.exit(1);
}

const tursoClient = createClient({
    url: tursoUrl,
    authToken: tursoToken,
});

async function migrateData() {
    console.log("=== 로컬 DB → Turso DB 데이터 마이그레이션 시작 ===\n");

    try {
        // FOREIGN KEY 제약조건 일시적으로 비활성화
        await tursoClient.execute("PRAGMA foreign_keys = OFF");
        console.log("ℹ️  FOREIGN KEY 제약조건을 일시적으로 비활성화했습니다.\n");
        // 1. User 테이블 마이그레이션
        console.log("📦 User 테이블 마이그레이션 중...");
        const users = localDb.prepare("SELECT * FROM User").all() as any[];
        
        for (const user of users) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO User (id, username, email, password, phone, github_id, avatar, created_at, updated_at) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        user.id,
                        user.username,
                        user.email || null,
                        user.password || null,
                        user.phone || null,
                        user.github_id || null,
                        user.avatar || null,
                        user.created_at,
                        user.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  User ID ${user.id} 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${users.length}개 사용자 처리 완료\n`);

        // 2. Product 테이블 마이그레이션
        console.log("📦 Product 테이블 마이그레이션 중...");
        const products = localDb.prepare("SELECT * FROM Product").all() as any[];
        
        for (const product of products) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO Product (id, title, description, price, photo, userId, status, soldTo, soldAt, created_at, updated_at) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        product.id,
                        product.title,
                        product.description || null,
                        product.price,
                        product.photo,
                        product.userId,
                        product.status || "판매중",
                        product.soldTo || null,
                        product.soldAt || null,
                        product.created_at,
                        product.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  Product ID ${product.id} 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${products.length}개 상품 처리 완료\n`);

        // 3. Post 테이블 마이그레이션
        console.log("📦 Post 테이블 마이그레이션 중...");
        const posts = localDb.prepare("SELECT * FROM Post").all() as any[];
        
        for (const post of posts) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO Post (id, title, description, views, userId, created_at, updated_at) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        post.id,
                        post.title,
                        post.description || null,
                        post.views || 0,
                        post.userId,
                        post.created_at,
                        post.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  Post ID ${post.id} 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${posts.length}개 게시글 처리 완료\n`);

        // 4. Comment 테이블 마이그레이션
        console.log("📦 Comment 테이블 마이그레이션 중...");
        const comments = localDb.prepare("SELECT * FROM Comment").all() as any[];
        
        for (const comment of comments) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO Comment (id, payload, userId, postId, created_at, updated_at) 
                          VALUES (?, ?, ?, ?, ?, ?)`,
                    args: [
                        comment.id,
                        comment.payload,
                        comment.userId,
                        comment.postId,
                        comment.created_at,
                        comment.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  Comment ID ${comment.id} 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${comments.length}개 댓글 처리 완료\n`);

        // 5. Like 테이블 마이그레이션
        console.log("📦 Like 테이블 마이그레이션 중...");
        const likes = localDb.prepare("SELECT * FROM Like").all() as any[];
        
        for (const like of likes) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO Like (userId, postId, created_at, updated_at) 
                          VALUES (?, ?, ?, ?)`,
                    args: [
                        like.userId,
                        like.postId,
                        like.created_at,
                        like.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  Like (userId: ${like.userId}, postId: ${like.postId}) 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${likes.length}개 좋아요 처리 완료\n`);

        // 6. ChatRoom 테이블 마이그레이션
        console.log("📦 ChatRoom 테이블 마이그레이션 중...");
        const chatRooms = localDb.prepare("SELECT * FROM ChatRoom").all() as any[];
        
        for (const room of chatRooms) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO ChatRoom (id, productId, buyerId, sellerId, created_at, updated_at) 
                          VALUES (?, ?, ?, ?, ?, ?)`,
                    args: [
                        room.id,
                        room.productId,
                        room.buyerId,
                        room.sellerId,
                        room.created_at,
                        room.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  ChatRoom ID ${room.id} 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${chatRooms.length}개 채팅방 처리 완료\n`);

        // 7. Message 테이블 마이그레이션
        console.log("📦 Message 테이블 마이그레이션 중...");
        const messages = localDb.prepare("SELECT * FROM Message").all() as any[];
        
        for (const message of messages) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO Message (id, payload, userId, chatRoomId, created_at, updated_at) 
                          VALUES (?, ?, ?, ?, ?, ?)`,
                    args: [
                        message.id,
                        message.payload,
                        message.userId,
                        message.chatRoomId,
                        message.created_at,
                        message.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  Message ID ${message.id} 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${messages.length}개 메시지 처리 완료\n`);

        // 8. Review 테이블 마이그레이션
        console.log("📦 Review 테이블 마이그레이션 중...");
        const reviews = localDb.prepare("SELECT * FROM Review").all() as any[];
        
        for (const review of reviews) {
            try {
                await tursoClient.execute({
                    sql: `INSERT OR IGNORE INTO Review (id, rating, content, reviewerId, revieweeId, productId, created_at, updated_at) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        review.id,
                        review.rating,
                        review.content || null,
                        review.reviewerId,
                        review.revieweeId,
                        review.productId,
                        review.created_at,
                        review.updated_at,
                    ],
                });
            } catch (error: any) {
                if (!error.message?.includes("UNIQUE constraint")) {
                    console.error(`  ⚠️  Review ID ${review.id} 마이그레이션 실패:`, error.message);
                }
            }
        }
        console.log(`  ✅ ${reviews.length}개 리뷰 처리 완료\n`);

        // FOREIGN KEY 제약조건 다시 활성화
        await tursoClient.execute("PRAGMA foreign_keys = ON");
        console.log("ℹ️  FOREIGN KEY 제약조건을 다시 활성화했습니다.\n");

        console.log("=== 마이그레이션 완료! ===\n");
        console.log("다시 확인하려면: npx tsx scripts/check-data-migration.ts");

    } catch (error) {
        console.error("❌ 마이그레이션 중 오류 발생:", error);
        process.exit(1);
    } finally {
        localDb.close();
    }
}

migrateData();
