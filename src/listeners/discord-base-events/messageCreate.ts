import { Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { ClientEvents } from '../../types/events';

export class MessageCreateListener extends Listener {
	public override async run(message: Message) {
		/**
		 * Add any logic here that you want to run when a message is sent in Chat.
		 *
		 * Make sure to have the necessary permissions to read messages in the channel.
		 * Make sure you have the GatewayIntentBits.MessageContent and GatewayIntentBits.GuildMessages in the index.ts file.
		 * Make sure you also enabled the Message Content Gateway Intent in the Discord Developer Portal. ✅
		 */

		this.container.client.emit(ClientEvents.Logging, message.content);
	}
}
