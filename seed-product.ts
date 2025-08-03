import { PrismaClient } from "./lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const db = new PrismaClient({ adapter });

async function seedProduct() {
  try {
    // userId 2번 확인
    const user = await db.user.findUnique({
      where: { id: 2 },
    });

    if (!user) {
      console.log("User ID 2 not found. Please create user with ID 2 first.");
      await db.$disconnect();
      return;
    }

    console.log(`Using user ID: ${user.id}`);

    // Speaker 제품 추가
    const products = await db.product.createMany({
      data: [
        {
          title: "프리미엄 블루투스 스피커",
          price: 199000,
          photo: "/speaker_01.jpg",
          description: "고품질 사운드를 제공하는 프리미엄 블루투스 스피커입니다. 강력한 베이스와 선명한 고음으로 음악을 생생하게 즐길 수 있습니다. 방수 기능이 있어 실내외 어디서나 사용 가능하며, 24시간 연속 재생이 가능합니다. 우아한 디자인과 뛰어난 음질을 자랑하는 프리미엄 스피커입니다.",
          userId: 2,
        },
        {
          title: "포터블 무선 스피커",
          price: 149000,
          photo: "/speaker_02.jpg",
          description: "휴대하기 편한 포터블 무선 스피커입니다. 컴팩트한 크기지만 강력한 사운드를 제공하며, 블루투스 5.0을 지원하여 안정적인 연결이 가능합니다. 긴 배터리 수명과 빠른 충전 기능을 갖추고 있어 야외 활동이나 여행에 최적화되어 있습니다. 다양한 색상으로 제공됩니다.",
          userId: 2,
        },
        {
          title: "미니 블루투스 스피커",
          price: 89000,
          photo: "/speaker_03.jpg",
          description: "작고 가벼운 미니 블루투스 스피커입니다. 작은 크기지만 놀라운 음질을 제공하며, 한 손에 쏙 들어오는 크기로 어디서나 음악을 즐길 수 있습니다. 360도 사운드를 지원하여 어느 방향에서도 균일한 음질을 경험할 수 있습니다. 합리적인 가격에 고품질을 경험할 수 있습니다.",
          userId: 2,
        },
        {
          title: "파티 스피커",
          price: 249000,
          photo: "/speaker_04.jpg",
          description: "파티와 모임에 최적화된 대형 블루투스 스피커입니다. 강력한 출력으로 넓은 공간에서도 생생한 음악을 즐길 수 있으며, LED 조명이 내장되어 있어 분위기를 더욱 살려줍니다. 마이크 입력을 지원하여 노래방이나 프레젠테이션에도 활용 가능합니다. 내구성이 뛰어나 실내외 모두 사용 가능합니다.",
          userId: 2,
        },
      ],
    });

    console.log("Products created successfully:");
    console.log(`Created ${products.count} speaker products for user ID 2`);

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

