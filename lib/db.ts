import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7의 prisma-client provider는 adapter가 필수입니다.
// SQLite를 사용하므로 @prisma/adapter-better-sqlite3를 사용합니다.
const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./dev.db",
});

const db = new PrismaClient({ adapter });

async function test() {
    const token = await db.sMSToken.findUnique({
        where: {
            id: 1,
        },
        include: {
            user: true,
        },
    });
    console.log(token);
}

// 개발 환경에서만 테스트 코드 실행
if (process.env.NODE_ENV === "development") {
    test();
}

export default db;

