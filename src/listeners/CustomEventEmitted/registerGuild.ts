import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild } from 'discord.js';
import { ClientEvents } from '../../types/events';

@ApplyOptions<Listener.Options>({ event: ClientEvents.RegisterGuild })
export class RegisterGuildEvent extends Listener {
	public async run(guild: Guild) {
		const owner = await guild.fetchOwner();
		this.container.logger.info(`Registering new guild: ${guild.name} (${guild.id})`);

		// Ensure guild is registered in the database when the bot joins
		await this.container.exampleAPI.getOrCreateGuildConfig(guild.id, guild.name, owner.id);

		// Onboarding Message (Optional)
		const embed = new EmbedBuilder()
			.setTitle('Welcome to this Template Custom Bot!')
			.setDescription(
				'Thank you for adding this Test Bot to your server! 🎉\n\n' +
					'**What you can do next:**\n' +
					'1️⃣ Test the amazing **Button Below**.\n' +
					'2️⃣ Try commands and subcommands like `/config` or `/guildconfig` \n' +
					'3️⃣ Check the code and have fun learning.\n\n' +
					'**Need Help?**\n' +
					'Do `/config help` to see all the available commands and subcommands.\n\n' +
					'Good luck and have fun! 🚀'
			)
			.setColor('Green')
			.setFooter({ text: 'Custom Learning Bot | Have Fun!' })
			.setTimestamp();

		const testButton = new ButtonBuilder().setCustomId('Part_Of_Your_Custom_Button_ID').setLabel('Test Button').setStyle(ButtonStyle.Success);

		const testModal = new ButtonBuilder().setCustomId('SendModal').setLabel('Send Modal').setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(testButton, testModal);

		// Try sending the message to the system channel or the owner
		const systemChannel = guild.systemChannel;
		try {
			// Check if the system channel is sendable and is a text channel before tryingsending the message
			if (systemChannel && systemChannel.isSendable() && systemChannel.isTextBased()) {
				return await systemChannel.send({ embeds: [embed], components: [row] });
			} else {
				return await owner.send({ embeds: [embed], components: [row] }).catch(() => {
					this.container.logger.warn(`Could not DM ${owner.user.tag}`);
				});
			}
		} catch (error) {
			// Log the error if the message could not be sent
			this.container.logger.warn(`Could not send onboarding message to ${guild.name} (${guild.id})`);
			return;
		}
	}
}
