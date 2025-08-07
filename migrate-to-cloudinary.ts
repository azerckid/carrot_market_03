import "dotenv/config";
import db from "./lib/db";
import cloudinary from "./lib/cloudinary";
import fs from "fs/promises";
import path from "path";

async function migrateToCloudinary() {
    try {
        console.log("마이그레이션 시작...");

        // 모든 제품 가져오기
        const products = await db.product.findMany({
            select: {
                id: true,
                photo: true,
                title: true,
            },
        });

        console.log(`총 ${products.length}개의 제품을 확인했습니다.`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            // 이미 Cloudinary URL인지 확인 (http:// 또는 https://로 시작)
            if (product.photo.startsWith("http://") || product.photo.startsWith("https://")) {
                console.log(`[${product.id}] 이미 Cloudinary URL입니다: ${product.title}`);
                skippedCount++;
                continue;
            }

            // 로컬 경로인 경우 (예: /earphone_01.jpg)
            const localPath = product.photo.startsWith("/")
                ? product.photo.slice(1) // 앞의 / 제거
                : product.photo;

            const filePath = path.join(process.cwd(), "public", localPath);

            try {
                // 파일 존재 확인
                await fs.access(filePath);

                // 파일 읽기
                const fileBuffer = await fs.readFile(filePath);
                const base64 = fileBuffer.toString("base64");

                // 파일 확장자로 MIME 타입 결정
                const ext = path.extname(localPath).toLowerCase();
                const mimeTypes: Record<string, string> = {
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".png": "image/png",
                    ".gif": "image/gif",
                    ".webp": "image/webp",
                };
                const mimeType = mimeTypes[ext] || "image/jpeg";

                const dataURI = `data:${mimeType};base64,${base64}`;

                // Cloudinary에 업로드
                const uploadResult = await cloudinary.uploader.upload(dataURI, {
                    folder: "carrot-market",
                    public_id: `product-${product.id}-${Date.now()}`,
                });

                // 데이터베이스 업데이트
                await db.product.update({
                    where: { id: product.id },
                    data: { photo: uploadResult.secure_url },
                });

                console.log(`[${product.id}] ✅ 마이그레이션 완료: ${product.title}`);
                console.log(`   로컬: ${product.photo} → Cloudinary: ${uploadResult.secure_url}`);
                migratedCount++;

                // API 제한을 피하기 위해 약간의 딜레이
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`[${product.id}] ❌ 오류 발생: ${product.title}`);
                console.error(`   경로: ${filePath}`);
                console.error(`   오류: ${error instanceof Error ? error.message : String(error)}`);
                errorCount++;
            }
        }

        console.log("\n=== 마이그레이션 완료 ===");
        console.log(`✅ 성공: ${migratedCount}개`);
        console.log(`⏭️  건너뜀: ${skippedCount}개 (이미 Cloudinary URL)`);
        console.log(`❌ 실패: ${errorCount}개`);

        await db.$disconnect();
    } catch (error) {
        console.error("마이그레이션 중 오류 발생:", error);
        await db.$disconnect();
        process.exit(1);
    }
}

migrateToCloudinary();

