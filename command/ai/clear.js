const { SlashCommandBuilder } = require("@discordjs/builders");
const { initializeConversation } = require("./aiStateManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear your conversation history with the AI"),
  async execute(interaction) {
    const userId = interaction.user.id;
    // 清除用户的对话历史，但保持系统提示
    initializeConversation(userId);

    await interaction.reply({
      content: "你的对话历史已清除。系统提示保持不变。",
      ephemeral: true,
    });
  },
};