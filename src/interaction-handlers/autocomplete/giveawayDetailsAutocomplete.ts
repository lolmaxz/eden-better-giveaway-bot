import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';

export class GiveawayDetailsAutocompleteHandler extends InteractionHandler {
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
		if (interaction.commandName !== 'giveawaydetails') return this.none();
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name !== 'giveaway') return this.none();
		if (!interaction.guild) return this.none();
		const query = focusedOption.value;
		const active = await this.container.giveawayAPI.listActiveGiveaways(interaction.guild.id);
		const completed = await this.container.giveawayAPI.listCompletedGiveaways(interaction.guild.id);
		const all = [...active, ...completed].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 10);
		const choices = all
			.map((g) => ({
				name: `${g.title.length > 40 ? g.title.slice(0, 37) + '...' : g.title} (ID: ${g.id})`,
				value: `${g.id}`
			}))
			.filter((choice) => choice.name.toLowerCase().includes(query.toLowerCase()))
			.slice(0, 10);
		return this.some(choices);
	}
}
