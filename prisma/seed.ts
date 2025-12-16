import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Idempotent seed: add missing habits by name (avoid duplicates on repeated runs).
  const seedHabits = [
    { name: "Drink water", color: "#0ea5e9" },
    { name: "Workout", color: "#f97316" },
    { name: "Read", color: "#22c55e" },
    { name: "Meditate", color: "#a855f7" },
    { name: "Journal", color: "#14b8a6" },
    { name: "Walk 30 min", color: "#84cc16" },
    { name: "Stretch", color: "#f43f5e" },
    { name: "No sugar", color: "#ef4444" },
    { name: "Take vitamins", color: "#eab308" },
    { name: "Practice coding", color: "#3b82f6" },
    { name: "Plan tomorrow", color: "#0f766e" },
    { name: "Clean desk", color: "#64748b" },
    { name: "Sleep 8 hours", color: "#1d4ed8" },
    { name: "Read 10 pages", color: "#16a34a" },
    { name: "Limit social media", color: "#fb7185" },
    { name: "Protein goal", color: "#f59e0b" },
  ];

  const existing = await prisma.habit.findMany({
    select: { name: true },
  });
  const existingNames = new Set(existing.map((h) => h.name));

  const missing = seedHabits.filter((h) => !existingNames.has(h.name));
  if (missing.length === 0) return;

  await prisma.habit.createMany({ data: missing });
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
