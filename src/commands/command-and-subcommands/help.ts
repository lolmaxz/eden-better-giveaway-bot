import { Command, RegisterSubCommand } from '@kaname-png/plugin-subcommands-advanced';
import { Colors, EmbedBuilder } from 'discord.js';

@RegisterSubCommand('config', (builder) => builder.setName('help').setDescription('Show help for the bot configuration commands'))
export class ConfigCommandHelp extends Command {
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const embed = new EmbedBuilder()
			.setTitle("📖 All the bot's Command List")
			.setDescription(
				'Below is a list of all available commands grouped by category.\nUse `/config` for all subcommands.\n\n' +
					'**🔹 General Commands**\n' +
					'`/config help` - Show this help menu\n' +
					'`/example` - Example command, shows 2 buttons for testing purpose\n\n' +
					'**🔧 Configuration Commands**\n' +
					'`/config managers view` - View bot managers\n' +
					'`/config managers add <user>` - Add a bot manager\n' +
					'`/config managers remove` - Remove a bot manager\n'
			)
			.setColor(Colors.Blue)
			.setFooter({ text: 'Use the commands above to configure your server.' });

		await interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
