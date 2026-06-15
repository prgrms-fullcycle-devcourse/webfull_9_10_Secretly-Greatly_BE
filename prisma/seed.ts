import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Secret123!", 10);

  await prisma.user.upsert({
    where: {
      email: "testuser@example.com",
    },
    update: {},
    create: {
      email: "testuser@example.com",
      nickname: "test_user",
      password: hashedPassword,
      setting: {
        create: {},
      },
    },
  });

  await prisma.stock.upsert({
    where: {
      code_exchange: {
        code: "005930",
        exchange: "KRX",
      },
    },
    update: {
      name: "삼성전자",
      market: "KR",
      exchangeTimezone: "ASIA_SEOUL",
      assetType: "STOCK",
    },
    create: {
      code: "005930",
      name: "삼성전자",
      market: "KR",
      exchange: "KRX",
      assetType: "STOCK",
      exchangeTimezone: "ASIA_SEOUL",
    },
  });

  console.log("✅ Seed completed");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });