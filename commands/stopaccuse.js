const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const channelsFilePath = './data/channelConfig.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stopaccuse')
        .setDescription('Stop an active vote for a member and remove their timeout.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member whose vote you want to stop')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Immediately defer the reply to prevent timeouts
            await interaction.deferReply({ ephemeral: true });

            const requiredRole = interaction.client.requiredRoles[interaction.guild.id] || null;

            // Check if the user has admin permissions or the required role
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && (!requiredRole || !interaction.member.roles.cache.has(requiredRole))) {
                return interaction.followUp({
                    content: 'You do not have permission to stop the vote. Only admins or users with the required role can stop the vote.',
                    ephemeral: true
                });
            }

            const guildId = interaction.guild.id;
            const target = interaction.options.getUser('target');
            const voteSessions = interaction.client.voteSessions || new Map();

            if (!voteSessions.has(guildId)) {
                return interaction.followUp({ content: 'There are no active votes in this server.', ephemeral: true });
            }

            const guildSessions = voteSessions.get(guildId);
            const session = guildSessions.get(target.id);

            if (!session) {
                return interaction.followUp({ content: `There is no active vote for <@${target.id}>.`, ephemeral: true });
            }

            // Stop the timer (clear the interval) for the vote
            if (session.interval) {
                clearInterval(session.interval);
            }

            // Delete the associated message
            if (session.message) {
                await session.message.delete();
            }

            // Delete the vote table message if it exists
            if (session.voteTableMessage) {
                await session.voteTableMessage.delete();
            }

            // Remove the timeout from the member
            const member = await interaction.guild.members.fetch(target.id);
            if (member.communicationDisabledUntil) {  // Check if the member has an active timeout
                await member.timeout(null);  // Remove the timeout
            }

            // Remove the session from the list
            guildSessions.delete(target.id);

            // Always check the channel configuration dynamically from the file
            let channelConfig = {};
            if (fs.existsSync(channelsFilePath)) {
                channelConfig = JSON.parse(fs.readFileSync(channelsFilePath, 'utf8'));
            }

            // Determine the channel to post in
            let postChannel = interaction.channel; // Default to the channel where the command is run
            const configuredChannelId = channelConfig[guildId];

            if (configuredChannelId) {
                const configuredChannel = interaction.guild.channels.cache.get(configuredChannelId);
                if (configuredChannel) {
                    postChannel = configuredChannel; // Use the configured channel if it exists
                } else {
                    console.log(`Configured channel for guild ${guildId} not found. Falling back to command channel.`);
                    postChannel = interaction.channel;  // Fallback to command channel if configured one is invalid
                }
            }

            // Send a message in the appropriate channel announcing the stop of the vote
            await postChannel.send(`The vote for <@${target.id}> has been successfully stopped, and their timeout has been removed.`);

            // Send a follow-up to indicate the vote has been stopped
            await interaction.followUp({
                content: `The vote for <@${target.id}> has been successfully stopped!`,
                ephemeral: true
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({
                content: 'There was an error stopping the vote.',
                ephemeral: true
            });
        }
    }
};
