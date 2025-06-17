import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@RegisterSubCommandGroup('gconfig', 'special-role', (builder) =>
	builder
		.setName('remove')
		.setDescription('Remove a special supporter role for giveaways')
		.addStringOption((option) => option.setName('role').setDescription('The role to remove').setRequired(true).setAutocomplete(true))
)
export class ConfigSpecialRoleRemoveCommand extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.reply({ content: 'You do not have permission to remove special roles.', ephemeral: true });
		}
		const roleId = interaction.options.getString('role', true);
		const removed = await this.container.giveawayAPI.removeSupporterRole(guildId, roleId);
		const embed = new EmbedBuilder()
			.setTitle(removed ? 'Special Role Removed' : 'Role Not Found')
			.setDescription(
				removed
					? `Role <@&${roleId}> has been removed from special supporter roles.`
					: `Role <@&${roleId}> was not found in special supporter roles.`
			)
			.setColor(removed ? Colors.Blurple : Colors.Red);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
