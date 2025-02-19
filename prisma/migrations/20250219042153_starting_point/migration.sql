-- CreateTable
CREATE TABLE "GuildConfig" (
    "guild_id" TEXT NOT NULL PRIMARY KEY,
    "guild_name" TEXT NOT NULL,
    "guild_owner_user_id" TEXT NOT NULL,
    "bot_managers" TEXT NOT NULL DEFAULT '',
    "staff_log_channel_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
