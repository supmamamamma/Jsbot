// 引入必要的模块
// 首先初始化環境配置
const { initializeEnvironment } = require('./config/env-setup');

// 初始化環境配置
const envInit = initializeEnvironment();
if (!envInit.success) {
  console.error('❌ 環境配置初始化失敗，程序退出');
  process.exit(1);
}

// 如果需要配置但 Discord Token 無效，給出警告但不退出
if (envInit.needsConfiguration) {
  console.log('⚠️  請完成配置後重新啟動機器人以獲得最佳體驗');
}

// 載入環境變量
require('dotenv').config();
const Discord = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
// 引入新的configAI模块
const { configAICommand, getUserAIConfig } = require("./command/configai");
const { touemoji, fangsuqi } = require("./command/getemoji");
const { sendMessageCommand, handleSendMessage } = require("./command/send");
const { setmeCommand } = require("./command/setme");
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
if (!token || token === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
  console.error('❌ Discord Token 未正確配置！');
  console.log('💡 請打開 .env 文件並設置正確的 DISCORD_TOKEN');
  console.log('   然後重新啟動機器人');
  process.exit(1);
}

// 获取用户特定的OpenAI客户端
function getUserOpenAI(userId) {
  const config = getUserAIConfig(userId);

  // 如果没有API Key，则抛出错误
  if (!config.apiKey) {
    throw new Error("用户未配置API Key。请使用 /configai 命令进行配置。");
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || "https://openrouter.ai/api/v1",
  });
}
// 存储用户对话历史的对象
const conversations = {};

// 默认的系统提示
const DEFAULT_SYSTEM_PROMPT = "你是一条狗";

// 数据文件路径
const DATA_DIR = "./nbcs";
const SYSTEM_PROMPTS_FILE = path.join(DATA_DIR, "system_prompts.json");

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 加载系统提示
function loadSystemPrompts() {
  try {
    if (fs.existsSync(SYSTEM_PROMPTS_FILE)) {
      const data = fs.readFileSync(SYSTEM_PROMPTS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading system prompts:", error);
  }
  return {};
}

// 保存系统提示
function saveSystemPrompts() {
  try {
    fs.writeFileSync(
      SYSTEM_PROMPTS_FILE,
      JSON.stringify(userSystemPrompts, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error("Error saving system prompts:", error);
  }
}

// 初始化用户系统提示
const userSystemPrompts = loadSystemPrompts();

// 最大对话历史长度（消息对数）
const MAX_HISTORY_LENGTH = 50;

// 定义斜杠命令
const commands = [
  {
    name: "ai",
    description: "向ai发送消息",
    options: [
      {
        name: "message",
        type: 3, // STRING
        description: "信息",
        required: true,
      },
      {
        name: "pic",
        type: 3, // STRING
        description: "图片url",
        required: false,
      },
    ],
  },
  {
    name: "clear",
    description: "Clear your conversation history with the AI",
  },
  {
    name: "system",
    description: "Set a custom system prompt for the AI",
    options: [
      {
        name: "prompt",
        type: 3, // STRING
        description: "The system prompt to set (leave empty to view current)",
        required: false,
      },
    ],
  },
  {
    name: "reset_system",
    description: "Reset the system prompt to default",
  },
  {
    name: "listhis",
    description: "View your current conversation history with the AI",
  },
  fangsuqi,
  // 添加新的configai命令
  configAICommand.data.toJSON(),
  sendMessageCommand,
  // 添加setme命令
  setmeCommand.data.toJSON(),
];

// 存储分页历史记录的对象
const historyPagination = {};

// 每页显示的消息数量
const MESSAGES_PER_PAGE = 5;

// 获取用户的系统提示
function getUserSystemPrompt(userId) {
  return userSystemPrompts[userId] || DEFAULT_SYSTEM_PROMPT;
}

// 设置用户的系统提示
function setUserSystemPrompt(userId, prompt) {
  userSystemPrompts[userId] = prompt;

  // 保存到文件
  saveSystemPrompts();

  // 如果用户已有对话，更新系统提示
  if (conversations[userId] && conversations[userId].length > 0) {
    if (conversations[userId][0].role === "system") {
      conversations[userId][0].content = prompt;
    } else {
      conversations[userId].unshift({ role: "system", content: prompt });
    }
  }
}

// 初始化或重置用户的对话
function initializeConversation(userId) {
  const systemPrompt = getUserSystemPrompt(userId);
  conversations[userId] = [{ role: "system", content: systemPrompt }];
}

// 创建对话历史嵌入式消息
function createHistoryEmbed(userId, page = 0) {
  const history = conversations[userId] || [];

  // 跳过系统提示消息
  const userMessages = history.slice(1);
  const totalPages = Math.ceil(userMessages.length / MESSAGES_PER_PAGE);

  // 确保页码在有效范围内
  page = Math.max(0, Math.min(page, totalPages - 1));

  // 计算当前页的消息
  const startIndex = page * MESSAGES_PER_PAGE;
  const endIndex = Math.min(
    startIndex + MESSAGES_PER_PAGE,
    userMessages.length,
  );
  const pageMessages = userMessages.slice(startIndex, endIndex);

  // 创建嵌入式消息
  const embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("对话历史")
    .setDescription(
      `显示第 ${startIndex + 1} 到 ${endIndex} 条消息，共 ${userMessages.length} 条`,
    )
    .setFooter({ text: `第 ${page + 1} 页，共 ${totalPages} 页` });

  // 添加消息到嵌入式消息
  for (let i = 0; i < pageMessages.length; i++) {
    const message = pageMessages[i];
    const role = message.role === "user" ? "你" : "AI";

    // 截断过长的消息
    let content = message.content;
    if (typeof content === "string") {
      if (content.length > 1024) {
        content = content.substring(0, 1021) + "...";
      }
    } else if (Array.isArray(content)) {
      // 处理包含图片的消息
      content = "包含图片的消息";
    }

    embed.addField(`${role}:`, content);
  }

  return { embed, currentPage: page, totalPages };
}

// 创建分页按钮
function createPaginationButtons(currentPage, totalPages) {
  const row = new MessageActionRow();

  // 添加上一页按钮
  row.addComponents(
    new MessageButton()
      .setCustomId("prev_page")
      .setLabel("上一页")
      .setStyle("PRIMARY")
      .setDisabled(currentPage <= 0),
  );

  // 添加下一页按钮
  row.addComponents(
    new MessageButton()
      .setCustomId("next_page")
      .setLabel("下一页")
      .setStyle("PRIMARY")
      .setDisabled(currentPage >= totalPages - 1),
  );

  return row;
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

  (async () => {
    try {
      // 在所有服务器上注册命令
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("Successfully registered application commands globally.");
    } catch (error) {
      console.error(error);
    }
  })();
});

// 当收到 interaction (斜杠命令) 时触发
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  const userId = interaction.user.id;

  // 处理按钮交互
  if (interaction.isButton()) {
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

  // 处理命令交互
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === "ai") {
      // 检查用户是否配置了API Key
      const userConfig = getUserAIConfig(userId);
      if (!userConfig.apiKey) {
        await interaction.reply({
          content: "您还没有配置您的 OpenAI API 密钥。请使用 `/configai` 命令进行设置。",
          ephemeral: true,
        });
        return;
      }

      // 获取用户输入的消息
      const userMessage = interaction.options.getString("message");
      // 获取用户提供的图片URL（如果有）
      const imageUrl = interaction.options.getString("pic");

      // 先回复一个临时消息，因为 API 调用可能需要一些时间
      await interaction.deferReply();

      try {
        // 初始化用户的对话历史（如果不存在）
        if (!conversations[userId]) {
          initializeConversation(userId);
        }

        // 准备消息内容
        let userContent;

        // 如果提供了图片URL，添加图片到消息中
        if (imageUrl) {
          userContent = [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: imageUrl } },
          ];

          // 添加用户消息（包含图片）到对话历史
          conversations[userId].push({
            role: "user",
            content: userContent,
          });
        } else {
          // 否则只添加文本消息
          conversations[userId].push({ role: "user", content: userMessage });
        }
        // 创建API消息数组的副本
        const apiMessages = [...conversations[userId]];

        console.log("Sending to OpenAI:", JSON.stringify(apiMessages, null, 2));

        // 获取用户特定的OpenAI客户端
        const userOpenAI = getUserOpenAI(userId);

        // 调用 OpenAI API，传递完整的对话历史
        const response = await userOpenAI.chat.completions.create({
          model: userConfig.model || "google/gemini-2.0-flash-001", // 使用用户配置的模型
          messages: apiMessages,
          max_tokens: userConfig.max_tokens || 2048,
          temperature: userConfig.temperature || 1.0,
          top_p: userConfig.top_p || 0.9,
        });
        // 获取 AI 的回复
        const aiResponse = response.choices[0].message.content;

        // 添加AI回复到对话历史
        conversations[userId].push({ role: "assistant", content: aiResponse });

        // 如果对话历史太长，删除最早的消息（保留 system 消息）
        if (conversations[userId].length > MAX_HISTORY_LENGTH + 1) {
          conversations[userId] = [
            conversations[userId][0],
            ...conversations[userId].slice(-MAX_HISTORY_LENGTH),
          ];
        }

        // 发送回复
        let replyContent = `${aiResponse}`;

        // 如果消息太长，Discord可能会拒绝发送
        if (replyContent.length > 2000) {
          replyContent = replyContent.substring(0, 1997) + "...";
        }

        await interaction.editReply({
          content: replyContent,
        });
      } catch (error) {
        console.error("Error calling OpenAI API:", error);
        await interaction.editReply({
          content: `抱歉，调用 AI 时出现了错误: ${error.message}`,
        });
      }
    } else if (commandName === "clear") {
      // 清除用户的对话历史，但保持系统提示
      initializeConversation(userId);

      await interaction.reply({
        content: "你的对话历史已清除。系统提示保持不变。",
        ephemeral: true,
      });
    } else if (commandName === "system") {
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
    } else if (commandName === "reset_system") {
      // 重置系统提示为默认值
      setUserSystemPrompt(userId, DEFAULT_SYSTEM_PROMPT);

      await interaction.reply({
        content: `系统提示已重置为默认值: "${DEFAULT_SYSTEM_PROMPT}"`,
        ephemeral: true,
      });
    } else if (commandName === "listhis") {
      // 检查用户是否有对话历史
      if (!conversations[userId] || conversations[userId].length <= 1) {
        await interaction.reply({
          content: "你还没有任何对话历史。",
          ephemeral: true,
        });
        return;
      }
      // 处理configai命令
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
    } else if (commandName === "configai") {
      // 处理configai命令
      await configAICommand.execute(interaction);
    } else if (commandName === "getemoji") {
      // 处理getemoji命令
      await touemoji(interaction);
    } else if (commandName === "发送消息") {
      await handleSendMessage(interaction);
    } else if (commandName === "setme") {
      // 处理setme命令
      await setmeCommand.execute(interaction);
    }
  }
});

// 设置一个定时器，清理过期的分页数据（例如，30分钟后）
setInterval(
  () => {
    const now = Date.now();
    for (const userId in historyPagination) {
      if (now - historyPagination[userId].timestamp > 30 * 60 * 1000) {
        delete historyPagination[userId];
      }
    }
  },
  10 * 60 * 1000,
); // 每10分钟检查一次

// 使用你的 Bot Token 登录 Discord
client.login(token);
