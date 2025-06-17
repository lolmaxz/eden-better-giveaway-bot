import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Delete a giveaway',
	requiredUserPermissions: ['ManageGuild'],
	runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export class GiveawayDeleteCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('delete')
				.setDescription('Delete a giveaway')
				.addStringOption((opt) => opt.setName('giveaway').setDescription('Giveaway to delete').setRequired(true).setAutocomplete(true))
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return;
		await interaction.deferReply({ ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.editReply('You do not have permission to delete giveaways.');
		}
		const selected = interaction.options.getString('giveaway', true);
		const giveaway = await this.container.giveawayAPI.getGiveawayById(Number(selected));
		if (!giveaway || giveaway.guildId !== guildId) {
			return interaction.editReply('Invalid giveaway selected.');
		}
		// Delete all entries for this giveaway
		const entries = await this.container.giveawayAPI.listEntriesForGiveaway(giveaway.id);
		for (const entry of entries) {
			await this.container.giveawayAPI.removeEntry(entry.id);
		}
		// Delete the giveaway itself
		await this.container.giveawayAPI.deleteGiveaway(giveaway.id);
		// Stop the timer for this giveaway
		this.container.giveawayTimerManager.stopTimer(giveaway.id);
		// Edit the giveaway message
		try {
			const channel = await interaction.client.channels.fetch(giveaway.channelId);
			if (channel && 'messages' in channel) {
				const msg = await channel.messages.fetch(giveaway.messageId);
				if (msg) {
					let embed = EmbedBuilder.from(msg.embeds[0]);
					let desc = embed.data.description || '';
					desc += '\n\n**[This giveaway has been deleted by a moderator.]**';
					embed.setDescription(desc).setColor(Colors.Red);
					await msg.edit({ embeds: [embed], components: [] });
				}
			}
		} catch (e) {
			// Ignore message edit errors
			this.container.logger.error(e);
		}
		return interaction.editReply('Giveaway deleted successfully.');
	}
}
