import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Reroll the winner(s) for a completed giveaway',
	requiredUserPermissions: [PermissionFlagsBits.ManageGuild],
	runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export class GiveawayRerollCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('reroll')
				.setDescription('Reroll the winner(s) for a completed giveaway')
				.addStringOption((opt) => opt.setName('giveaway').setDescription('Giveaway to reroll').setRequired(true).setAutocomplete(true))
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
			return interaction.editReply('You do not have permission to reroll giveaways.');
		}

		// List completed giveaways for this guild
		const completedGiveaways = await this.container.giveawayAPI.listCompletedGiveaways(guildId);
		if (completedGiveaways.length === 0) {
			return interaction.editReply('There are no completed giveaways in this server.');
		}

		const selected = interaction.options.getString('giveaway', true);
		const giveaway = completedGiveaways.find((g) => `${g.id}` === selected);
		if (!giveaway) {
			return interaction.editReply('Invalid giveaway selected.');
		}

		// Get all entries
		const entries = await this.container.giveawayAPI.listEntriesForGiveaway(giveaway.id);
		if (entries.length === 0) {
			return interaction.editReply('There are no entries to pick from.');
		}

		// Exclude previous winners
		const prevWinnerIds = giveaway.winnerUserIds ? giveaway.winnerUserIds.split(',') : [];
		const eligibleEntries = entries.filter((e) => !prevWinnerIds.includes(e.userId));
		if (eligibleEntries.length === 0) {
			return interaction.editReply('There are no eligible entries to reroll from.');
		}

		// Weighted random pick for multiple winners
		const pool: typeof eligibleEntries = [];
		for (const entry of eligibleEntries) {
			pool.push(...Array(1 + entry.extraEntries).fill(entry));
		}
		const winnerList: { userId: string; displayName: string; username: string }[] = [];
		const uniqueWinners = new Set<string>();
		while (winnerList.length < giveaway.winnerCount && pool.length > 0) {
			const idx = Math.floor(Math.random() * pool.length);
			const picked = pool[idx];
			if (!uniqueWinners.has(picked.userId)) {
				winnerList.push({ userId: picked.userId, displayName: picked.displayName, username: picked.username });
				uniqueWinners.add(picked.userId);
			}
			// Remove all instances of this user from the pool
			for (let i = pool.length - 1; i >= 0; i--) {
				if (pool[i].userId === picked.userId) pool.splice(i, 1);
			}
		}
		if (winnerList.length === 0) {
			return interaction.editReply('Could not pick any new winners.');
		}

		// Update the giveaway in the DB
		await this.container.giveawayAPI.markGiveawayCompleted(
			giveaway.id,
			winnerList.map((w) => w.userId),
			winnerList.map((w) => w.displayName),
			winnerList.map((w) => w.username)
		);

		// Edit the giveaway message
		try {
			const channel = await interaction.client.channels.fetch(giveaway.channelId);
			if (channel && 'messages' in channel) {
				const msg = await channel.messages.fetch(giveaway.messageId);
				if (msg) {
					let embed = EmbedBuilder.from(msg.embeds[0]);
					embed.setColor(Colors.Orange);
					let desc = embed.data.description || '';
					// Replace the Winners line with the new winners
					const winnerLineRegex = /\*\*Winners:\*\*.*\n/;
					const winnerMentions = winnerList.map((w) => `<@${w.userId}>`).join(', ');
					desc = desc.replace(winnerLineRegex, `**Winners:** ${winnerMentions}\n`);
					desc += `\n:tada: Congratulations to the new winner${winnerList.length > 1 ? 's' : ''}! (Rerolled)`;
					embed.setDescription(desc);
					await msg.edit({ embeds: [embed], components: [] });
				}
			}
		} catch (e) {
			// Ignore message edit errors
		}

		return await interaction.editReply(
			`Rerolled by <@${interaction.user.id}>! New winner${winnerList.length > 1 ? 's' : ''}: ${winnerList.map((w) => `<@${w.userId}>`).join(', ')}`
		);
	}
}
