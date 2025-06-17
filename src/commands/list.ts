import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'List giveaways for this server',
	runIn: [CommandOptionsRunTypeEnum.GuildText],
	requiredUserPermissions: [PermissionFlagsBits.ManageGuild]
})
export class GiveawayListCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('list')
				.setDescription('List giveaways for this server')
				.addStringOption((opt) =>
					opt
						.setName('filter')
						.setDescription('Filter by status')
						.setRequired(false)
						.addChoices({ name: 'Active', value: 'active' }, { name: 'Completed', value: 'completed' }, { name: 'All', value: 'all' })
				)
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return;
		await interaction.deferReply({ ephemeral: true });
		const guildId = interaction.guild.id;
		const filter = interaction.options.getString('filter', false) ?? 'all';
		let giveaways = [];
		if (filter === 'active') {
			giveaways = await this.container.giveawayAPI.listActiveGiveaways(guildId);
		} else if (filter === 'completed') {
			giveaways = await this.container.giveawayAPI.listCompletedGiveaways(guildId);
		} else {
			const active = await this.container.giveawayAPI.listActiveGiveaways(guildId);
			const completed = await this.container.giveawayAPI.listCompletedGiveaways(guildId);
			giveaways = [...active, ...completed].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
		}
		giveaways = giveaways.slice(0, 10);
		if (giveaways.length === 0) {
			return interaction.editReply('No giveaways found for this server.');
		}
		const embed = new EmbedBuilder().setTitle('Giveaways').setColor(Colors.Blurple).setTimestamp();
		for (const g of giveaways) {
			const start = `<t:${Math.floor(g.startTime.getTime() / 1000)}:d>`;
			const end = `<t:${Math.floor(g.endTime.getTime() / 1000)}:d>`;
			const winnerMentions =
				g.isCompleted && g.winnerUserIds
					? g.winnerUserIds
							.split(',')
							.map((id: string) => `<@${id}>`)
							.join(', ')
					: 'TBD';
			embed.addFields({
				name: `${g.title.length > 40 ? g.title.slice(0, 37) + '...' : g.title} (ID: ${g.id})`,
				value: `**Prize:** ${g.prize}\n**Start:** ${start}\n**End:** ${end}\n**Winner(s):** ${winnerMentions}`,
				inline: false
			});
		}
		return interaction.editReply({ embeds: [embed] });
	}
}
