import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { AutocompleteInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class EligibleRolesRemoveAutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction, result: any) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'gconfig') return this.none();
		const subcommandGroup = interaction.options.getSubcommandGroup(false);
		const subcommand = interaction.options.getSubcommand(false);
		if (subcommandGroup !== 'eligible-roles' || subcommand !== 'remove') return this.none();
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name !== 'role') return this.none();
		if (!interaction.guild) return this.none();
		const query = focusedOption.value.toLowerCase();
		const config = await this.container.giveawayAPI.getOrCreateGuildConfig(interaction.guild.id);
		const eligibleRoles = config.eligibleRoles
			? config.eligibleRoles
					.split(',')
					.map((r: string) => r.trim())
					.filter(Boolean)
			: [];
		const choices = eligibleRoles.map((roleId: string) => {
			const role = interaction.guild?.roles.cache.get(roleId);
			return {
				name: role ? `${role.name} (${roleId})` : roleId,
				value: roleId
			};
		});
		const filteredChoices = choices.filter((choice: { name: string; value: string }) => choice.name.toLowerCase().includes(query)).slice(0, 25);
		return this.some(filteredChoices);
	}
}
