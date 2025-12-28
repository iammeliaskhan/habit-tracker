/*
  Warnings:

  - Made the column `userId` on table `Habit` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" DATETIME,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("archivedAt", "color", "createdAt", "id", "name", "userId") SELECT "archivedAt", "color", "createdAt", "id", "name", "userId" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
