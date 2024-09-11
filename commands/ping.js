const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with the bot\'s latency and WebSocket ping.'),

    async execute(interaction) {
        const startTime = Date.now();

        // Immediately reply with the full content, making it ephemeral
        const latency = Date.now() - startTime;
        const websocketPing = interaction.client.ws.ping;  // WebSocket ping

        // Reply with the ping result directly (ephemeral)
        await interaction.reply({
            content: `🏓 Pong! Latency: \`${latency}ms\`, WebSocket Ping: \`${websocketPing}ms\``,
            ephemeral: true
        });
    }
};
