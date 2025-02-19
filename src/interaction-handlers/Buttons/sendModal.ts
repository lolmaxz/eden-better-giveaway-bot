import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ExampleButtonInteractionHandler extends InteractionHandler {
	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.includes('SendModal')) {
			return this.some();
		}
		return this.none();
	}

	public async run(interaction: ButtonInteraction) {
		// Your code here
		// Create the modal
		const modal = new ModalBuilder().setCustomId(`MODAL_SUBMISSION_ID`).setTitle(`Example of a Modal`);

		// Add input field
		const messageInput = new TextInputBuilder()
			.setCustomId('message')
			.setPlaceholder('Enter your message here')
			.setLabel('Message to send')
			// .setMinLength(10) // Customize the minimum length of the input
			// .setMaxLength(1000) // Customize the maximum length of the input
			// .setValue('') // Set a default value for the input
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true);

		modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput));

		return await interaction.showModal(modal);
	}
}
