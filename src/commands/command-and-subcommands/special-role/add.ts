import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { ChatInputCommandInteraction, Colors, EmbedBuilder, Role } from 'discord.js';

@RegisterSubCommandGroup('gconfig', 'special-role', (builder) =>
	builder
		.setName('add')
		.setDescription('Add a special supporter role for giveaways')
		.addRoleOption((option) => option.setName('role').setDescription('The role to add').setRequired(true))
		.addIntegerOption((option) =>
			option.setName('extra_entries').setDescription('Number of extra entries').setRequired(true).setMinValue(1).setMaxValue(10)
		)
)
export class ConfigSpecialRoleAddCommand extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.reply({ content: 'You do not have permission to add special roles.', ephemeral: true });
		}
		const role = interaction.options.getRole('role', true) as Role;
		const extraEntries = interaction.options.getInteger('extra_entries', true);
		await this.container.giveawayAPI.addSupporterRole(guildId, role.id, extraEntries);
		const embed = new EmbedBuilder()
			.setTitle('Special Role Added')
			.setDescription(`Role <@&${role.id}> will now grant +${extraEntries} entries in giveaways!`)
			.setColor(Colors.Blurple);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
