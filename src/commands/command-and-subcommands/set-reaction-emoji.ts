import { Command, RegisterSubCommand } from '@kaname-png/plugin-subcommands-advanced';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@RegisterSubCommand('gconfig', (builder) =>
	builder
		.setName('set-reaction-emoji')
		.setDescription('Set the emoji used for giveaway entry buttons')
		.addStringOption((option) => option.setName('emoji').setDescription('The emoji to use').setRequired(true))
)
export class ConfigSetReactionEmojiCommand extends Command {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		const guildId = interaction.guild.id;
		const userId = interaction.user.id;
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(guildId);
		const allowedUserIds = config.allowedUserIds ? config.allowedUserIds.split(',') : [];
		const isAllowed = interaction.memberPermissions?.has('ManageGuild') || allowedUserIds.includes(userId);
		if (!isAllowed) {
			return interaction.reply({ content: 'You do not have permission to change the emoji.', ephemeral: true });
		}
		const emoji = interaction.options.getString('emoji', true);
		await this.container.giveawayAPI.updateGuildConfig(guildId, { giveawayEmoji: emoji });
		const embed = new EmbedBuilder()
			.setTitle('Giveaway Emoji Updated')
			.setDescription(`The giveaway entry emoji has been set to: ${emoji}`)
			.setColor(Colors.Blurple);
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
