require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');

// Paths to JSON files
const dataPath = './data';
const rolesFilePath = './data/modRoles.json';
const channelsFilePath = './data/channelConfig.json';
const voteChannelsFilePath = './data/channelVoteConfig.json';

// Ensure the data directory exists
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
    console.log('Created data directory');
}

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Load commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Function to refresh application (/) commands
async function refreshCommands() {
    const commands = client.commands.map(command => command.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), // For global commands
            { body: commands }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing commands:', error);
    }
}

// Load all commands from the 'commands' folder and add them to the collection
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Log when the bot is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await refreshCommands(); // Refresh commands when the bot starts
    loadModRoles(); // Load the roles for each guild when the bot starts
    loadChannelSettings(); // Load the channels for each guild when the bot starts
    loadVoteChannels(); // Load the vote channels for each guild when the bot starts
});

// Function to load moderator roles for each guild from the JSON file
function loadModRoles() {
    client.requiredRoles = {}; // Initialize the requiredRoles object to store roles by guild

    if (fs.existsSync(rolesFilePath)) {
        const rolesData = JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
        client.requiredRoles = rolesData; // Load roles from file into memory
        console.log('Loaded required roles for all guilds:', client.requiredRoles);
    }
}

// Function to load channel settings for each guild from the JSON file
function loadChannelSettings() {
    client.channelSettings = {}; // Initialize the channelSettings object to store channels by guild

    if (fs.existsSync(channelsFilePath)) {
        const channelsData = JSON.parse(fs.readFileSync(channelsFilePath, 'utf8'));
        client.channelSettings = channelsData; // Load channel settings from file into memory
        console.log('Loaded channel settings for all guilds:', client.channelSettings);
    }
}

// Function to load vote channel settings for each guild from the JSON file
function loadVoteChannels() {
    client.voteChannels = {}; // Initialize the voteChannels object to store vote channels by guild

    if (fs.existsSync(voteChannelsFilePath)) {
        const voteChannelsData = JSON.parse(fs.readFileSync(voteChannelsFilePath, 'utf8'));
        client.voteChannels = voteChannelsData; // Load vote channels from file into memory
        console.log('Loaded vote channels for all guilds:', client.voteChannels);
    }
}

// Handle slash commands and button interactions
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        console.log(`Button pressed: ${interaction.customId}`);  // Log the button press

        const command = client.commands.get('accuse');  // Ensure this points to your button handler command
        if (!command) return;

        try {
            await command.handleButton(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error processing the vote!', ephemeral: true });
        }
    }
});

// Log in to Discord
client.login(process.env.BOT_TOKEN);
