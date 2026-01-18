import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function compareSchemas() {
    try {
        console.log("=== 현재 Turso 데이터베이스 스키마 분석 ===\n");

        // 모든 인덱스 확인
        const indexes = await client.execute(`
            SELECT 
                type, name, tbl_name, sql
            FROM sqlite_master 
            WHERE type IN ('index', 'table')
            AND name NOT LIKE 'sqlite_%'
            ORDER BY type, tbl_name, name;
        `);

        console.log("현재 데이터베이스의 인덱스 및 테이블:");
        indexes.rows.forEach((row: any) => {
            if (row.type === 'index') {
                console.log(`  INDEX: ${row.name} ON ${row.tbl_name}`);
            }
        });

        console.log("\n=== Drizzle 생성 마이그레이션의 인덱스 ===\n");
        console.log("User_username_unique");
        console.log("User_email_unique");
        console.log("User_phone_unique");
        console.log("User_github_id_unique");
        console.log("SMSToken_token_unique");
        console.log("ChatRoom_buyerId_sellerId_productId_unique");
        console.log("Review_reviewerId_productId_unique");

        console.log("\n=== 차이점 분석 ===\n");
        console.log("Prisma 인덱스 형식: User_username_key");
        console.log("Drizzle 인덱스 형식: User_username_unique");
        console.log("\n이름 형식 차이로 인해 drizzle-kit push가 실패합니다.");

    } catch (e) {
        console.error("Error:", e);
    }
}

compareSchemas();
