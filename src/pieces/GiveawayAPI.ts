import type { Entry, Giveaway, SupporterRole } from '@prisma/client';
import prisma from '../db';

export class GiveawayAPI {
	// Giveaway methods
	async createGiveaway(data: Omit<Giveaway, 'id' | 'isCompleted' | 'winnerUserId' | 'winnerUsername' | 'winnerDisplayName'>): Promise<Giveaway> {
		return prisma.giveaway.create({ data });
	}

	async getGiveawayById(id: number): Promise<Giveaway | null> {
		return prisma.giveaway.findUnique({ where: { id } });
	}

	async listActiveGiveaways(guildId: string): Promise<Giveaway[]> {
		return prisma.giveaway.findMany({ where: { guildId, isCompleted: false } });
	}

	async listCompletedGiveaways(guildId: string): Promise<Giveaway[]> {
		return prisma.giveaway.findMany({ where: { guildId, isCompleted: true } });
	}

	async updateGiveaway(id: number, data: Partial<Omit<Giveaway, 'id'>>): Promise<Giveaway> {
		return prisma.giveaway.update({ where: { id }, data });
	}

	async markGiveawayCompleted(id: number, winnerUserIds: string[], winnerDisplayNames: string[], winnerUsernames: string[]): Promise<Giveaway> {
		return prisma.giveaway.update({
			where: { id },
			data: {
				isCompleted: true,
				winnerUserIds: winnerUserIds.join(','),
				winnerDisplayNames: winnerDisplayNames.join(','),
				winnerUsernames: winnerUsernames.join(',')
			}
		});
	}

	async deleteGiveaway(id: number): Promise<void> {
		await prisma.giveaway.delete({ where: { id } });
	}

	// Entry methods
	async addEntry(data: Omit<Entry, 'id' | 'entryTime'>): Promise<Entry> {
		return prisma.entry.create({ data });
	}

	async listEntriesForGiveaway(giveawayId: number): Promise<Entry[]> {
		return prisma.entry.findMany({ where: { giveawayId } });
	}

	async getEntryByUser(giveawayId: number, userId: string): Promise<Entry | null> {
		return prisma.entry.findFirst({ where: { giveawayId, userId } });
	}

	async removeEntry(entryId: number): Promise<boolean> {
		try {
			await prisma.entry.delete({ where: { id: entryId } });
			return true;
		} catch (e) {
			return false;
		}
	}

	// SupporterRole methods
	async addSupporterRole(guildId: string, roleId: string, extraEntries: number): Promise<SupporterRole> {
		return prisma.supporterRole.create({ data: { guildId, roleId, extraEntries } });
	}

	async removeSupporterRole(guildId: string, roleId: string): Promise<SupporterRole | null> {
		const role = await prisma.supporterRole.findFirst({ where: { guildId, roleId } });
		if (!role) return null;
		return prisma.supporterRole.delete({ where: { id: role.id } });
	}

	async listSupporterRoles(guildId: string): Promise<SupporterRole[]> {
		return prisma.supporterRole.findMany({ where: { guildId } });
	}

	// GuildConfig methods
	async getGuildConfig(guildId: string) {
		return prisma.guildConfig.findUnique({ where: { guildId } });
	}

	async getOrCreateGuildConfig(guildId: string): Promise<any> {
		let config = await this.getGuildConfig(guildId);
		if (!config) {
			config = await prisma.guildConfig.create({ data: { guildId } });
		}
		return config;
	}

	async updateGuildConfig(guildId: string, data: Partial<{ allowedUserIds: string; giveawayEmoji: string }>) {
		return prisma.guildConfig.update({ where: { guildId }, data });
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		giveawayAPI: GiveawayAPI;
	}
}
