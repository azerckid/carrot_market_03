import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkSchema() {
    try {
        // 테이블 목록 확인
        const tablesResult = await client.execute(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
        `);
        console.log("\n=== 테이블 목록 ===");
        console.log(tablesResult.rows);

        // 인덱스 목록 확인
        const indexesResult = await client.execute(`
            SELECT name, tbl_name FROM sqlite_master 
            WHERE type='index' AND name NOT LIKE 'sqlite_%'
            ORDER BY tbl_name, name;
        `);
        console.log("\n=== 인덱스 목록 ===");
        console.log(indexesResult.rows);

        // User 테이블 구조 확인
        const userSchemaResult = await client.execute(`PRAGMA table_info(User);`);
        console.log("\n=== User 테이블 구조 ===");
        console.log(userSchemaResult.rows);
    } catch (e) {
        console.error("Error:", e);
    }
}

checkSchema();
