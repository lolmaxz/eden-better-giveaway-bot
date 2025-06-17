import { Command, RegisterSubCommandGroup } from '@kaname-png/plugin-subcommands-advanced';
import { ChatInputCommandInteraction, Colors, EmbedBuilder, Role } from 'discord.js';

@RegisterSubCommandGroup('gconfig', 'eligible-roles', (builder) =>
	builder
		.setName('add')
		.setDescription('Add a role that is always eligible to participate in giveaways')
		.addRoleOption((option) => option.setName('role').setDescription('The role to add').setRequired(true))
)
export class ConfigEligibleRolesAddCommand extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.reply({ content: 'You do not have permission to add eligible roles.', ephemeral: true });
		}
		const role = interaction.options.getRole('role', true) as Role;
		const eligibleRoles = config.eligibleRoles
			? config.eligibleRoles
					.split(',')
					.map((r: string) => r.trim())
					.filter(Boolean)
			: [];
		if (eligibleRoles.includes(role.id)) {
			return interaction.reply({ content: `Role <@&${role.id}> is already in the eligible roles list.`, ephemeral: true });
		}
		eligibleRoles.push(role.id);
		await this.container.giveawayAPI.updateGuildConfig(guildId, { eligibleRoles: eligibleRoles.join(',') });
		const embed = new EmbedBuilder()
			.setTitle('Eligible Role Added')
			.setDescription(`Role <@&${role.id}> will now always be eligible to participate in giveaways!`)
			.setColor(Colors.Blurple);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
