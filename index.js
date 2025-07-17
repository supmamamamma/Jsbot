// 引入必要的模块
// 首先初始化環境配置
const { initializeEnvironment } = require("./config/env-setup");

// 初始化環境配置
const envInit = initializeEnvironment();
if (!envInit.success) {
  console.error("❌ 環境配置初始化失敗，程序退出");
  process.exit(1);
}

// 如果需要配置但 Discord Token 無效，給出警告但不退出
if (envInit.needsConfiguration) {
  console.log("⚠️  請完成配置後重新啟動機器人以獲得最佳體驗");
}

// 載入環境變量
require("dotenv").config();
const Discord = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const {
  historyPagination,
  createHistoryEmbed,
  createPaginationButtons,
} = require("./command/ai/aiStateManager");
const { loadCommands, handleInteraction } = require("./command-handler");

// 创建一个新的 Discord 客户端
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

// Bot Token 和 Client ID
const token = process.env.DISCORD_TOKEN;
const clientId = "1362792276895596675";

// 檢查 Discord Token 是否有效
if (!token || token === "YOUR_DISCORD_BOT_TOKEN_HERE") {
  console.error("❌ Discord Token 未正確配置！");
  console.log("💡 請打開 .env 文件並設置正確的 DISCORD_TOKEN");
  console.log("   然後重新啟動機器人");
  process.exit(1);
}

// 当客户端准备就绪时触发，只会触发一次
client.once("ready", () => {
  console.log("Bot is ready!");

  const statusManager = require("./status");

  statusManager.setStatus(client, {
    name: "abcd",
    type: "PLAYING",
    status: "idle",
  });

  // 注册斜杠命令
  const rest = new REST({ version: "9" }).setToken(token);
  const commands = loadCommands();
  const commandData = commands.map((cmd) => cmd.data);

  (async () => {
    try {
      // 在所有服务器上注册命令
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });
      console.log("Successfully registered application commands globally.");
    } catch (error) {
      console.error(error);
    }
  })();
});

// 当收到 interaction (斜杠命令) 时触发
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const userId = interaction.user.id;
    // 检查是否是分页按钮
    if (
      interaction.customId === "prev_page" ||
      interaction.customId === "next_page"
    ) {
      // 检查用户是否有分页数据
      if (!historyPagination[userId]) {
        await interaction.reply({
          content: "会话已过期，请重新使用 /listhis 命令查看历史记录。",
          ephemeral: true,
        });
        return;
      }

      // 计算新的页码
      let newPage = historyPagination[userId].currentPage;
      if (interaction.customId === "prev_page") {
        newPage--;
      } else {
        newPage++;
      }

      // 创建新的嵌入式消息和按钮
      const { embed, currentPage, totalPages } = createHistoryEmbed(
        userId,
        newPage,
      );
      const row = createPaginationButtons(currentPage, totalPages);

      // 更新分页数据
      historyPagination[userId].currentPage = currentPage;

      // 更新消息
      await interaction.update({
        embeds: [embed],
        components: [row],
      });

      return;
    }
  }

  handleInteraction(interaction);
});

// 使用你的 Bot Token 登录 Discord
client.login(token);
