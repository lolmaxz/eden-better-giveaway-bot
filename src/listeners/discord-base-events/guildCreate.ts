import { Listener } from '@sapphire/framework';
import { Guild } from 'discord.js';
import { ClientEvents } from '../../types/events';

export class GuildCreateListener extends Listener {
	public async run(guild: Guild) {
		this.container.logger.info(`Joined a new guild: ${guild.name} (${guild.id})`);

		/**
		 * Add any logic here that you want to run when the bot joins a new guild.
		 */

		// By example:
		// Emit a custom event when joining a new guild
		this.container.client.emit(ClientEvents.RegisterGuild, guild);
	}
}
