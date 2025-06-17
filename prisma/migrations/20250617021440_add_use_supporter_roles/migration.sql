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
    "winnerUserId" TEXT,
    "winnerUsername" TEXT,
    "winnerDisplayName" TEXT,
    "startedByUserId" TEXT NOT NULL,
    "startedByUsername" TEXT,
    "startedByDisplayName" TEXT,
    "useSupporterRoles" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Giveaway" ("channelId", "description", "endTime", "extraEntryRoles", "guildId", "id", "imageUrl", "isCompleted", "messageId", "prize", "startTime", "startedByDisplayName", "startedByUserId", "startedByUsername", "title", "whitelistRoles", "winnerDisplayName", "winnerUserId", "winnerUsername") SELECT "channelId", "description", "endTime", "extraEntryRoles", "guildId", "id", "imageUrl", "isCompleted", "messageId", "prize", "startTime", "startedByDisplayName", "startedByUserId", "startedByUsername", "title", "whitelistRoles", "winnerDisplayName", "winnerUserId", "winnerUsername" FROM "Giveaway";
DROP TABLE "Giveaway";
ALTER TABLE "new_Giveaway" RENAME TO "Giveaway";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
