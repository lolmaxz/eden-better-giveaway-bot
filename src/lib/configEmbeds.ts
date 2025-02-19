import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';

export const ErrorReply = async (interaction: ChatInputCommandInteraction, message: string, component?: ActionRowBuilder<ButtonBuilder>[]) => {
	return await interaction.reply({
		embeds: [new EmbedBuilder().setTitle('❌ Error').setDescription(message).setColor(Colors.Red).setFooter({ text: 'Powered by Custom Bot' })],
		files: [],
		ephemeral: true,
		components: component ? [...component] : []
	});
};

export const InfoReply = async (interaction: ChatInputCommandInteraction, message: string, component?: ActionRowBuilder<ButtonBuilder>[]) => {
	return await interaction.reply({
		embeds: [new EmbedBuilder().setTitle('ℹ️ Info').setDescription(message).setColor(Colors.Yellow).setFooter({ text: 'Powered by Custom Bot' })],
		files: [],
		ephemeral: true,
		components: component ? [...component] : []
	});
};

export const SuccessReply = async (interaction: ChatInputCommandInteraction, message: string, component?: ActionRowBuilder<ButtonBuilder>[]) => {
	return await interaction.reply({
		embeds: [
			new EmbedBuilder().setTitle('✅ Success').setDescription(message).setColor(Colors.Green).setFooter({ text: 'Powered by Custom Bot' })
		],
		files: [],
		ephemeral: true,
		components: component ? [...component] : []
	});
};
