import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { GuildConfig } from '@prisma/client';
import { ActionRowBuilder, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { ErrorReply, InfoReply } from '../../../lib/configEmbeds';

/**
 * This command allows the owner or bot managers to remove a bot manager from the configuration.
 * You can precise if the commands needs to be used by the owner or bot managers.
 *
 * You can register a subcommand group with the `@RegisterSubCommandGroup` decorator.
 * Specify the parent command name and the subcommand group name.
 */
@RegisterSubCommandGroup('config', 'managers', (builder) => builder.setName('delete').setDescription('Remove a bot manager via a selection menu'))
export class ConfigCommandManagersDelete extends Command {
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const guildConfig: GuildConfig | null = await this.getGuildConfig(interaction, true);
		if (!guildConfig) return;

		const managers: string[] = guildConfig.bot_managers ? guildConfig.bot_managers.split(',') : [];
		if (managers.length === 0) {
			return await InfoReply(interaction, 'No bot managers to remove.');
		}

		// for each user id in the managers array, we fetch the username
		// We put it in a map with their ID
		const managerUsernames: Map<string, string> = new Map();
		for (const managerId of managers) {
			const manager = await this.container.client.users.fetch(managerId);
			managerUsernames.set(managerId, manager.username);
		}
		const selectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
			.setCustomId(`remove_manager_${interaction.guildId}`)
			.setPlaceholder('Select a manager to remove')
			.addOptions(
				[...managerUsernames].map(([id, name], index) => ({
					label: `${index + 1}. ${name} - [${id}]`,
					value: id
				}))
			);

		const row: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

		const embed: EmbedBuilder = new EmbedBuilder()
			.setTitle('❌ Remove a Bot Manager')
			.setDescription('Select a bot manager to remove from the dropdown below.')
			.setColor('Red');

		return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
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
