import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ClientEvents } from '../../types/events';

@ApplyOptions<Listener.Options>({ event: ClientEvents.Logging })
export class ExampleEventEmittedLogging extends Listener {
	public async run(logMessage: string) {
		// --
		// Log the message to the console
		this.container.logger.info(logMessage);
	}
}
