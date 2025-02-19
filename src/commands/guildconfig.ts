import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

/**
 * A command to get the guild configuration
 * and display it in an embed
 *
 * This is a regular command without subcommands or group commands
 */
@ApplyOptions<Command.Options>({
	description: 'Get the guild configuration',
	requiredUserPermissions: [PermissionFlagsBits.Administrator],
	runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export class GuildConfigCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (interaction.guild === null) return;

		const logger = this.container.logger;
		await interaction.deferReply({ ephemeral: true });

		try {
			const guildId = interaction.guild.id;
			if (guildId === null) return;
			// Get or create a guild config if it doesn't exist yet.
			const config = await this.container.exampleAPI.getOrCreateGuildConfig(guildId, interaction.guild.name, interaction.guild.ownerId);
			// make embed and list all the config

			let stringConfig = '';

			for (const [key, value] of Object.entries(config)) {
				stringConfig += `${key}: ${value}\n`;
			}

			const embed = new EmbedBuilder()
				.setTitle('Guild Configuration for ' + interaction.guild.name)
				.setDescription(stringConfig)
				.setColor(Colors.Green)
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			return logger.error(error);
		}
	}
}
