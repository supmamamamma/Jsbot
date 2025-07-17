const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  setUserSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
} = require("./aiStateManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset_system")
    .setDescription("Reset the system prompt to default"),
  async execute(interaction) {
    const userId = interaction.user.id;
    // 重置系统提示为默认值
    setUserSystemPrompt(userId, DEFAULT_SYSTEM_PROMPT);

    await interaction.reply({
      content: `系统提示已重置为默认值: "${DEFAULT_SYSTEM_PROMPT}"`,
      ephemeral: true,
    });
  },
};