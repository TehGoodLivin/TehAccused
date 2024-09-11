const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const rolesFilePath = './data/modRoles.json';
const channelsFilePath = './data/channelConfig.json';
const voteChannelsFilePath = './data/channelVoteConfig.json';

// Ensure the data directory exists
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure bot settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setchannel')
                .setDescription('Set or clear the channel where bot messages will be sent')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to send bot messages to (or leave blank for none)'))
                .addStringOption(option =>
                    option.setName('none')
                        .setDescription('Type "none" to clear the current channel')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setmodrole')
                .setDescription('Set or clear the role required to use bot commands')
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('The role that can use bot commands (or leave blank for none)'))
                .addStringOption(option =>
                    option.setName('none')
                        .setDescription('Type "none" to clear the current mod role')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setvotechannel')
                .setDescription('Set or clear the channel where vote messages will be posted')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to post vote messages to (or leave blank for none)'))
                .addStringOption(option =>
                    option.setName('none')
                        .setDescription('Type "none" to clear the vote channel')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('displaysettings')
                .setDescription('Display current bot settings for the guild')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // Handle "setchannel" subcommand
        if (subcommand === 'setchannel') {
            const channel = interaction.options.getChannel('channel');
            const noneOption = interaction.options.getString('none');
            let channelConfig = {};

            // Load the existing channel settings
            if (fs.existsSync(channelsFilePath)) {
                channelConfig = JSON.parse(fs.readFileSync(channelsFilePath, 'utf8'));
            }

            // Handle clearing the channel
            if (noneOption && noneOption.toLowerCase() === 'none') {
                delete channelConfig[guildId]; // Clear the channel for the guild
                fs.writeFileSync(channelsFilePath, JSON.stringify(channelConfig, null, 2));
                return interaction.reply({ content: 'The channel setting has been cleared.', ephemeral: true });
            }

            // Handle setting a new channel
            if (channel) {
                channelConfig[guildId] = channel.id; // Set the new channel
                fs.writeFileSync(channelsFilePath, JSON.stringify(channelConfig, null, 2));
                return interaction.reply({ content: `Messages will now be sent to <#${channel.id}>.`, ephemeral: true });
            }

            return interaction.reply({ content: 'Please provide a valid channel or type "none" to clear the current setting.', ephemeral: true });
        }

        // Handle "setmodrole" subcommand
        if (subcommand === 'setmodrole') {
            const role = interaction.options.getRole('role');
            const noneOption = interaction.options.getString('none');
            let rolesConfig = {};

            // Load the existing mod role settings
            if (fs.existsSync(rolesFilePath)) {
                rolesConfig = JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
            }

            // Handle clearing the mod role
            if (noneOption && noneOption.toLowerCase() === 'none') {
                delete rolesConfig[guildId]; // Clear the mod role for the guild
                fs.writeFileSync(rolesFilePath, JSON.stringify(rolesConfig, null, 2));
                return interaction.reply({ content: 'The mod role setting has been cleared.', ephemeral: true });
            }

            // Handle setting a new mod role
            if (role) {
                rolesConfig[guildId] = role.id; // Set the new mod role
                fs.writeFileSync(rolesFilePath, JSON.stringify(rolesConfig, null, 2));
                return interaction.reply({ content: `The mod role has been set to ${role.name}.`, ephemeral: true });
            }

            return interaction.reply({ content: 'Please provide a valid role or type "none" to clear the current mod role.', ephemeral: true });
        }

        // Handle "setvotechannel" subcommand
        if (subcommand === 'setvotechannel') {
            const channel = interaction.options.getChannel('channel');
            const noneOption = interaction.options.getString('none');
            let voteChannelsConfig = {};

            // Load the existing vote channel settings
            if (fs.existsSync(voteChannelsFilePath)) {
                voteChannelsConfig = JSON.parse(fs.readFileSync(voteChannelsFilePath, 'utf8'));
            }

            // Handle clearing the vote channel
            if (noneOption && noneOption.toLowerCase() === 'none') {
                delete voteChannelsConfig[guildId]; // Clear the vote channel for the guild
                fs.writeFileSync(voteChannelsFilePath, JSON.stringify(voteChannelsConfig, null, 2));
                return interaction.reply({ content: 'The vote channel setting has been cleared.', ephemeral: true });
            }

            // Handle setting a new vote channel
            if (channel) {
                voteChannelsConfig[guildId] = channel.id; // Set the new vote channel
                fs.writeFileSync(voteChannelsFilePath, JSON.stringify(voteChannelsConfig, null, 2));
                return interaction.reply({ content: `Votes will now be posted in <#${channel.id}>.`, ephemeral: true });
            }

            return interaction.reply({ content: 'Please provide a valid vote channel or type "none" to clear the current setting.', ephemeral: true });
        }

        // Handle "displaysettings" subcommand
        if (subcommand === 'displaysettings') {
            let channelConfig = {};
            let rolesConfig = {};
            let voteChannelsConfig = {};

            // Load existing configurations
            if (fs.existsSync(channelsFilePath)) {
                channelConfig = JSON.parse(fs.readFileSync(channelsFilePath, 'utf8'));
            }

            if (fs.existsSync(rolesFilePath)) {
                rolesConfig = JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
            }

            if (fs.existsSync(voteChannelsFilePath)) {
                voteChannelsConfig = JSON.parse(fs.readFileSync(voteChannelsFilePath, 'utf8'));
            }

            // Get the current settings
            const currentChannel = channelConfig[guildId] ? `<#${channelConfig[guildId]}>` : 'None';
            const currentModRole = rolesConfig[guildId] ? `<@&${rolesConfig[guildId]}>` : 'None';
            const currentVoteChannel = voteChannelsConfig[guildId] ? `<#${voteChannelsConfig[guildId]}>` : 'None';

            // Send a message with the current settings
            return interaction.reply({
                content: `**Current Settings for ${interaction.guild.name}:**\n\n` +
                         `**Bot Channel**: ${currentChannel}\n` +
                         `**Mod Role**: ${currentModRole}\n` +
                         `**Vote Channel**: ${currentVoteChannel}`,
                ephemeral: true
            });
        }
    }
};
