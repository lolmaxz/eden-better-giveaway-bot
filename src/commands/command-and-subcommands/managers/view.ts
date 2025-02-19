import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { GuildConfig } from '@prisma/client';
import { ChatInputCommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { ErrorReply, InfoReply } from '../../../lib/configEmbeds';

/**
 * View the current managers configuration of the bot for the current server 📋
 *
 */
@RegisterSubCommandGroup('config', 'managers', (builder) =>
	builder.setName('view').setDescription('View the current managers configuration of the bot for the current server')
)
export class ConfigCommandManagersView extends Command {
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const guildConfig: GuildConfig | null = await this.getGuildConfig(interaction);
		if (!guildConfig) return;

		const managers: string[] = guildConfig.bot_managers ? guildConfig.bot_managers.split(',') : [];
		if (managers.length === 0) {
			return await InfoReply(interaction, 'No bot managers have been assigned.');
		}

		const managerList: string = managers.map((managerId) => `<@${managerId}>`).join('\n');

		return await InfoReply(interaction, `📋 **Bot Managers**\n${managerList}`);
	}

	private async getGuildConfig(interaction: ChatInputCommandInteraction, enforcePermissions: boolean = false): Promise<GuildConfig | null> {
		const guildId: string | null = interaction.guildId;
		if (!guildId) {
			await ErrorReply(interaction, 'This command must be used in a server.');
			return null;
		}

		const guildConfig: GuildConfig | null = await this.container.exampleAPI.getGuildConfig(guildId);
		if (!guildConfig) {
			await ErrorReply(interaction, 'No configuration found for this server.');
			return null;
		}

		if (enforcePermissions && !this.hasPermissions(interaction, guildConfig)) {
			await ErrorReply(interaction, '❌ You do not have permission to manage bot settings.');
			return null;
		}

		return guildConfig;
	}

	private hasPermissions(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction, guildConfig: GuildConfig): boolean {
		const userId: string = interaction.user.id;
		const isOwner: boolean = userId === guildConfig.guild_owner_user_id;
		const isManager: boolean = guildConfig.bot_managers?.split(',').includes(userId) || false;

		return isOwner || isManager;
	}
}
