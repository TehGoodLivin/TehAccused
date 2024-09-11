const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const channelConfigPath = './data/channelConfig.json'; // Path to where the initial accuse message goes
const voteChannelsPath = './data/channelVoteConfig.json'; // Path to where the vote logs are posted

module.exports = {
    data: new SlashCommandBuilder()
        .setName('accuse')
        .setDescription('Start a vote on a member and restrict them from messages and voice during the vote.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to vote on')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the accusation')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('The number of minutes the vote will run for')
                .setRequired(true)),

    async execute(interaction) {
        try {
            // Immediately defer the reply to avoid timeouts
            await interaction.deferReply({ ephemeral: true });

            const guildId = interaction.guild.id;
            const target = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason');
            const duration = interaction.options.getInteger('duration');

            const botId = interaction.client.user.id;
            const requiredRole = interaction.client.requiredRoles[interaction.guild.id] || null;

            // Prevent accusing the bot itself
            if (target.id === botId) {
                return interaction.followUp({
                    content: "You can't accuse the bot!",
                    ephemeral: true
                });
            }

            // Fetch the target member after the target is defined
            const targetMember = await interaction.guild.members.fetch(target.id);

            // Prevent accusing other bots
            if (targetMember.user.bot) {
                return interaction.followUp({
                    content: "You can't accuse other bots!",
                    ephemeral: true
                });
            }

            // Prevent accusing admins
            if (targetMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.followUp({
                    content: "You can't accuse admins!",
                    ephemeral: true
                });
            }

            // Check if the user has admin permissions or the required role
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && (!requiredRole || !interaction.member.roles.cache.has(requiredRole))) {
                return interaction.followUp({
                    content: 'You do not have permission to run this command. Only admins or users with the required role can run this command.',
                    ephemeral: true
                });
            }

            // Calculate the end time of the vote
            const endTime = new Date(Date.now() + duration * 60 * 1000);
            const formattedEndTime = endTime.toLocaleString('en-US', { timeZoneName: 'short' });

            // Load channelConfig.json for where to post the accuse message
            let channelConfig = {};
            if (fs.existsSync(channelConfigPath)) {
                try {
                    channelConfig = JSON.parse(fs.readFileSync(channelConfigPath, 'utf8'));
                    console.log(`Loaded channel configuration:`, channelConfig); 
                } catch (error) {
                    console.error("Failed to read or parse channelConfig:", error);
                }
            }

            // Determine the channel to post the accuse message in
            let postChannel = interaction.channel; // Default to the command's running channel
            const accuseChannelId = channelConfig[guildId];

            if (accuseChannelId) {
                const configuredChannel = interaction.guild.channels.cache.get(accuseChannelId);
                if (configuredChannel) {
                    postChannel = configuredChannel; // Use the configured channel for the accuse message
                } else {
                    console.log(`Configured accuse channel for guild ${guildId} not found. Falling back to the current channel.`);
                }
            }

            // Initialize vote sessions by target ID (per guild)
            const voteSessions = interaction.client.voteSessions || new Map();
            interaction.client.voteSessions = voteSessions;

            if (!voteSessions.has(guildId)) {
                voteSessions.set(guildId, new Map());
            }

            const guildSessions = voteSessions.get(guildId);

            // Check if a vote is already in progress for the target user
            if (guildSessions.has(target.id)) {
                return interaction.followUp({
                    content: `There is already an active vote on <@${target.id}>.`,
                    ephemeral: true
                });
            }

            // Timeout the member for the duration of the vote
            await targetMember.timeout(duration * 60 * 1000, 'Accused of misconduct');

            // Start a new vote session
            guildSessions.set(target.id, {
                target: target,
                votes: {
                    stay: 0,
                    timeout: 0,
                    kick: 0,
                    ban: 0
                },
                voters: new Map(),
                interaction: interaction,
                message: null,
                interval: null
            });

            const session = guildSessions.get(target.id);

            // Create button row without vote counts
            const createButtonRow = () => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`stay_${target.id}`)
                            .setLabel('Stay')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`timeout_${target.id}`)
                            .setLabel('Timeout')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`kick_${target.id}`)
                            .setLabel('Kick')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`ban_${target.id}`)
                            .setLabel('Ban')
                            .setStyle(ButtonStyle.Danger)
                    );
            };

            // Send the accuse message to the appropriate channel
            const message = await postChannel.send({
                content: `Attention @everyone of the community! <@${target.id}> has been accused of "${reason}". Now it's up to the community to decide their fate. Cast your votes and have your say in what happens next.\n\nThe vote will end on **${formattedEndTime}**.`,
                components: [createButtonRow()]
            });

            session.message = message; // Store the message object

            // Set a timeout to handle the vote result after the voting period ends
            session.interval = setTimeout(() => {
                handleVoteResult(interaction, session, guildSessions);
            }, duration * 60 * 1000);

            // Send a follow-up to indicate the vote has started
            await interaction.followUp({
                content: 'The vote has been successfully started!',
                ephemeral: true
            });

        } catch (error) {
            console.error("Error executing /accuse command:", error);
            await interaction.followUp({
                content: "There was an error starting the vote.",
                ephemeral: true
            });
        }
    },

    async handleButton(interaction) {
        const [action, targetId] = interaction.customId.split('_');
        const guildId = interaction.guild.id;

        // Ensure the voteSessions map exists (for the current guild)
        const voteSessions = interaction.client.voteSessions;
        const guildSessions = voteSessions.get(guildId);

        const session = guildSessions.get(targetId);

        if (!session) {
            return interaction.reply({
                content: "This vote session is no longer active or does not exist.",
                ephemeral: true
            });
        }

        // Initialize a history map if it doesn't exist
        if (!session.voteHistory) {
            session.voteHistory = new Map();
        }

        // Ensure that there is a history array for the user
        if (!session.voteHistory.has(interaction.user.id)) {
            session.voteHistory.set(interaction.user.id, []);
        }

        // Get the user's previous vote if it exists
        const userVote = session.voters.get(interaction.user.id);

        if (userVote) {
            // Mark the previous vote as "CHANGED", but only once
            const history = session.voteHistory.get(interaction.user.id);
            if (history.length > 0 && !history[history.length - 1].includes("(CHANGED)")) {
                history[history.length - 1] = `**${userVote}** (CHANGED)`; 
            }

            // Decrease the previous vote count
            session.votes[userVote]--;
        }

        // Register the new vote
        session.voters.set(interaction.user.id, action);
        session.votes[action]++; // Increment the count for the new vote

        // Add the new vote to the history
        session.voteHistory.get(interaction.user.id).push(action);

        // Send a private confirmation message to the user
        await interaction.reply({
            content: `Your vote for **${action.toUpperCase()}** has been cast!`,
            ephemeral: true
        });

        // Format the vote table, displaying all votes and changes properly
        let voteTable = `**Vote Results for <@${session.target.id}>**\n\n`;
        voteTable += "| **User** | **Vote** |\n";
        voteTable += "|:--------|:---------|\n";

        // Build the vote table, showing the correct history of votes and changes
        session.voteHistory.forEach((votes, userId) => {
            const totalVotes = votes.length;
            votes.forEach((vote, index) => {
                if (index === totalVotes - 1) {
                    voteTable += `| <@${userId}> | **${vote.toUpperCase()}** |\n`;
                } else {
                    voteTable += `| <@${userId}> | ${vote.toUpperCase()}\n`;
                }
            });
        });

        // Dynamically load the vote channel configuration for the voting logs
        let voteChannelConfig = {};
        if (fs.existsSync(voteChannelsPath)) {
            try {
                voteChannelConfig = JSON.parse(fs.readFileSync(voteChannelsPath, 'utf8'));
                console.log(`Loaded vote channel configuration:`, voteChannelConfig); 
            } catch (error) {
                console.error("Failed to read or parse voteChannelsConfig:", error);
            }
        }

        // Determine the vote channel
        const voteChannelId = voteChannelConfig[guildId] || null;

        if (!voteChannelId) {
            console.log(`No vote channel set for guild ${guildId}. Skipping vote table post.`);
            return;
        }

        const configuredChannel = interaction.guild.channels.cache.get(voteChannelId);

        if (configuredChannel) {
            // Delete the previous vote table message
            if (session.voteTableMessage) {
                await session.voteTableMessage.delete();
            }

            // Send the updated vote table message
            session.voteTableMessage = await configuredChannel.send(voteTable);
        } else {
            console.log(`Configured vote channel for guild ${guildId} not found.`);
        }
    }
};

// Function to handle the vote result after the vote duration
async function handleVoteResult(interaction, session, guildSessions) {
    const target = session.target;
    const votes = session.votes;

    const sortedActions = ['stay', 'timeout', 'kick', 'ban'];
    const maxVotes = Math.max(...Object.values(votes));

    const finalAction = sortedActions.find(action => votes[action] === maxVotes);

    let resultMessage = '';
    const guildName = interaction.guild.name;

    const member = await interaction.guild.members.fetch(target.id); 

    const voteSummary = `Vote Results: Stay (${votes.stay}), Timeout (${votes.timeout}), Kick (${votes.kick}), Ban (${votes.ban})`;

    switch (finalAction) {
        case 'stay':
            resultMessage = `Votes are in! <@${target.id}> has been exonerated. ${voteSummary}`;
            break;
        case 'timeout':
            resultMessage = `Votes are in! <@${target.id}> has been given a timeout of 24 hours from ${guildName}. ${voteSummary}`;
            await member.timeout(24 * 60 * 60 * 1000, 'Timeout by vote'); 
            break;
        case 'kick':
            resultMessage = `Votes are in! <@${target.id}> has been kicked from ${guildName}. ${voteSummary}`;
            await member.kick('Kicked by vote');
            break;
        case 'ban':
            resultMessage = `Votes are in! <@${target.id}> has been banned from ${guildName}. ${voteSummary}`;
            await member.ban({ reason: 'Banned by vote' });
            break;
    }

    if (session.message) {
        await session.message.edit({ content: resultMessage, components: [] });
    }
    guildSessions.delete(target.id);
}
