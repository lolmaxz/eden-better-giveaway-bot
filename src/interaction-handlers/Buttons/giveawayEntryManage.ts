import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class GiveawayEntryManageButtonHandler extends InteractionHandler {
	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('giveaway_keepin_') || interaction.customId.startsWith('giveaway_remove_')) {
			return this.some();
		}
		return this.none();
	}

	public async run(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('giveaway_keepin_')) {
			const embed = {
				title: 'Participation Kept',
				description: 'Your participation has been kept in the giveaway!',
				color: 0x5865f2
			};
			return interaction.update({ embeds: [embed], components: [] });
		}
		if (interaction.customId.startsWith('giveaway_remove_')) {
			const giveawayId = Number(interaction.customId.replace('giveaway_remove_', ''));

			// Check if giveaway has ended
			const giveaway = await this.container.giveawayAPI.getGiveawayById(giveawayId);
			if (!giveaway || giveaway.isCompleted) {
				const embed = {
					title: 'Giveaway Ended',
					description: 'This giveaway has already ended. You cannot remove your entry.',
					color: 0xed4245
				};
				return interaction.update({ embeds: [embed], components: [] });
			}

			const entry = await this.container.giveawayAPI.getEntryByUser(giveawayId, interaction.user.id);
			if (!entry) {
				const embed = {
					title: 'Not Entered',
					description: 'You are not currently entered in this giveaway.',
					color: 0xed4245
				};
				return interaction.update({ embeds: [embed], components: [] });
			}
			const removed = await this.container.giveawayAPI.removeEntry(entry.id);
			if (!removed) {
				const embed = {
					title: 'Error',
					description: 'Failed to remove your participation. Please try again later.',
					color: 0xed4245
				};
				return interaction.update({ embeds: [embed], components: [] });
			}
			// Update the entries count in the giveaway message
			try {
				const giveaway = await this.container.giveawayAPI.getGiveawayById(giveawayId);
				if (giveaway) {
					const channel = await interaction.client.channels.fetch(giveaway.channelId);
					if (channel && 'messages' in channel) {
						const msg = await channel.messages.fetch(giveaway.messageId);
						if (msg) {
							let embed = msg.embeds[0] ? EmbedBuilder.from(msg.embeds[0]) : undefined;
							if (embed) {
								let desc = embed.data.description || '';
								const entries = await this.container.giveawayAPI.listEntriesForGiveaway(giveawayId);
								const entriesLineRegex = /\*\*Entries:\*\*.*\n/;
								desc = desc.replace(entriesLineRegex, `**Entries:** ${entries.length}\n`);
								embed.setDescription(desc);
								await msg.edit({ embeds: [embed], components: msg.components });
							}
						}
					}
				}
			} catch (e) {
				// Ignore message edit errors
			}
			const embed = {
				title: 'Participation Removed',
				description: 'Your participation has been removed from the giveaway.',
				color: 0x5865f2
			};
			return interaction.update({ embeds: [embed], components: [] });
		}
		return;
	}
}
