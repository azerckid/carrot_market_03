import "dotenv/config";
import { PrismaClient } from "./lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import cloudinary from "./lib/cloudinary";
import fs from "fs/promises";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const db = new PrismaClient({ adapter });

async function uploadImageToCloudinary(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const base64 = fileBuffer.toString("base64");
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    const mimeType = mimeTypes[ext] || "image/jpeg";
    
    const dataURI = `data:${mimeType};base64,${base64}`;
    
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "carrot-market",
    });
    
    return uploadResult.secure_url;
  } catch (error) {
    console.error(`이미지 업로드 실패: ${filePath}`, error);
    throw error;
  }
}

async function seedProduct() {
  try {
    // userId 3번 확인
    const user = await db.user.findUnique({
      where: { id: 3 },
    });

    if (!user) {
      console.log("User ID 3 not found. Please create user with ID 3 first.");
      await db.$disconnect();
      return;
    }

    console.log(`Using user ID: ${user.id}`);

    // 이미지 파일 경로 정의
    const imageFiles = [
      "earphone_01.jpg",
      "earphone_02.jpg",
      "earphone_03.jpg",
      "earphone_04.jpg",
      "earphone_05.jpg",
    ];

    // Cloudinary에 이미지 업로드
    console.log("Cloudinary에 이미지 업로드 중...");
    const cloudinaryUrls: string[] = [];
    for (const imageFile of imageFiles) {
      const filePath = path.join(process.cwd(), "public", imageFile);
      try {
        const url = await uploadImageToCloudinary(filePath);
        cloudinaryUrls.push(url);
        console.log(`✅ ${imageFile} 업로드 완료`);
        // API 제한을 피하기 위해 약간의 딜레이
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ ${imageFile} 업로드 실패:`, error);
        throw error;
      }
    }

    // Earphone 제품 추가
    const products = await db.product.createMany({
      data: [
        {
          title: "프리미엄 무선 이어폰",
          price: 179000,
          photo: cloudinaryUrls[0],
          description: "고음질 무선 이어폰입니다. 액티브 노이즈 캔슬링 기능이 탑재되어 있어 외부 소음을 효과적으로 차단합니다. 30시간 연속 재생이 가능하며, 빠른 충전 기능을 지원합니다. 편안한 착용감과 뛰어난 음질을 자랑하는 프리미엄 이어폰입니다. 운동 중에도 안정적으로 착용할 수 있습니다.",
          userId: 3,
        },
        {
          title: "스포츠 무선 이어폰",
          price: 129000,
          photo: cloudinaryUrls[1],
          description: "운동에 최적화된 스포츠 무선 이어폰입니다. 방수 및 방진 기능이 있어 땀과 비에 강하며, 안정적인 착용감으로 격렬한 운동 중에도 떨어지지 않습니다. 강력한 베이스와 선명한 음질을 제공하며, 25시간 연속 재생이 가능합니다. 다양한 이어팁이 포함되어 있어 개인에 맞게 조절할 수 있습니다.",
          userId: 3,
        },
        {
          title: "경량 블루투스 이어폰",
          price: 89000,
          photo: cloudinaryUrls[2],
          description: "가볍고 휴대하기 편한 블루투스 이어폰입니다. 컴팩트한 디자인으로 휴대성이 뛰어나며, 20시간의 긴 배터리 수명을 자랑합니다. 통화 품질이 우수하여 업무용으로도 적합합니다. 빠른 페어링과 안정적인 연결을 지원하며, 다양한 색상으로 제공됩니다. 합리적인 가격에 고품질을 경험할 수 있습니다.",
          userId: 3,
        },
        {
          title: "노이즈 캔슬링 이어폰",
          price: 159000,
          photo: cloudinaryUrls[3],
          description: "고급 노이즈 캔슬링 기술이 적용된 무선 이어폰입니다. 주변 소음을 효과적으로 차단하여 집중력 있는 음악 감상을 가능하게 합니다. 투명 모드를 지원하여 필요시 주변 소리를 들을 수 있습니다. 28시간 연속 재생이 가능하며, 무선 충전 케이스를 포함하고 있습니다. 프리미엄 품질의 사운드를 제공합니다.",
          userId: 3,
        },
        {
          title: "베이스 강화 이어폰",
          price: 109000,
          photo: cloudinaryUrls[4],
          description: "강력한 베이스를 제공하는 무선 이어폰입니다. 댄스 음악과 힙합을 즐기는 분들에게 최적화되어 있으며, 깊고 풍부한 저음을 경험할 수 있습니다. 22시간 연속 재생이 가능하며, 빠른 충전 기능을 지원합니다. 편안한 착용감과 뛰어난 음질을 자랑합니다. 합리적인 가격에 고품질 사운드를 즐길 수 있습니다.",
          userId: 3,
        },
      ],
    });

    console.log("Products created successfully:");
    console.log(`Created ${products.count} earphone products for user ID 3`);

    // 모든 제품 조회
    const allProducts = await db.product.findMany();
    console.log(`\nTotal products: ${allProducts.length}`);

    await db.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await db.$disconnect();
    process.exit(1);
  }
}

seedProduct();

