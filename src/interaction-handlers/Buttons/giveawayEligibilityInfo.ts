import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, Colors, EmbedBuilder } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class GiveawayEligibilityInfoButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId === 'giveaway_eligibility_info') {
			return this.some();
		}
		return this.none();
	}

	public async run(interaction: ButtonInteraction) {
		const embed = new EmbedBuilder()
			.setTitle('How to Participate in Giveaways')
			.setDescription(
				'## How do I get the "Active Cutie" role?\n' +
					":arrow_forward: It's simple, you need to talk in server chat more often until you level up enough! You earn exp by participating in chat. More information about this in <#750582444377243768>!\n\n" +
					'## When will I know?\n' +
					':arrow_forward: Our bot will ping you once you receive the role in <#750629926893256704>!\n\n' +
					'## How long does it take?\n' +
					':arrow_forward: You need to reach at least level 10 in the server to receive the Active Cutie role!\n\n' +
					"## I am already above 10 but don't have the role!\n" +
					':arrow_forward: The exp bot only updates once you level up at least once. Next time you level up you will receive the role if you are past level 10 😉\n' +
					"*If you are already past level 10 but don't have the role, you can simply __open a staff ticket__ in <#1106413750975746070> and let us know so we can manually add the role to you!*\n\n" +
					'## Alternative Ways to Access Giveaways\n' +
					':arrow_forward: Any Patreon role can grant you **instant access** to giveaways!\n' +
					':arrow_forward: Depending on your Patreon tier, you may also receive **additional entries** in giveaways.\n' +
					':arrow_forward: Check out our Patreon tiers and benefits in <#979979553726431292>'
			)
			.setColor(Colors.Blue)
			.setFooter({ text: 'The Eden Apis Giveaway System' });

		return interaction.update({ embeds: [embed], components: [], attachments: [] });
	}
}
