import { Subcommand } from '@kaname-png/plugin-subcommands-advanced';
import { ApplicationCommandRegistry } from '@sapphire/framework';

export class ParentCommandConfig extends Subcommand {
	public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
		super(context, {
			...options,
			name: 'gconfig'
			// preconditions: ['ServerOwnerOnly'] // The preconditions set here affect all subcommands.
		});
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand((ctx) => {
			// If you want to link commands in groups of subcommands you first need to register them in the builder context of the parent command.
			ctx.addSubcommandGroup((sc) => sc.setName('special-role').setDescription('Manage special supporter roles for giveaways')); // Each group of subcommands must have a unique name and description and be registered like this.

			// It is necessary to call this hook and pass the builder context to register the subcommands stored in the subcommand registry in the subcommand groups of the parent command.
			this.hooks.groups(this, ctx);

			// It is necessary to call this hook and pass the builder context to register the subcommands stored in the subcommand register in the parent command.
			this.hooks.subcommands(this, ctx);

			// Calling both hooks is only necessary if required, it is not mandatory.
			return ctx.setName(this.name).setDescription('Configure giveaway bot settings');
		});
	}
}
