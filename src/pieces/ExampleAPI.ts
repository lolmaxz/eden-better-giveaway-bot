import type { GuildConfig } from '@prisma/client';
import prisma from '../db';

/**
 * This class contains example API methods that interact with the database.
 * It is also registered in the container to be used in other pieces and anywhere in the bot.
 */
export class ExampleAPI {
	/**
	 * Retrieve the GuildConfig for a given guild ID (including its CustomMessages).
	 * @param guildId The Discord guild/server ID.
	 */
	public async getGuildConfig(guildId: string): Promise<GuildConfig | null> {
		return prisma.guildConfig.findUnique({
			where: { guild_id: guildId }
		});
	}

	/**
	 * Retrieve the GuildConfig for a given guild ID, or create one if it doesn't exist.
	 * @param guildId The Discord guild/server ID.
	 * @param guildName The name of the guild.
	 * @param guildOwnerUserId The Discord user ID of the guild owner.
	 */
	public async getOrCreateGuildConfig(guildId: string, guildName: string, guildOwnerUserId: string): Promise<GuildConfig> {
		let config = await this.getGuildConfig(guildId);
		if (!config) {
			config = await prisma.guildConfig.create({
				data: {
					guild_id: guildId,
					guild_name: guildName,
					guild_owner_user_id: guildOwnerUserId
				}
			});
		}
		return config;
	}

	/**
	 * Update an existing GuildConfig for a given guild ID.
	 * @param guildId The Discord guild/server ID.
	 * @param data A partial GuildConfig object containing the fields to update.
	 */
	public async updateGuildConfig(guildId: string, data: Partial<GuildConfig>): Promise<GuildConfig> {
		return prisma.guildConfig.update({
			where: { guild_id: guildId },
			data
		});
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		exampleAPI: ExampleAPI;
	}
}
