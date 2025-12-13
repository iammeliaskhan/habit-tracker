import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.habit.count();
  if (existing > 0) return;

  await prisma.habit.createMany({
    data: [
      { name: "Drink water", color: "#0ea5e9" },
      { name: "Workout", color: "#f97316" },
      { name: "Read", color: "#22c55e" },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
