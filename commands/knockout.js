const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const channelsFilePath = './data/channelConfig.json'; // Path to the channels configuration file for posting

module.exports = {
    data: new SlashCommandBuilder()
        .setName('knockout')
        .setDescription('Knock out a member for 24 hours.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to knock out')
                .setRequired(true)),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id);
        const commandUser = interaction.user; // The user who ran the command

        // Check if the target is a bot
        if (target.bot) {
            return interaction.reply({
                content: "You can't knock out a bot!",
                ephemeral: true
            });
        }
 
        // Check if the target is an admin
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: "You can't knock out an admin!",
                ephemeral: true
            });
        }

        // Try to timeout the member for 24 hours
        try {
            const timeoutReason = `${commandUser.tag} knocked out ${target.tag} with a brick.`; // Custom timeout reason
            await member.timeout(24 * 60 * 60 * 1000, timeoutReason); // Timeout for 24 hours

            // Load the channel configuration
            let channelConfig = {};
            if (fs.existsSync(channelsFilePath)) {
                channelConfig = JSON.parse(fs.readFileSync(channelsFilePath, 'utf8'));
            }

            // Determine the channel to post in (either configured channel or the one where command is run)
            let postChannel = interaction.channel;
            const configuredChannelId = channelConfig[guildId];
            if (configuredChannelId) {
                const configuredChannel = interaction.guild.channels.cache.get(configuredChannelId);
                if (configuredChannel) {
                    postChannel = configuredChannel; // Use configured channel if available
                }
            }

            // Send the knockout message
            await postChannel.send({
                content: `<@${target.id}> was knocked out by <@${commandUser.id}> with a brick for 24 hours.`
            });

            // Acknowledge the interaction, but do it ephemerally so it doesn’t clutter
            await interaction.reply({ content: 'The knockout was successful!', ephemeral: true });

        } catch (error) {
            console.error('Error applying timeout:', error);
            return interaction.reply({
                content: 'There was an error trying to knock out the member.',
                ephemeral: true
            });
        }
    }
};