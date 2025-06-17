import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'About this bot'
})
export class AboutCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => builder.setName('about').setDescription('About this bot'));
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const commands = this.container.stores.get('commands');
		const commandList = commands.map((cmd) => ({
			name: cmd.name,
			description: cmd.description,
			permissions: cmd.options.requiredUserPermissions
		}));

		// Group commands by category
		const categories = {
			'Giveaway Management': ['start', 'end', 'delete', 'reroll', 'list'],
			'Giveaway Information': ['giveawaydetails'],
			Configuration: ['gconfig']
		};

		const embed = new EmbedBuilder()
			.setTitle('About The Eden Apis GiveawayBot')
			.setDescription('A modern, feature-rich Discord giveaway bot made for the community of The Eden Apis. Created by lolmaxz.')
			.addFields({ name: 'Creator', value: 'lolmaxz', inline: true }, { name: 'Community', value: 'The Eden Apis', inline: true })
			.setColor(Colors.Blurple);

		// Add command categories
		for (const [category, commandNames] of Object.entries(categories)) {
			const categoryCommands = commandList
				.filter((cmd) => commandNames.includes(cmd.name))
				.map((cmd) => {
					const permission = cmd.permissions ? '🔒 ' : '';
					return `${permission}\`/${cmd.name}\` - ${cmd.description}`;
				})
				.join('\n');

			if (categoryCommands) {
				embed.addFields({
					name: `${category}`,
					value: categoryCommands,
					inline: false
				});
			}
		}

		// Add configuration subcommands
		const configSubcommands = [
			'`/gconfig special-role add` - Add a special supporter role with extra entries',
			'`/gconfig special-role remove` - Remove a special supporter role',
			'`/gconfig set-reaction-emoji` - Set the emoji used for giveaway entry buttons'
		].join('\n');

		embed.addFields({
			name: 'Configuration Commands',
			value: configSubcommands,
			inline: false
		});

		embed.setFooter({ text: 'Made with ❤️ for The Eden Apis community.' });

		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
}
