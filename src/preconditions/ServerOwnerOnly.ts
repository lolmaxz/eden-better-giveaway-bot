import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';

export class ServerOwnerOnly extends Precondition {
	#message = '❌ This command can only be used by the server owner.';

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		return this.checkSetupStatus(interaction);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.checkSetupStatus(interaction);
	}

	private async checkSetupStatus(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) {
		const guildId = interaction.guildId;
		if (!guildId) return this.error({ message: 'This command must be used in a server.' });

		const guildOwner = await interaction.guild?.fetchOwner();
		if (!guildOwner) return this.error({ message: 'This server does not have an owner.' });

		if (guildOwner.id === interaction.user.id) {
			return this.ok();
		} else {
			return this.error({ message: this.#message });
		}
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		ServerOwnerOnly: never;
	}
}
