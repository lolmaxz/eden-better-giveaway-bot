import { GuildConfig } from '@prisma/client';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { Colors, type StringSelectMenuInteraction } from 'discord.js';

export class RemoveManagerHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu
		});
	}

	public override async parse(interaction: StringSelectMenuInteraction) {
		if (!interaction.customId.startsWith('remove_manager_')) return this.none();
		return this.some();
	}

	public async run(interaction: StringSelectMenuInteraction): Promise<void> {
		const guildId = interaction.guildId;
		if (!guildId) return this.sendError(interaction, 'This command must be used in a server.');

		const guildConfig: GuildConfig | null = await this.container.exampleAPI.getGuildConfig(guildId);
		if (!guildConfig) return this.sendError(interaction, 'No configuration found for this server.');

		// Ensure the user executing this is an admin
		if (!interaction.memberPermissions?.has('Administrator')) {
			return this.sendError(interaction, '❌ You do not have permission to remove bot managers.');
		}

		const selectedUserId: string = interaction.values[0];
		const managers: string[] = guildConfig.bot_managers ? guildConfig.bot_managers.split(',') : [];

		if (!managers.includes(selectedUserId)) {
			return this.sendError(interaction, 'This user is not a bot manager.');
		}

		const updatedManagers: string[] = managers.filter((managerId) => managerId !== selectedUserId);
		await this.container.exampleAPI.updateGuildConfig(guildConfig.guild_id, { bot_managers: updatedManagers.join(',') });

		return this.sendSuccess(interaction, `✅ Removed <@${selectedUserId}> from bot managers.`);
	}

	private async sendError(interaction: StringSelectMenuInteraction, message: string): Promise<void> {
		await interaction.reply({
			embeds: [
				{
					title: '❌ Error',
					description: message,
					color: Colors.Red
				}
			],
			ephemeral: true
		});
	}

	private async sendSuccess(interaction: StringSelectMenuInteraction, message: string): Promise<void> {
		await interaction.reply({
			embeds: [
				{
					title: '✅ Success',
					description: message,
					color: Colors.Green
				}
			],
			ephemeral: true
		});
	}
}
