import "dotenv/config";
import { prisma } from "./prisma.js";

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected successfully!");

    const user = await prisma.user.create({
      data: {
        name: "Bob",
        email: "bob@example.com"
      }
    });

    console.log("Created user:", user);

    // Optional: fetch all users
    const users = await prisma.user.findMany();
    console.log("All users:", users);

  } catch (err) {
    console.error("❌ Prisma connection failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
