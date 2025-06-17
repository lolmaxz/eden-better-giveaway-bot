import '@kaname-png/plugin-subcommands-advanced/register';
import { SapphireClient, container } from '@sapphire/framework';
import { ClientOptions } from 'discord.js';
import { GiveawayTimerManager } from './lib/GiveawayTimerManager';
import { GiveawayAPI } from './pieces/GiveawayAPI';

export class SapphireCustomClient extends SapphireClient {
	public constructor(options: ClientOptions) {
		super(options);
	}

	public override async login(token?: string) {
		// You can add your own custom classes to the container here, since this is a custom client.
		container.giveawayAPI = new GiveawayAPI();
		container.giveawayTimerManager = new GiveawayTimerManager();

		return super.login(token);
	}
}
