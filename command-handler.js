const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

function loadCommands() {
  const commands = new Collection();
  const commandFiles = [];

  const commandFolders = fs.readdirSync(path.join(__dirname, "command"));

  for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, "command", folder);
    const stats = fs.statSync(folderPath);

    if (stats.isDirectory()) {
      const files = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith(".js"));
      for (const file of files) {
        commandFiles.push(path.join(folder, file));
      }
    } else if (stats.isFile() && folder.endsWith(".js")) {
      commandFiles.push(folder);
    }
  }

  for (const file of commandFiles) {
    const command = require(path.join(__dirname, "command", file));
    if (command.data && command.execute) {
      commands.set(command.data.name, command);
    }
  }
  return commands;
}

async function handleInteraction(interaction) {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  const commands = loadCommands();

  if (interaction.isCommand()) {
    const command = commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    // Handle button interactions here, potentially by emitting an event or calling a specific handler
    // For now, we will keep the pagination logic in the main file, but it could be moved here.
  }
}

module.exports = {
  loadCommands,
  handleInteraction,
};