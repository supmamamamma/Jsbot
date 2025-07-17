const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  conversations,
  historyPagination,
  createHistoryEmbed,
  createPaginationButtons,
} = require("./aiStateManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("listhis")
    .setDescription("View your current conversation history with the AI"),
  async execute(interaction) {
    const userId = interaction.user.id;
    // 检查用户是否有对话历史
    if (!conversations[userId] || conversations[userId].length <= 1) {
      await interaction.reply({
        content: "你还没有任何对话历史。",
        ephemeral: true,
      });
      return;
    }
    // 创建嵌入式消息和按钮
    const { embed, currentPage, totalPages } = createHistoryEmbed(userId);
    const row = createPaginationButtons(currentPage, totalPages);

    // 存储分页数据
    historyPagination[userId] = {
      currentPage,
      timestamp: Date.now(), // 添加时间戳以便清理
    };

    // 发送嵌入式消息和按钮
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
};