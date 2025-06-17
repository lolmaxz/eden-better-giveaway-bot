import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	PermissionFlagsBits,
	Role
} from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Start a new giveaway',
	requiredUserPermissions: [PermissionFlagsBits.ManageGuild],
	runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export class GiveawayStartCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('start')
				.setDescription('Start a new giveaway')
				.addStringOption((opt) => opt.setName('title').setDescription('Giveaway title').setRequired(true).setMaxLength(256))
				.addStringOption((opt) => opt.setName('duration').setDescription('Duration (e.g. 2h30m)').setRequired(true).setMaxLength(32))
				.addIntegerOption((opt) =>
					opt.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(10)
				)
				.addStringOption((opt) => opt.setName('prize').setDescription('Prize').setRequired(true).setMaxLength(1024))
				.addStringOption((opt) => opt.setName('description').setDescription('Giveaway description').setRequired(false).setMaxLength(2000))
				.addStringOption((opt) => opt.setName('image_url').setDescription('Image URL (optional)').setRequired(false).setMaxLength(512))
				.addAttachmentOption((opt) => opt.setName('image_attachment').setDescription('Image attachment (optional)').setRequired(false))
				.addStringOption((opt) =>
					opt.setName('thumbnail_url').setDescription('Thumbnail URL (optional)').setRequired(false).setMaxLength(512)
				)
				.addAttachmentOption((opt) =>
					opt.setName('thumbnail_attachment').setDescription('Thumbnail attachment (optional)').setRequired(false)
				)
				.addRoleOption((opt) => opt.setName('whitelist_role_1').setDescription('Whitelist role 1 (optional)').setRequired(false))
				.addRoleOption((opt) => opt.setName('whitelist_role_2').setDescription('Whitelist role 2 (optional)').setRequired(false))
				.addRoleOption((opt) => opt.setName('whitelist_role_3').setDescription('Whitelist role 3 (optional)').setRequired(false))
				.addRoleOption((opt) => opt.setName('whitelist_role_4').setDescription('Whitelist role 4 (optional)').setRequired(false))
				.addRoleOption((opt) => opt.setName('whitelist_role_5').setDescription('Whitelist role 5 (optional)').setRequired(false))
				.addBooleanOption((opt) =>
					opt.setName('use_supporter_roles').setDescription('Allow supporter roles for extra entries? (default: true)').setRequired(false)
				)
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) return;
		await interaction.deferReply({ ephemeral: true });

		const title = interaction.options.getString('title', true);
		const description = interaction.options.getString('description', false) || '';
		const durationStr = interaction.options.getString('duration', true);
		const prize = interaction.options.getString('prize', true);
		const imageUrl = interaction.options.getString('image_url', false);
		const imageAttachment = interaction.options.getAttachment('image_attachment', false);
		const thumbnailUrl = interaction.options.getString('thumbnail_url', false);
		const thumbnailAttachment = interaction.options.getAttachment('thumbnail_attachment', false);
		const whitelistRoles: string[] = [];
		for (let i = 1; i <= 5; i++) {
			const role = interaction.options.getRole(`whitelist_role_${i}`, false) as Role | null;
			if (role) whitelistRoles.push(role.id);
		}
		const useSupporterRoles = interaction.options.getBoolean('use_supporter_roles', false);
		const winnerCount = interaction.options.getInteger('winners', true);

		// Parse duration string (e.g. 2h30m)
		const durationMs = this.parseDuration(durationStr);
		if (!durationMs || durationMs < 10000) {
			return interaction.editReply('Invalid duration. Please use a format like 2h30m, and minimum 10 seconds.');
		}
		const now = new Date();
		const endTime = new Date(now.getTime() + durationMs);

		// Use image URL or attachment
		let finalImageUrl: string | null = imageUrl ?? null;
		if (!finalImageUrl && imageAttachment) {
			finalImageUrl = imageAttachment.url;
		}

		// Use thumbnail URL or attachment
		let finalThumbnailUrl: string | null = thumbnailUrl ?? null;
		if (!finalThumbnailUrl && thumbnailAttachment) {
			finalThumbnailUrl = thumbnailAttachment.url;
		}

		// Determine display name
		let displayName =
			interaction.member && 'nickname' in interaction.member && interaction.member.nickname
				? interaction.member.nickname
				: (interaction.user.displayName ?? interaction.user.username);

		// Store in DB
		const giveaway = await this.container.giveawayAPI.createGiveaway({
			guildId: interaction.guild.id,
			channelId: interaction.channelId,
			messageId: '', // To be set after sending the message
			title,
			description,
			imageUrl: finalImageUrl,
			thumbnailUrl: finalThumbnailUrl,
			prize,
			whitelistRoles: whitelistRoles.length > 0 ? whitelistRoles.join(',') : null,
			extraEntryRoles: null, // To be implemented
			startTime: now,
			endTime,
			startedByUserId: interaction.user.id,
			startedByUsername: interaction.user.username,
			startedByDisplayName: displayName,
			useSupporterRoles: useSupporterRoles !== false, // default to true
			winnerCount,
			winnerUserIds: null,
			winnerUsernames: null,
			winnerDisplayNames: null
		});

		// Start the timer for this giveaway
		await this.container.giveawayTimerManager.startTimer({ ...giveaway, messageId: '' });

		// Build the embed description to match the template
		let embedDescription = description ? `${description.slice(0, 2000)}\n\n` : '';
		embedDescription += `**Ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R> (<t:${Math.floor(endTime.getTime() / 1000)}:f>)\n`;
		embedDescription += `**Hosted by:** <@${interaction.user.id}>\n`;
		embedDescription += `**Entries:** 0\n`;
		embedDescription += `**Winners:** ${winnerCount}\n`;

		if (whitelistRoles.length > 0) {
			embedDescription += `**Required Roles:** ${whitelistRoles.map((id) => `<@&${id}>`).join(', ')}\n`;
		}

		let supporterRoles: { roleId: string; extraEntries: number }[] = [];
		if (useSupporterRoles !== false && supporterRoles.length > 0) {
			supporterRoles = await this.container.giveawayAPI.listSupporterRoles(interaction.guild.id);
			embedDescription += `**Premium Roles:** ${supporterRoles.map((r) => `<@&${r.roleId}>: +${r.extraEntries} entries`).join(', ')}\n`;
		}

		// Build the embed
		const embed = new EmbedBuilder()
			.setTitle(title.slice(0, 256))
			.setDescription(embedDescription)
			.setColor(Colors.Blurple)
			.setFooter({
				text: `${now.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`
			});

		if (finalImageUrl) embed.setImage(finalImageUrl);
		if (finalThumbnailUrl) embed.setThumbnail(finalThumbnailUrl);

		// Fetch emoji from guild config
		const guildConfig = await this.container.giveawayAPI.getOrCreateGuildConfig(interaction.guild.id);
		const emoji = guildConfig.giveawayEmoji || '🎉';

		// Build the button
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder().setCustomId(`giveaway_enter_${giveaway.id}`).setLabel(`${emoji} Enter`).setStyle(ButtonStyle.Primary)
		);

		// Send the message
		const channel = interaction.channel;
		if (!channel || !('send' in channel)) {
			await interaction.editReply('Failed to send the giveaway message: not a text channel.');
			return;
		}
		const giveawayMsg = await (channel as any).send({ embeds: [embed], components: [row] });
		if (!giveawayMsg) {
			await interaction.editReply('Failed to send the giveaway message.');
			return;
		}

		// Update the giveaway with the message ID
		await this.container.giveawayAPI.updateGiveaway(giveaway.id, { messageId: giveawayMsg.id });

		// Reply to the user with a link to the giveaway message
		return await interaction.editReply(`Giveaway created! [View it here](${giveawayMsg.url})`);
	}

	// Utility: parse duration string like 2h30m10s
	private parseDuration(input: string): number | null {
		const regex = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i;
		const match = input.match(regex);
		if (!match) return null;
		const days = parseInt(match[1] || '0', 10);
		const hours = parseInt(match[2] || '0', 10);
		const mins = parseInt(match[3] || '0', 10);
		const secs = parseInt(match[4] || '0', 10);
		return (days * 24 * 60 * 60 + hours * 60 * 60 + mins * 60 + secs) * 1000;
	}
}
