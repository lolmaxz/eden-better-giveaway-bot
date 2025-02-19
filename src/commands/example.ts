import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Example command',
	requiredUserPermissions: [PermissionFlagsBits.Administrator], // This command requires the user to have the Administrator permission
	runIn: [CommandOptionsRunTypeEnum.GuildText] // This command will only work in guild text channels
})
export class ExampleCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (interaction.guild === null) return;

		// Sends a little embed with a 2 buttons

		const embed = new EmbedBuilder().setTitle('Example Command').setDescription('This is an example command').setColor(Colors.Blue);

		const testButton = new ButtonBuilder().setCustomId('Part_Of_Your_Custom_Button_ID').setLabel('Test Button').setStyle(ButtonStyle.Success);

		const testModal = new ButtonBuilder().setCustomId('SendModal').setLabel('Send Modal').setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(testButton, testModal);

		return await interaction.reply({ embeds: [embed], components: [row] });
	}
}
