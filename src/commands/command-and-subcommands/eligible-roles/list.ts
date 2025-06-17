import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@RegisterSubCommandGroup('gconfig', 'eligible-roles', (builder) =>
	builder.setName('list').setDescription('List all roles that are always eligible for giveaways')
)
export class ConfigEligibleRolesListCommand extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.reply({ content: 'You do not have permission to view eligible roles.', ephemeral: true });
		}
		const eligibleRoles = config.eligibleRoles
			? config.eligibleRoles
					.split(',')
					.map((r: string) => r.trim())
					.filter(Boolean)
			: [];
		const roleMentions = eligibleRoles
			.map((roleId: string) => {
				const role = interaction.guild?.roles.cache.get(roleId);
				return role ? `<@&${role.id}>` : `Unknown Role (${roleId})`;
			})
			.join('\n');
		const embed = new EmbedBuilder()
			.setTitle('Always Eligible Roles')
			.setDescription(roleMentions.length ? roleMentions : 'No roles are always eligible for giveaways.')
			.setColor(Colors.Blurple);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
