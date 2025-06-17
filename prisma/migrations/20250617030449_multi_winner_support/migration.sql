/*
  Warnings:

  - You are about to drop the column `winnerDisplayName` on the `Giveaway` table. All the data in the column will be lost.
  - You are about to drop the column `winnerUserId` on the `Giveaway` table. All the data in the column will be lost.
  - You are about to drop the column `winnerUsername` on the `Giveaway` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Giveaway" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "prize" TEXT NOT NULL,
    "whitelistRoles" TEXT,
    "extraEntryRoles" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "winnerUserIds" TEXT,
    "winnerUsernames" TEXT,
    "winnerDisplayNames" TEXT,
    "startedByUserId" TEXT NOT NULL,
    "startedByUsername" TEXT,
    "startedByDisplayName" TEXT,
    "useSupporterRoles" BOOLEAN NOT NULL DEFAULT true,
    "winnerCount" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "new_Giveaway" ("channelId", "description", "endTime", "extraEntryRoles", "guildId", "id", "imageUrl", "isCompleted", "messageId", "prize", "startTime", "startedByDisplayName", "startedByUserId", "startedByUsername", "title", "useSupporterRoles", "whitelistRoles") SELECT "channelId", "description", "endTime", "extraEntryRoles", "guildId", "id", "imageUrl", "isCompleted", "messageId", "prize", "startTime", "startedByDisplayName", "startedByUserId", "startedByUsername", "title", "useSupporterRoles", "whitelistRoles" FROM "Giveaway";
DROP TABLE "Giveaway";
ALTER TABLE "new_Giveaway" RENAME TO "Giveaway";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
