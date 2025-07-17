const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  getUserSystemPrompt,
  setUserSystemPrompt,
} = require("./aiStateManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("system")
    .setDescription("Set a custom system prompt for the AI")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The system prompt to set (leave empty to view current)")
        .setRequired(false),
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const newPrompt = interaction.options.getString("prompt");

    if (newPrompt) {
      // 设置新的系统提示
      setUserSystemPrompt(userId, newPrompt);

      await interaction.reply({
        content: `系统提示已更新为: "${newPrompt}"`,
        ephemeral: true,
      });
    } else {
      // 显示当前系统提示
      const currentPrompt = getUserSystemPrompt(userId);

      await interaction.reply({
        content: `当前系统提示: "${currentPrompt}"`,
        ephemeral: true,
      });
    }
  },
};