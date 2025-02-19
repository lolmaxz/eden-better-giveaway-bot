import { Command, RegisterSubCommand } from '@kaname-png/plugin-subcommands-advanced';
import { GuildConfig } from '@prisma/client';
import { Colors, EmbedBuilder, TextChannel } from 'discord.js';
import { ErrorReply } from '../../lib/configEmbeds';
import { ClientEvents } from '../../types/events';

/**
 * Example of a subcommand to set the staff log channel for the bot
 * You can easily register a subcommand using the @RegisterSubCommand decorator
 * Just specify the parent command name and the subcommand name
 * You can also add options to the subcommand
 */
@RegisterSubCommand('config', (builder) =>
	builder
		.setName('log-channel')
		.setDescription('Set the staff log channel for the bot')
		.addChannelOption((option) => option.setName('channel').setDescription('Select a text channel for staff logs').setRequired(true))
)
export class ConfigCommandStaffLogChannel extends Command {
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const guildId = interaction.guildId;

		if (!guildId) return await interaction.reply('This command must be used in a server.');

		const channel = interaction.options.getChannel('channel'); // This will return a ChannelResolvable

		// Check if the channel is a valid TextChannel
		if (!channel || !(channel instanceof TextChannel)) {
			return await interaction.reply('Please select a valid text channel.');
		}

		// Example of fetching the guild config from the database using the API and updating the staff log channel

		const guildConfig: GuildConfig | null = await this.container.exampleAPI.getGuildConfig(guildId);
		if (!guildConfig) return await ErrorReply(interaction, 'No configuration found for this server.'); // Example of an error reply, with easy embed creation

		if (guildConfig.staff_log_channel_id === channel.id) {
			return await ErrorReply(interaction, `Staff logs are already being recorded in <#${channel.id}>.`);
		}

		await this.container.exampleAPI.updateGuildConfig(guildId, { staff_log_channel_id: channel.id });

		// ----

		/**
		 * You can add your own logic here to check if the user has the required permissions to set the channel
		 * Get the config from the database and check if the user has the required permissions
		 * You can also check if the bot has the required permissions to send messages in the channel
		 * You can then return an error message if the user does not have the required permissions
		 * or if the bot does not have the required permissions
		 * Make sure the channel is not the same as the current channel, etc.
		 *
		 * You can then update the config in the database with the new channel id
		 *
		 */

		// You could emit a custom event here to update the config in the database
		// this.container.client.emit(ClientEvents.CustomEvent1, guildId, 'staff_log_channel', channel.id);

		// Example of an event emitter
		this.container.client.emit(ClientEvents.Logging, 'Staff log channel has been set to: ' + channel.id);

		// Example of a success reply
		const embed = new EmbedBuilder()
			.setTitle('Staff Log Channel Set')
			.setDescription(`Staff logs will now be recorded in <#${channel.id}>.`)
			.setColor(Colors.Green);

		return await interaction.reply({ embeds: [embed] });
	}
}
