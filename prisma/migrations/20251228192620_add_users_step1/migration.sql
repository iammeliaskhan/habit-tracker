-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" DATETIME,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("archivedAt", "color", "createdAt", "id", "name") SELECT "archivedAt", "color", "createdAt", "id", "name" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
