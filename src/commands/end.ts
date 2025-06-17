import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'End a giveaway early',
	requiredUserPermissions: [PermissionFlagsBits.ManageGuild],
	runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export class GiveawayEndCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('end')
				.setDescription('End a giveaway early')
				.addStringOption((opt) => opt.setName('giveaway').setDescription('Giveaway to end').setRequired(true).setAutocomplete(true))
				.addBooleanOption((opt) => opt.setName('select_winner').setDescription('Pick a winner? (default: true)').setRequired(false))
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return;
		await interaction.deferReply({ ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;

		// Check allowed users from guild config
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.editReply('You do not have permission to end giveaways.');
		}

		// List active giveaways for this guild
		const activeGiveaways = await this.container.giveawayAPI.listActiveGiveaways(guildId);
		if (activeGiveaways.length === 0) {
			return interaction.editReply('There are no active giveaways in this server.');
		}

		const selected = interaction.options.getString('giveaway', true);
		const giveaway = activeGiveaways.find((g) => `${g.id}` === selected);
		if (!giveaway) {
			return interaction.editReply('Invalid giveaway selected.');
		}

		const selectWinner = interaction.options.getBoolean('select_winner', false) !== false;

		await this.container.giveawayTimerManager.finishGiveaway(giveaway.id, selectWinner);
		const entries = await this.container.giveawayAPI.listEntriesForGiveaway(giveaway.id);
		if (entries.length === 0) {
			return await interaction.editReply('Giveaway ended with no participants.');
		}
		return await interaction.editReply(selectWinner ? 'Giveaway ended and winner(s) selected!' : 'Giveaway ended with no winner selected.');
	}
}
