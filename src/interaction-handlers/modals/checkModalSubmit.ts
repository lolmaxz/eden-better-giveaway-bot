import { GuildConfig } from '@prisma/client';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { Colors, EmbedBuilder, ModalSubmitInteraction } from 'discord.js';

export class ModalHandlerSubmission extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.ModalSubmit
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId.startsWith('MODAL_SUBMISSION_ID')) {
			return this.some();
		}
		return this.none();
	}

	public async run(interaction: ModalSubmitInteraction) {
		const guildId = interaction.guildId;
		if (!guildId) return;

		// Get the new message from the modal input
		const newMessage = interaction.fields.getTextInputValue('message');

		// Validate input length if needed here

		// Send success response
		await interaction.reply({
			embeds: [new EmbedBuilder().setTitle('✅ Success').setDescription('Your message was sent successfully!').setColor(Colors.Green)],
			ephemeral: true
		});

		const embed = new EmbedBuilder().setTitle('Modal Submitted! Result Here').setDescription(newMessage).setColor(Colors.Blue);

		// send ephemeral followup example with the result

		// Example of a follow-up message to the user after the interaction has been resolved
		// This is particularly useful for providing feedback to the user after the interaction has been resolved, like saying "Thank you for your submission" or "Your message has been updated successfully"
		// This is an ephemeral message, meaning only the user who interacted with the button will see it
		await interaction.followUp({
			content: '✅ Your message was sent successfully!',
			embeds: [embed],
			ephemeral: true
		});

		// If we have a staff log channel, we can send the message there as well
		const guildConfig: GuildConfig | null = await this.container.exampleAPI.getGuildConfig(guildId);
		if (!guildConfig) return;

		await interaction.guild?.channels.fetch();

		const channelId = guildConfig.staff_log_channel_id;
		if (!channelId) return;

		const staffLogChannel = interaction.guild?.channels.cache.get(channelId);
		if (!staffLogChannel || !staffLogChannel.isSendable() || !staffLogChannel.isTextBased()) return; // Check if the channel is valid and sendable

		try {
			return await staffLogChannel.send({ content: 'New message from modal from:' + interaction.user.toString(), embeds: [embed] });
		} catch (error) {
			this.container.logger.warn(`Could not send staff log message to ${staffLogChannel.name} (${staffLogChannel.id})`);
		}

		return;
	}
}
