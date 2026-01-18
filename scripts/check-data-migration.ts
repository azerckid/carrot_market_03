import "dotenv/config";
import { createClient } from "@libsql/client";
import { betterSqlite3 } from "better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

// 로컬 SQLite DB 연결
const localDbPath = path.join(process.cwd(), "dev.db");
let localDb: Database.Database | null = null;
try {
    localDb = new Database(localDbPath, { readonly: true });
    console.log(`✅ 로컬 DB 연결 성공: ${localDbPath}`);
} catch (error) {
    console.log(`❌ 로컬 DB 파일이 없거나 접근 불가: ${localDbPath}`);
}

// Turso DB 연결
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
    console.error("❌ TURSO_DATABASE_URL 또는 TURSO_AUTH_TOKEN이 설정되지 않았습니다.");
    process.exit(1);
}

const tursoClient = createClient({
    url: tursoUrl,
    authToken: tursoToken,
});

async function checkDataMigration() {
    console.log("\n=== 로컬 DB ↔ Turso DB 데이터 비교 ===\n");

    const tables = ["User", "Product", "Post", "Comment", "Like", "ChatRoom", "Message", "Review"];

    for (const tableName of tables) {
        console.log(`📊 ${tableName} 테이블 비교:`);
        
        // 로컬 DB 데이터 개수
        let localCount = 0;
        if (localDb) {
            try {
                const result = localDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
                localCount = result.count;
            } catch (error) {
                console.log(`  ⚠️  로컬 DB에서 ${tableName} 테이블을 찾을 수 없습니다.`);
            }
        }

        // Turso DB 데이터 개수
        let tursoCount = 0;
        try {
            const result = await tursoClient.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            if (result.rows.length > 0) {
                tursoCount = (result.rows[0].count as number);
            }
        } catch (error) {
            console.log(`  ⚠️  Turso DB에서 ${tableName} 테이블을 찾을 수 없습니다.`);
        }

        console.log(`  로컬 DB: ${localCount}개`);
        console.log(`  Turso DB: ${tursoCount}개`);

        if (localCount > tursoCount) {
            console.log(`  ⚠️  경고: 로컬 DB에 더 많은 데이터가 있습니다! (${localCount - tursoCount}개 차이)`);
        } else if (localCount < tursoCount) {
            console.log(`  ℹ️  Turso DB에 더 많은 데이터가 있습니다. (${tursoCount - localCount}개 차이)`);
        } else if (localCount === 0 && tursoCount === 0) {
            console.log(`  ℹ️  양쪽 모두 데이터가 없습니다.`);
        } else {
            console.log(`  ✅ 데이터 개수가 일치합니다.`);
        }
        console.log();
    }

    // 정리
    if (localDb) {
        localDb.close();
    }

    console.log("=== 비교 완료 ===\n");
}

checkDataMigration().catch(console.error);
