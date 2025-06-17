import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, EmbedBuilder, GuildMember } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class GiveawayEnterButtonHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Button
		});
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('giveaway_enter_')) {
			return this.some();
		}
		return this.none();
	}

	public async run(interaction: ButtonInteraction) {
		const giveawayId = Number(interaction.customId.replace('giveaway_enter_', ''));
		const giveaway = await this.container.giveawayAPI.getGiveawayById(giveawayId);
		if (!giveaway || giveaway.isCompleted) {
			return interaction.reply({ content: 'This giveaway is no longer active.', ephemeral: true });
		}
		if (!interaction.guild) {
			return interaction.reply({ content: 'This giveaway can only be entered in a server.', ephemeral: true });
		}

		// Fetch guild config for eligibleRoles
		const guildConfig = await this.container.giveawayAPI.getOrCreateGuildConfig(interaction.guild.id);
		const eligibleRoles = guildConfig.eligibleRoles
			? guildConfig.eligibleRoles
					.split(',')
					.map((r: string) => r.trim())
					.filter(Boolean)
			: [];
		const member = interaction.member as GuildMember;
		const hasAlwaysEligibleRole = eligibleRoles.length > 0 && member.roles.cache.some((role) => eligibleRoles.includes(role.id));

		// Check if user already entered
		const existingEntry = await this.container.giveawayAPI.getEntryByUser(giveawayId, interaction.user.id);
		if (existingEntry) {
			const embed = new EmbedBuilder()
				.setTitle('Already Participating')
				.setDescription('You are already entered in this giveaway. Would you like to keep your participation or remove it?')
				.setColor(Colors.Blurple);

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setCustomId(`giveaway_keepin_${giveawayId}`).setLabel('Keep my participation in').setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId(`giveaway_remove_${giveawayId}`).setLabel('Remove my participation').setStyle(ButtonStyle.Danger)
			);

			return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
		}

		// If user has an always-eligible role, skip whitelist check
		if (!hasAlwaysEligibleRole && giveaway.whitelistRoles) {
			const requiredRoles = giveaway.whitelistRoles.split(',');
			if (!member.roles.cache.some((role) => requiredRoles.includes(role.id))) {
				const rolesList = requiredRoles
					.map((roleId) => {
						const role = interaction.guild?.roles.cache.get(roleId);
						return role ? `• <@&${role.id}>` : null;
					})
					.filter((role) => role !== null)
					.join('\n');

				if (interaction.guild.id === '734595073920204940') {
					const embed = new EmbedBuilder()
						.setTitle('Entry Requirements')
						.setDescription(
							'❌ You do not have the required role(s) to enter this giveaway.\n\n' +
								'**Required Roles for this Giveaway:**\n' +
								`${rolesList}\n\n` +
								'Members requires to be at least level 10 in the server in order to access giveaways. ' +
								'Some giveaways might not require it, but most of them will.\n\n' +
								'Any Patreon role can grant access to giveaways instantly.\n' +
								'Depending on Patreon level, **additional entries may be granted**.\n\n' +
								'-# More information about active cutie role here: **[How to become an Active Cutie?](https://discord.com/channels/734595073920204940/750582444377243768/1121146629433606154)**'
						)
						.setColor(Colors.Red)
						.setFooter({ text: 'The Eden Apis Giveaway System' });

					const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId('giveaway_eligibility_info')
							.setLabel('More on how to become eligible')
							.setStyle(ButtonStyle.Primary)
					);

					return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
				} else {
					const embed = new EmbedBuilder()
						.setTitle('Entry Requirements')
						.setDescription(
							'❌ You do not have the required role(s) to enter this giveaway.\n\n' +
								'**Required Roles for this Giveaway:**\n' +
								`${rolesList}\n\n` +
								'Please contact a server administrator or check your server rules for more information on how to obtain the required roles.'
						)
						.setColor(Colors.Red)
						.setFooter({ text: 'Giveaway System' });
					return interaction.reply({ embeds: [embed], ephemeral: true });
				}
			}
		}
		// Supporter roles logic
		let extraEntries = 0;
		let supporterMsg = '';
		if (giveaway.useSupporterRoles) {
			const supporterRoles = await this.container.giveawayAPI.listSupporterRoles(interaction.guild.id);
			const member = interaction.member as GuildMember;
			for (const sRole of supporterRoles) {
				if (member.roles.cache.has(sRole.roleId)) {
					extraEntries += sRole.extraEntries;
				}
			}
			if (extraEntries > 0) {
				supporterMsg = ` Thanks to your premium roles, you have **${1 + extraEntries} entries**!`;
			}
		}
		// Log entry
		await this.container.giveawayAPI.addEntry({
			giveawayId,
			userId: interaction.user.id,
			username: interaction.user.username,
			displayName: (interaction.member as GuildMember)?.displayName || interaction.user.username,
			extraEntries
		});

		// Update the entries count in the giveaway message
		try {
			const channel = await interaction.client.channels.fetch(giveaway.channelId);
			if (channel && 'messages' in channel) {
				const msg = await channel.messages.fetch(giveaway.messageId);
				if (msg) {
					let embed = EmbedBuilder.from(msg.embeds[0]);
					let desc = embed.data.description || '';
					// Update the Entries line
					const entries = await this.container.giveawayAPI.listEntriesForGiveaway(giveawayId);
					const entriesLineRegex = /\*\*Entries:\*\*.*\n/;
					desc = desc.replace(entriesLineRegex, `**Entries:** ${entries.length}\n`);
					embed.setDescription(desc);
					await msg.edit({ embeds: [embed], components: msg.components });
				}
			}
		} catch (e) {
			// Ignore message edit errors
		}

		const successEmbed = new EmbedBuilder()
			.setTitle('Entry Confirmed')
			.setDescription(`Your entry has been confirmed!${supporterMsg}`)
			.setColor(Colors.Green)
			.setFooter({ text: 'The Eden Apis Giveaway System' });

		return interaction.reply({ embeds: [successEmbed], ephemeral: true });
	}
}
