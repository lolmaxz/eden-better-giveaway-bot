import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Show detailed entry info for a giveaway',
	runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export class GiveawayDetailsCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('giveawaydetails')
				.setDescription('Show detailed entry info for a giveaway')
				.addStringOption((opt) =>
					opt.setName('giveaway').setDescription('Giveaway to show details for').setRequired(true).setAutocomplete(true)
				)
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
			return interaction.editReply('You do not have permission to view giveaway details.');
		}
		const selected = interaction.options.getString('giveaway', true);
		const giveaway = await this.container.giveawayAPI.getGiveawayById(Number(selected));
		if (!giveaway || giveaway.guildId !== guildId) {
			return interaction.editReply('Invalid giveaway selected.');
		}
		const entries = await this.container.giveawayAPI.listEntriesForGiveaway(giveaway.id);

		// Create the giveaway details embed
		const giveawayDetailsEmbed = new EmbedBuilder()
			.setColor(Colors.Blurple)
			.setTitle(`Giveaway Details: ${giveaway.title}`)
			.setDescription(
				`**Prize:** ${giveaway.prize}\n` +
					`**Started by:** <@${giveaway.startedByUserId}>\n` +
					`**Start Time:** <t:${Math.floor(giveaway.startTime.getTime() / 1000)}:f>\n` +
					`**End Time:** <t:${Math.floor(giveaway.endTime.getTime() / 1000)}:f>\n` +
					`**Status:** ${giveaway.isCompleted ? 'Completed' : 'Active'}\n` +
					`**Winner Count:** ${giveaway.winnerCount}\n` +
					(giveaway.winnerUserIds
						? `**Winners:** ${giveaway.winnerUserIds
								.split(',')
								.map((id) => `<@${id}>`)
								.join(', ')}\n`
						: '') +
					(giveaway.whitelistRoles
						? `**Required Roles:** ${giveaway.whitelistRoles
								.split(',')
								.map((id) => `<@&${id}>`)
								.join(', ')}\n`
						: '') +
					`**Use Supporter Roles:** ${giveaway.useSupporterRoles ? 'Yes' : 'No'}\n` +
					(giveaway.description ? `\n**Description:**\n${giveaway.description}\n` : '') +
					`\n**Total Entries:** ${entries.length}`
			);

		// If there are no entries, just show the giveaway details
		if (entries.length === 0) {
			return interaction.editReply({ embeds: [giveawayDetailsEmbed] });
		}

		// Sort by username
		entries.sort((a, b) => a.username.localeCompare(b.username));
		// Paginate 50 per page
		const pages = Math.ceil(entries.length / 50);
		const paginated = new PaginatedMessage();

		// Add the giveaway details as the first page
		paginated.addPageEmbed(giveawayDetailsEmbed);

		// Add the entries pages
		for (let i = 0; i < pages; i++) {
			const chunk = entries.slice(i * 50, (i + 1) * 50);
			const desc = chunk
				.map((e) => `<@${e.userId}> — ${1 + e.extraEntries} entries — <t:${Math.floor(new Date(e.entryTime).getTime() / 1000)}:d>`)
				.join('\n');
			paginated.addPageEmbed((embed) =>
				embed
					.setColor(Colors.Blurple)
					.setTitle(`Participants for: ${giveaway.title}`)
					.setDescription(desc)
					.setFooter({ text: `Page ${i + 1} of ${pages}` })
			);
		}
		return paginated.run(interaction, interaction.user);
	}
}
