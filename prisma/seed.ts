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

  console.log("✅ Seed completed");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
