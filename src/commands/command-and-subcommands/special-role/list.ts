import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@RegisterSubCommandGroup('gconfig', 'special-role', (builder) =>
	builder.setName('list').setDescription('List all special supporter roles for giveaways')
)
export class ConfigSpecialRoleListCommand extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.reply({ content: 'You do not have permission to view special roles.', ephemeral: true });
		}
		const supporterRoles = await this.container.giveawayAPI.listSupporterRoles(guildId);
		const embed = new EmbedBuilder()
			.setTitle('Special Supporter Roles')
			.setDescription(supporterRoles.length ? supporterRoles.map((r) => `<@&${r.roleId}>: +${r.extraEntries} entries`).join('\n') : 'None')
			.setColor(Colors.Blurple);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
