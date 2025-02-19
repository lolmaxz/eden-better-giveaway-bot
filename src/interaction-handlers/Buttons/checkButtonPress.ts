import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ExampleButtonInteractionHandler extends InteractionHandler {
	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.includes('Part_Of_Your_Custom_Button_ID')) {
			return this.some();
		}
		return this.none();
	}

	public async run(interaction: ButtonInteraction) {
		// Your code here
		return await interaction.reply({ content: 'This button works!', ephemeral: true });
	}
}
