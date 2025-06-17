import type { Giveaway } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Colors, EmbedBuilder, TextChannel } from 'discord.js';

export class GiveawayTimerManager {
	private timers: Map<number, NodeJS.Timeout> = new Map();

	public async startTimer(giveaway: Giveaway) {
		this.stopTimer(giveaway.id);
		const now = Date.now();
		const end = new Date(giveaway.endTime).getTime();
		const delay = end - now;
		if (delay <= 0) {
			// Already ended, handle immediately
			await this.endGiveaway(giveaway.id);
			return;
		}
		const timeout = setTimeout(() => this.endGiveaway(giveaway.id), delay);
		this.timers.set(giveaway.id, timeout);
		container.logger.info(`[GiveawayTimerManager] Started timer for giveaway ${giveaway.id} (${giveaway.title}) ending in ${delay / 1000}s`);
	}

	public stopTimer(giveawayId: number) {
		const timeout = this.timers.get(giveawayId);
		if (timeout) {
			clearTimeout(timeout);
			this.timers.delete(giveawayId);
			container.logger.info(`[GiveawayTimerManager] Stopped timer for giveaway ${giveawayId}`);
		}
	}

	public async restartAllTimers(guildId: string) {
		const activeGiveaways = await container.giveawayAPI.listActiveGiveaways(guildId);
		for (const g of activeGiveaways) {
			await this.startTimer(g);
		}
	}

	public async handleMissedGiveaways(guildId: string) {
		const activeGiveaways = await container.giveawayAPI.listActiveGiveaways(guildId);
		const now = Date.now();
		for (const g of activeGiveaways) {
			if (new Date(g.endTime).getTime() <= now) {
				container.logger.info(`[GiveawayTimerManager] Handling missed giveaway ${g.id}`);
				await this.endGiveaway(g.id, true);
			}
		}
	}

	public async finishGiveaway(giveawayId: number, selectWinner = true) {
		this.stopTimer(giveawayId);
		try {
			const giveaway = await container.giveawayAPI.getGiveawayById(giveawayId);
			if (!giveaway || giveaway.isCompleted) return;
			const entries = await container.giveawayAPI.listEntriesForGiveaway(giveaway.id);
			let winnerList: { userId: string; displayName: string; username: string }[] = [];
			if (selectWinner && entries.length > 0) {
				// Weighted random pick for multiple winners
				const pool: typeof entries = [];
				for (const entry of entries) {
					pool.push(...Array(1 + entry.extraEntries).fill(entry));
				}
				const uniqueWinners = new Set<string>();
				while (winnerList.length < giveaway.winnerCount && pool.length > 0) {
					const idx = Math.floor(Math.random() * pool.length);
					const picked = pool[idx];
					if (!uniqueWinners.has(picked.userId)) {
						winnerList.push({ userId: picked.userId, displayName: picked.displayName, username: picked.username });
						uniqueWinners.add(picked.userId);
					}
					// Remove all instances of this user from the pool
					for (let i = pool.length - 1; i >= 0; i--) {
						if (pool[i].userId === picked.userId) pool.splice(i, 1);
					}
				}
				await container.giveawayAPI.markGiveawayCompleted(
					giveaway.id,
					winnerList.map((w) => w.userId),
					winnerList.map((w) => w.displayName),
					winnerList.map((w) => w.username)
				);
			} else {
				await container.giveawayAPI.updateGiveaway(giveaway.id, { isCompleted: true, endTime: new Date() });
			}
			// Edit the giveaway message
			try {
				const channel = await container.client.channels.fetch(giveaway.channelId);
				if (channel && 'messages' in channel) {
					const msg = await channel.messages.fetch(giveaway.messageId);
					if (msg) {
						let embed = msg.embeds[0] ? EmbedBuilder.from(msg.embeds[0]) : new EmbedBuilder();
						let desc = embed.data.description || '';
						const winnerLineRegex = /\*\*Winners?:\*\*.*\n/;
						if (selectWinner && winnerList.length > 0) {
							const winnerMentions = winnerList.map((w) => `<@${w.userId}>`).join(', ');
							desc = desc.replace(winnerLineRegex, `**Winner${winnerList.length > 1 ? 's' : ''}:** ${winnerMentions}\n`);
							desc += `\n\n:tada: Congratulations to the winner${winnerList.length > 1 ? 's' : ''}!`;
						} else {
							desc = desc.replace(winnerLineRegex, '**Winner:** No winner selected.\n');
							desc += '\nNo winner selected.';
						}
						if ('setDescription' in embed) embed.setDescription(desc);
						await msg.edit({ embeds: [embed], components: [] });

						// Send a separate announcement message
						if (selectWinner && winnerList.length > 0 && channel instanceof TextChannel) {
							const winnerMentions = winnerList.map((w) => `<@${w.userId}>`).join(', ');
							const announcementEmbed = new EmbedBuilder()
								.setTitle('🎉 Giveaway Ended!')
								.setDescription(
									`**${giveaway.title}** has ended!\n\n**Prize:** ${giveaway.prize}\n\n**Winner${winnerList.length > 1 ? 's' : ''}:** ${winnerMentions}\n\nCongratulations!`
								)
								.setColor(Colors.Green)
								.setTimestamp();

							if (giveaway.imageUrl) {
								announcementEmbed.setImage(giveaway.imageUrl);
							}

							await channel.send({ content: winnerMentions, embeds: [announcementEmbed] });
						}
					}
				}
			} catch (e) {
				container.logger.error(`[GiveawayTimerManager] Error editing giveaway message for ${giveawayId}:`, e);
			}
			container.logger.info(`[GiveawayTimerManager] Giveaway ${giveawayId} ended.`);
		} catch (e) {
			container.logger.error(`[GiveawayTimerManager] Error finishing giveaway ${giveawayId}:`, e);
		}
	}

	private async endGiveaway(giveawayId: number, isMissed = false) {
		try {
			await this.finishGiveaway(giveawayId, true);
			container.logger.info(`[GiveawayTimerManager] Giveaway ${giveawayId} ended${isMissed ? ' (missed)' : ''}.`);
		} catch (e) {
			container.logger.error(`[GiveawayTimerManager] Error ending giveaway ${giveawayId}:`, e);
		}
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		giveawayTimerManager: GiveawayTimerManager;
	}
}
