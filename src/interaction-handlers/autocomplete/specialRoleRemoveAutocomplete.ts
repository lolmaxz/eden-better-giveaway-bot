import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';

export class SpecialRoleRemoveAutocompleteHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete
		});
	}

	public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		// First check if this is the config command
		if (interaction.commandName !== 'gconfig') return this.none();

		// Get the subcommand group and subcommand
		const subcommandGroup = interaction.options.getSubcommandGroup(false);
		const subcommand = interaction.options.getSubcommand(false);

		// Check if we're in the right subcommand group and subcommand
		if (subcommandGroup !== 'special-role' || subcommand !== 'remove') return this.none();

		// Get the focused option
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name !== 'role') return this.none();

		if (!interaction.guild) return this.none();

		const query = focusedOption.value.toLowerCase();
		const supporterRoles = await this.container.giveawayAPI.listSupporterRoles(interaction.guild.id);

		// Log for debugging
		this.container.logger.debug(`[SpecialRoleRemoveAutocomplete] Found ${supporterRoles.length} supporter roles`);

		const choices = await Promise.all(
			supporterRoles.map(async (r) => {
				const role = interaction.guild?.roles.cache.get(r.roleId);
				return {
					name: `${role?.name || 'Unknown Role'} (${r.roleId})`,
					value: r.roleId
				};
			})
		);

		const filteredChoices = choices.filter((choice) => choice.name.toLowerCase().includes(query)).slice(0, 25);

		// Log for debugging
		this.container.logger.debug(`[SpecialRoleRemoveAutocomplete] Returning ${filteredChoices.length} choices`);

		return this.some(filteredChoices);
	}
}
