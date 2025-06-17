import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@RegisterSubCommandGroup('gconfig', 'eligible-roles', (builder) =>
	builder
		.setName('remove')
		.setDescription('Remove a role from the always eligible list')
		.addStringOption((option) => option.setName('role').setDescription('The role to remove').setRequired(true).setAutocomplete(true))
)
export class ConfigEligibleRolesRemoveCommand extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.reply({ content: 'You do not have permission to remove eligible roles.', ephemeral: true });
		}
		const roleId = interaction.options.getString('role', true);
		const eligibleRoles = config.eligibleRoles
			? config.eligibleRoles
					.split(',')
					.map((r: string) => r.trim())
					.filter(Boolean)
			: [];
		const index = eligibleRoles.indexOf(roleId);
		if (index === -1) {
			return interaction.reply({ content: `Role <@&${roleId}> is not in the eligible roles list.`, ephemeral: true });
		}
		eligibleRoles.splice(index, 1);
		await this.container.giveawayAPI.updateGuildConfig(guildId, { eligibleRoles: eligibleRoles.join(',') });
		const embed = new EmbedBuilder()
			.setTitle('Eligible Role Removed')
			.setDescription(`Role <@&${roleId}> has been removed from the always eligible list.`)
			.setColor(Colors.Blurple);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
