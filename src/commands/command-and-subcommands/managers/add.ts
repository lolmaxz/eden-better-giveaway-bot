import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { GuildConfig } from '@prisma/client';
import { ChatInputCommandInteraction, StringSelectMenuInteraction, User } from 'discord.js';
import { ErrorReply, InfoReply, SuccessReply } from '../../../lib/configEmbeds';

@RegisterSubCommandGroup('config', 'managers', (builder) =>
	builder
		.setName('add')
		.setDescription('Add a manager to the bot for the current server')
		.addUserOption((option) => option.setName('manager').setDescription('The user to add as a manager').setRequired(true))
)
export class ConfigCommandManagersAdd extends Command {
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const guild = interaction.guild;
		if (!guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });

		const user: User | null = interaction.options.getUser('manager');
		if (!user) return await interaction.reply({ content: 'Please select a valid user.', ephemeral: true });

		// Example of Getting a Guild Config
		const guildConfig: GuildConfig | null = await this.getGuildConfig(interaction, true);
		if (!guildConfig) return;

		const managers: string[] = guildConfig.bot_managers ? guildConfig.bot_managers.split(',') : [];
		if (managers.includes(user.id)) {
			return await InfoReply(interaction, `<@${user.id}> is already a bot manager.`);
		}

		managers.push(user.id);
		await this.container.exampleAPI.updateGuildConfig(guildConfig.guild_id, { bot_managers: managers.join(',') });

		return await SuccessReply(interaction, `✅ **${user.tag}** has been added as a bot manager.`);
	}

	/** 📜 Utility: Fetch guild config */
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

	/** 📜 Utility: Check if the user is allowed to manage bot settings */
	private hasPermissions(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction, guildConfig: GuildConfig): boolean {
		const userId: string = interaction.user.id;
		const isOwner: boolean = userId === guildConfig.guild_owner_user_id;
		const isManager: boolean = guildConfig.bot_managers?.split(',').includes(userId) || false;

		return isOwner || isManager;
	}
}
